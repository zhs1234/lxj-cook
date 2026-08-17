<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const progressBar = ref(null)
let animationFrame = 0

function updateProgress() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0
  progressBar.value?.style.setProperty('--scroll-progress', String(Math.min(Math.max(progress, 0), 1)))
}

function handleScroll() {
  if (animationFrame) return
  animationFrame = requestAnimationFrame(() => {
    animationFrame = 0
    updateProgress()
  })
}

onMounted(() => {
  updateProgress()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  if (animationFrame) cancelAnimationFrame(animationFrame)
})
</script>

<template>
  <div ref="progressBar" class="scroll-progress" aria-hidden="true">
    <span class="scroll-progress__bar" />
  </div>
</template>
