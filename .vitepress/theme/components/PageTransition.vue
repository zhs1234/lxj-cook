<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'

import { getMotionCapabilities } from '../utils/motion-capabilities.js'

const route = useRoute()
const transitionMedia = ref(null)
const transitionPlaying = ref(false)
const pageReveal = ref(false)
const pageRevealPlaying = ref(false)
let pendingSource = null
let frameId = 0
let timeoutId = 0
let revealFrameId = 0
let revealTimeoutId = 0
const transitionStorageKey = 'cooklike-transition-source'

function handleClick(event) {
  if (!getMotionCapabilities().transition) return
  const target = event.target instanceof Element ? event.target.closest('a[data-transition-image]') : null
  const image = target?.querySelector('img')
  if (!image) return

  const bounds = image.getBoundingClientRect()
  if (bounds.width < 2 || bounds.height < 2) return
  pendingSource = {
    src: image.currentSrc || image.src,
    alt: image.alt,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
  }
  try {
    window.sessionStorage.setItem(transitionStorageKey, JSON.stringify(pendingSource))
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

function clearTransition() {
  if (frameId) cancelAnimationFrame(frameId)
  if (timeoutId) window.clearTimeout(timeoutId)
  frameId = 0
  timeoutId = 0
  transitionPlaying.value = false
  transitionMedia.value = null
}

function clearPageReveal() {
  if (revealFrameId) cancelAnimationFrame(revealFrameId)
  if (revealTimeoutId) window.clearTimeout(revealTimeoutId)
  revealFrameId = 0
  revealTimeoutId = 0
  pageReveal.value = false
  pageRevealPlaying.value = false
}

function startPageReveal() {
  if (!getMotionCapabilities().transition) return
  clearPageReveal()
  pageReveal.value = true
  revealFrameId = requestAnimationFrame(() => {
    revealFrameId = requestAnimationFrame(() => {
      pageRevealPlaying.value = true
    })
  })
  revealTimeoutId = window.setTimeout(clearPageReveal, 680)
}

async function playPendingTransition() {
  if (!pendingSource) return
  const source = pendingSource
  pendingSource = null
  try {
    window.sessionStorage.removeItem(transitionStorageKey)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  await nextTick()

  const target = document.querySelector('.recipe-hero__image-frame img')
  if (!target) {
    startPageReveal()
    return
  }
  const bounds = target.getBoundingClientRect()
  if (bounds.width < 2 || bounds.height < 2) {
    startPageReveal()
    return
  }

  transitionMedia.value = {
    ...source,
    endLeft: bounds.left,
    endTop: bounds.top,
    endWidth: bounds.width,
    endHeight: bounds.height,
    scaleX: source.width / bounds.width,
    scaleY: source.height / bounds.height,
  }
  frameId = requestAnimationFrame(() => {
    frameId = requestAnimationFrame(() => {
      transitionPlaying.value = true
    })
  })
  timeoutId = window.setTimeout(clearTransition, 760)
}

watch(
  () => route.path,
  () => {
    if (!pendingSource) startPageReveal()
    playPendingTransition()
  },
)

onMounted(() => {
  document.addEventListener('click', handleClick, true)
  try {
    const stored = window.sessionStorage.getItem(transitionStorageKey)
    if (stored) pendingSource = JSON.parse(stored)
  } catch {
    pendingSource = null
  }
  if (pendingSource) {
    requestAnimationFrame(playPendingTransition)
  } else {
    startPageReveal()
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClick, true)
  clearTransition()
  clearPageReveal()
  pendingSource = null
})
</script>

<template>
    <div class="page-transition-root">
    <div
      v-if="pageReveal"
      class="page-transition-curtain"
      :class="{ 'page-transition-curtain--playing': pageRevealPlaying }"
      aria-hidden="true"
    />
    <Transition name="page-sweep" mode="out-in">
      <div :key="route.path" class="page-transition-shell">
        <slot />
      </div>
    </Transition>

    <div
      v-if="transitionMedia"
      class="page-transition-media"
      :class="{ 'page-transition-media--playing': transitionPlaying }"
      :style="{
        '--transition-start-left': `${transitionMedia.left}px`,
        '--transition-start-top': `${transitionMedia.top}px`,
        '--transition-end-left': `${transitionMedia.endLeft}px`,
        '--transition-end-top': `${transitionMedia.endTop}px`,
        '--transition-end-width': `${transitionMedia.endWidth}px`,
        '--transition-end-height': `${transitionMedia.endHeight}px`,
        '--transition-start-scale-x': transitionMedia.scaleX,
        '--transition-start-scale-y': transitionMedia.scaleY,
      }"
      aria-hidden="true"
    >
      <img :src="transitionMedia.src" :alt="transitionMedia.alt" />
    </div>
  </div>
</template>
