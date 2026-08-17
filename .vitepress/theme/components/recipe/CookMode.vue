<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ChefHat, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from '@lucide/vue'

const props = defineProps({
  recipeTitle: {
    type: String,
    required: true,
  },
  steps: {
    type: Array,
    default: () => [],
  },
})

const isOpen = ref(false)
const activeIndex = ref(0)
const dialogRef = ref(null)
const closeButtonRef = ref(null)
const launchButtonRef = ref(null)
let returnFocusElement = null

const activeStep = computed(() => props.steps[activeIndex.value] ?? null)
const stepCounter = computed(() => {
  if (!props.steps.length) return '00 / 00'
  return `${String(activeIndex.value + 1).padStart(2, '0')} / ${String(props.steps.length).padStart(2, '0')}`
})
const isFirstStep = computed(() => activeIndex.value === 0)
const isLastStep = computed(() => activeIndex.value === props.steps.length - 1)

function openMode() {
  if (!props.steps.length) return

  returnFocusElement = document.activeElement
  activeIndex.value = 0
  isOpen.value = true
  document.documentElement.classList.add('cook-mode-open')
  nextTick(() => closeButtonRef.value?.focus())
}

function closeMode() {
  isOpen.value = false
  document.documentElement.classList.remove('cook-mode-open')
  nextTick(() => {
    if (returnFocusElement?.isConnected) {
      returnFocusElement.focus()
    } else {
      launchButtonRef.value?.focus()
    }
    returnFocusElement = null
  })
}

function previousStep() {
  if (!isFirstStep.value) activeIndex.value -= 1
}

function nextStep() {
  if (!isLastStep.value) activeIndex.value += 1
}

function getFocusableElements() {
  if (!dialogRef.value) return []
  return [...dialogRef.value.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
}

function handleKeydown(event) {
  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeMode()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    previousStep()
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    nextStep()
    return
  }

  if (event.key !== 'Tab') return

  const focusableElements = getFocusableElements()
  if (!focusableElements.length) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.documentElement.classList.remove('cook-mode-open')
})
</script>

<template>
  <div class="cook-mode-controller">
    <button
      v-if="steps.length"
      ref="launchButtonRef"
      type="button"
      class="recipe-cook-entry__link"
      :aria-label="`进入 ${recipeTitle} Cook Mode`"
      @click="openMode"
    >
      <ChefHat :size="20" :stroke-width="1.7" aria-hidden="true" />
      进入 Cook Mode
      <Maximize2 :size="18" :stroke-width="1.7" aria-hidden="true" />
    </button>

    <button v-else type="button" class="recipe-cook-entry__link" disabled>
      <ChefHat :size="20" :stroke-width="1.7" aria-hidden="true" />
      原始内容没有可用步骤
    </button>

    <Transition name="cook-mode-fade">
      <div
        v-if="isOpen && activeStep"
        class="cook-mode"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cook-mode-title"
        @click.self="closeMode"
      >
        <section ref="dialogRef" class="cook-mode__shell">
          <header class="cook-mode__header">
            <div>
              <p class="cook-mode__label">Cook Mode</p>
              <h2 id="cook-mode-title">{{ recipeTitle }}</h2>
            </div>
            <button
              ref="closeButtonRef"
              type="button"
              class="cook-mode__exit"
              aria-label="退出 Cook Mode"
              @click="closeMode"
            >
              <Minimize2 :size="20" :stroke-width="1.7" aria-hidden="true" />
              <span>退出</span>
            </button>
          </header>

          <div class="cook-mode__stage">
            <div class="cook-mode__counter" aria-live="polite" aria-atomic="true">
              <span>当前步骤</span>
              <strong>{{ stepCounter }}</strong>
            </div>

            <div class="cook-mode__content" aria-live="polite" aria-atomic="true">
              <Transition name="cook-step" mode="out-in">
                <div :key="activeIndex">
                  <p class="cook-mode__step-text">{{ activeStep.text }}</p>
                  <ol v-if="activeStep.substeps?.length" class="cook-mode__substeps">
                    <li v-for="substep in activeStep.substeps" :key="`${substep.marker}-${substep.text}`">
                      <span>{{ substep.marker }}</span>
                      <p>{{ substep.text }}</p>
                    </li>
                  </ol>
                </div>
              </Transition>
            </div>
          </div>

          <footer class="cook-mode__controls">
            <button
              type="button"
              class="cook-mode__control"
              :disabled="isFirstStep"
              aria-label="上一步"
              aria-keyshortcuts="ArrowLeft"
              @click="previousStep"
            >
              <ChevronLeft :size="22" :stroke-width="1.7" aria-hidden="true" />
              <span>上一步</span>
            </button>

            <p v-if="isLastStep" class="cook-mode__status">已到最后一步</p>
            <p v-else class="cook-mode__status">键盘也可以切换步骤</p>

            <button
              type="button"
              class="cook-mode__control cook-mode__control--next"
              :disabled="isLastStep"
              aria-label="下一步"
              aria-keyshortcuts="ArrowRight"
              @click="nextStep"
            >
              <span>下一步</span>
              <ChevronRight :size="22" :stroke-width="1.7" aria-hidden="true" />
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </div>
</template>
