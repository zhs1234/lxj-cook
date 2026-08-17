<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowUpRight, X } from '@lucide/vue'

const props = defineProps({
  open: Boolean,
  categories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close'])
const panel = ref(null)
const closeButton = ref(null)

function getFocusableElements() {
  return Array.from(
    panel.value?.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  )
}

function handleKeydown(event) {
  if (!props.open) return

  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const focusable = getFocusableElements()
  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function categoryHref(category) {
  return `/${encodeURIComponent(category.name)}/`
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    closeButton.value?.focus()
  },
)

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition name="overlay-fade">
    <div
      v-if="open"
      ref="panel"
      class="shell-overlay fullscreen-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-title"
      @click.self="emit('close')"
    >
      <div class="fullscreen-menu__panel">
        <header class="fullscreen-menu__header">
          <div>
            <p class="type-meta">Explore / Archive Index</p>
            <h2 id="menu-title" class="type-section">选择一个分类</h2>
          </div>
          <button ref="closeButton" class="icon-button" type="button" aria-label="关闭菜单" @click="emit('close')">
            <X :size="21" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </header>

        <nav class="fullscreen-menu__grid" aria-label="菜谱分类">
          <a
            v-for="(category, index) in categories"
            :key="category.id"
            class="fullscreen-menu__category"
            :href="categoryHref(category)"
            @click="emit('close')"
          >
            <span class="fullscreen-menu__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="fullscreen-menu__name">{{ category.name }}</span>
            <span class="fullscreen-menu__count">{{ category.recipeCount }} recipes</span>
            <ArrowUpRight :size="19" :stroke-width="1.7" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </div>
  </Transition>
</template>
