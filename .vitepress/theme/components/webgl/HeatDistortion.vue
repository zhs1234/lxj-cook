<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { getMotionCapabilities } from '../../utils/motion-capabilities.js'

const emit = defineEmits(['degraded'])
const canvas = ref(null)

let gl = null
let program = null
let vertexBuffer = null
let vertexShader = null
let fragmentShader = null
let timeUniform = null
let resolutionUniform = null
let frameId = 0
let lastFrameTime = 0
let visible = false
let failed = false
let started = false
let resizeObserver = null
let intersectionObserver = null
let performanceSamples = []

const vertexSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const fragmentSource = `
  precision mediump float;

  uniform float u_time;
  uniform vec2 u_resolution;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float breath = sin(u_time * 1.3 + uv.x * 7.0) * 0.5 + 0.5;
    float wave = sin(uv.y * 26.0 - u_time * 1.8 + sin(uv.x * 11.0 + u_time) * 0.8) * 0.5 + 0.5;
    float plume = smoothstep(0.16, 0.76, uv.y) * (1.0 - smoothstep(0.72, 1.0, uv.y));
    float heat = smoothstep(0.58, 0.98, wave) * plume * (0.55 + breath * 0.45);
    vec3 warm = mix(vec3(0.92, 0.22, 0.08), vec3(0.94, 0.62, 0.14), uv.y);

    gl_FragColor = vec4(warm, heat * 0.2);
  }
`

function stopAnimation() {
  if (!frameId) return
  cancelAnimationFrame(frameId)
  frameId = 0
}

function degrade() {
  if (failed) return
  failed = true
  dispose()
  emit('degraded')
}

function compileShader(type, source) {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function resizeCanvas() {
  if (!canvas.value || !gl) return
  const bounds = canvas.value.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
  const width = Math.max(1, Math.round(bounds.width * dpr))
  const height = Math.max(1, Math.round(bounds.height * dpr))
  if (canvas.value.width === width && canvas.value.height === height) return

  canvas.value.width = width
  canvas.value.height = height
  gl.viewport(0, 0, width, height)
}

function render(timestamp) {
  frameId = 0
  if (!visible || failed || document.hidden) return

  const elapsed = timestamp - lastFrameTime
  if (elapsed < 32) {
    frameId = requestAnimationFrame(render)
    return
  }
  lastFrameTime = timestamp

  resizeCanvas()
  gl.uniform1f(timeUniform, timestamp * 0.001)
  gl.uniform2f(resolutionUniform, canvas.value.width, canvas.value.height)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  performanceSamples.push(elapsed)
  if (performanceSamples.length > 30) performanceSamples.shift()
  if (performanceSamples.length === 30) {
    const average = performanceSamples.reduce((total, value) => total + value, 0) / performanceSamples.length
    if (average > 44) {
      degrade()
      return
    }
  }

  frameId = requestAnimationFrame(render)
}

function startAnimation() {
  if (started || failed || !visible) return
  started = true
  lastFrameTime = 0
  frameId = requestAnimationFrame(render)
}

function syncVisibility(nextVisible) {
  visible = nextVisible
  if (!visible) {
    stopAnimation()
    started = false
    return
  }
  startAnimation()
}

function handleVisibilityChange() {
  syncVisibility(visible && !document.hidden)
}

function handleContextLost(event) {
  event.preventDefault()
  degrade()
}

function dispose() {
  stopAnimation()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  canvas.value?.removeEventListener('webglcontextlost', handleContextLost)

  if (gl) {
    if (program) gl.deleteProgram(program)
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer)
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
  }

  gl = null
  program = null
  vertexBuffer = null
  vertexShader = null
  fragmentShader = null
  timeUniform = null
  resolutionUniform = null
}

function initialize() {
  const capabilities = getMotionCapabilities()
  if (!capabilities.advanced || !canvas.value) {
    degrade()
    return
  }

  gl = canvas.value.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: 'low-power',
  })
  if (!gl) {
    degrade()
    return
  }

  vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource)
  fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource)
  if (!vertexShader || !fragmentShader) {
    degrade()
    return
  }

  program = gl.createProgram()
  if (!program) {
    degrade()
    return
  }
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    degrade()
    return
  }

  vertexBuffer = gl.createBuffer()
  if (!vertexBuffer) {
    degrade()
    return
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  )
  gl.useProgram(program)
  const position = gl.getAttribLocation(program, 'a_position')
  timeUniform = gl.getUniformLocation(program, 'u_time')
  resolutionUniform = gl.getUniformLocation(program, 'u_resolution')
  if (position < 0 || !timeUniform || !resolutionUniform) {
    degrade()
    return
  }
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  canvas.value.addEventListener('webglcontextlost', handleContextLost, false)
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas.value)
  } else {
    resizeCanvas()
  }
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(
      ([entry]) => syncVisibility(entry.isIntersecting),
      { threshold: 0.01 },
    )
    intersectionObserver.observe(canvas.value)
  } else {
    syncVisibility(true)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
}

onMounted(initialize)
onBeforeUnmount(dispose)
</script>

<template>
  <canvas ref="canvas" class="webgl-heat-layer" aria-hidden="true" />
</template>
