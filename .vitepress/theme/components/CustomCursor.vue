<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const enabled = ref(false)
const visible = ref(false)
let pointerQuery
let motionQuery

function supportsEnhancement() {
  return pointerQuery?.matches && !motionQuery?.matches
}

function syncMode() {
  enabled.value = Boolean(supportsEnhancement())
  if (enabled.value) {
    document.documentElement.classList.add('has-custom-cursor')
  } else {
    document.documentElement.classList.remove('has-custom-cursor')
    visible.value = false
  }
}

function handlePointerMove(event) {
  if (!enabled.value) return
  document.documentElement.style.setProperty('--cursor-x', `${event.clientX}px`)
  document.documentElement.style.setProperty('--cursor-y', `${event.clientY}px`)
  visible.value = true
}

function handlePointerLeave() {
  visible.value = false
}

onMounted(() => {
  pointerQuery = window.matchMedia('(pointer: fine)')
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  syncMode()
  pointerQuery.addEventListener('change', syncMode)
  motionQuery.addEventListener('change', syncMode)
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
  document.addEventListener('mouseleave', handlePointerLeave)
})

onBeforeUnmount(() => {
  pointerQuery?.removeEventListener('change', syncMode)
  motionQuery?.removeEventListener('change', syncMode)
  window.removeEventListener('pointermove', handlePointerMove)
  document.removeEventListener('mouseleave', handlePointerLeave)
  document.documentElement.classList.remove('has-custom-cursor')
})
</script>

<template>
  <span v-if="enabled" class="custom-cursor" :class="{ 'custom-cursor--visible': visible }" aria-hidden="true" />
</template>
