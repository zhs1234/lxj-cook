<script setup>
import { onBeforeUnmount, onMounted, watch, ref } from 'vue'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  edges: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select', 'degraded'])
const canvas = ref(null)

let context = null
let frameId = 0
let resizeObserver = null
let intersectionObserver = null
let visible = false
let failed = false
let width = 1
let height = 1
let dpr = 1
let points = []
let frameSamples = []

function stopAnimation() {
  if (!frameId) return
  cancelAnimationFrame(frameId)
  frameId = 0
}

function degrade() {
  if (failed) return
  failed = true
  stopAnimation()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  context = null
  emit('degraded')
}

function resize() {
  if (!canvas.value || !context) return
  const bounds = canvas.value.getBoundingClientRect()
  width = Math.max(1, bounds.width)
  height = Math.max(1, bounds.height)
  dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  canvas.value.width = Math.round(width * dpr)
  canvas.value.height = Math.round(height * dpr)
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  layoutPoints()
}

function layoutPoints() {
  const centerX = width * 0.52
  const centerY = height * 0.5
  const radiusX = Math.max(100, width * 0.37)
  const radiusY = Math.max(90, height * 0.34)
  points = props.nodes.map((node, index) => {
    const angle = (index / Math.max(props.nodes.length, 1)) * Math.PI * 2 - Math.PI / 2
    const depth = 0.84 + (index % 5) * 0.035
    return {
      ...node,
      x: centerX + Math.cos(angle) * radiusX * depth,
      y: centerY + Math.sin(angle) * radiusY * depth,
      angle,
    }
  })
}

function pointRadius(point) {
  return 4 + Math.min(8, Math.sqrt(point.count || 1) * 0.7)
}

function draw(timestamp = 0) {
  if (!context || failed) return
  context.clearRect(0, 0, width, height)

  const pointsById = new Map(points.map((point) => [point.id, point]))
  context.lineWidth = 1
  for (const edge of props.edges) {
    const source = pointsById.get(edge.source)
    const target = pointsById.get(edge.target)
    if (!source || !target) continue
    const active = source.id === props.activeId || target.id === props.activeId
    context.strokeStyle = active ? 'rgba(223, 77, 50, 0.34)' : 'rgba(104, 101, 92, 0.16)'
    context.beginPath()
    context.moveTo(source.x, source.y)
    context.lineTo(target.x, target.y)
    context.stroke()
  }

  for (const point of points) {
    const isActive = point.id === props.activeId
    const drift = Math.sin(timestamp * 0.00035 + point.angle * 2.1) * 2.5
    const x = point.x + drift
    const y = point.y + Math.cos(timestamp * 0.00028 + point.angle) * 1.5
    const radius = pointRadius(point) + (isActive ? 2 : 0)

    context.beginPath()
    context.fillStyle = isActive ? 'rgba(223, 77, 50, 0.94)' : 'rgba(27, 28, 24, 0.78)'
    context.arc(x, y, radius, 0, Math.PI * 2)
    context.fill()

    if (isActive) {
      context.beginPath()
      context.strokeStyle = 'rgba(223, 77, 50, 0.26)'
      context.lineWidth = 1
      context.arc(x, y, radius + 7, 0, Math.PI * 2)
      context.stroke()
    }
  }
}

function render(timestamp) {
  frameId = 0
  if (!visible || failed || document.hidden) return
  draw(timestamp)
  frameSamples.push(timestamp)
  if (frameSamples.length > 18) frameSamples.shift()
  if (frameSamples.length === 18) {
    const elapsed = frameSamples.at(-1) - frameSamples[0]
    if (elapsed > 900) {
      degrade()
      return
    }
  }
  frameId = requestAnimationFrame(render)
}

function syncVisibility(nextVisible) {
  visible = nextVisible
  if (!visible) {
    stopAnimation()
    return
  }
  if (!frameId) frameId = requestAnimationFrame(render)
}

function pointerPosition(event) {
  const bounds = canvas.value.getBoundingClientRect()
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  }
}

function findPoint(event) {
  const position = pointerPosition(event)
  return points.find((point) => {
    const drift = Math.sin(performance.now() * 0.00035 + point.angle * 2.1) * 2.5
    const x = point.x + drift
    const y = point.y + Math.cos(performance.now() * 0.00028 + point.angle) * 1.5
    const radius = pointRadius(point) + 10
    return Math.hypot(position.x - x, position.y - y) <= radius
  })
}

function handlePointerMove(event) {
  const point = findPoint(event)
  if (point) emit('select', point.id)
}

function handlePointerDown(event) {
  const point = findPoint(event)
  if (point) emit('select', point.id)
}

function initialize() {
  context = canvas.value?.getContext('2d', { alpha: true })
  if (!context) {
    degrade()
    return
  }

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.value)
  } else {
    resize()
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
  resize()
}

watch(
  [() => props.nodes, () => props.edges, () => props.activeId],
  () => {
    layoutPoints()
    draw(performance.now())
  },
  { deep: true },
)

onMounted(initialize)
onBeforeUnmount(() => {
  stopAnimation()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  context = null
  points = []
})
</script>

<template>
  <canvas
    ref="canvas"
    class="ingredient-universe__canvas"
    aria-hidden="true"
    @pointermove="handlePointerMove"
    @pointerdown="handlePointerDown"
  />
</template>
