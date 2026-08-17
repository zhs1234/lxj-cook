<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search, X } from '@lucide/vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const panel = ref(null)
const closeButton = ref(null)
const searchInput = ref(null)
const query = ref('')

function getFocusableElements() {
  return Array.from(
    panel.value?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
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

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    searchInput.value?.focus()
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
      class="shell-overlay search-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-title"
      aria-describedby="search-description"
      @click.self="emit('close')"
    >
      <div class="search-overlay__panel">
        <header class="search-overlay__header">
          <div>
            <p class="type-meta">Search / Archive</p>
            <h2 id="search-title" class="type-section">查找菜谱</h2>
          </div>
          <button ref="closeButton" class="icon-button" type="button" aria-label="关闭搜索" @click="emit('close')">
            <X :size="21" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </header>

        <form class="search-overlay__form" role="search" @submit.prevent>
          <Search :size="24" :stroke-width="1.7" aria-hidden="true" />
          <label class="sr-only" for="recipe-search-input">搜索菜名、分类或食材</label>
          <input
            id="recipe-search-input"
            ref="searchInput"
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="搜索菜名、分类或食材"
          />
          <button v-if="query" class="icon-button" type="button" aria-label="清除搜索内容" @click="query = ''">
            <X :size="19" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </form>

        <p id="search-description" class="search-overlay__hint">
          搜索界面已就绪，菜谱索引将在搜索阶段接入。
        </p>
      </div>
    </div>
  </Transition>
</template>
