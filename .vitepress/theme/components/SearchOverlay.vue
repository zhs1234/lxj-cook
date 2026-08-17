<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowUpRight, Search, X } from '@lucide/vue'

import searchData from '../../generated/search.generated.json'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const panel = ref(null)
const searchInput = ref(null)
const query = ref('')
const activeIndex = ref(0)
const documents = searchData.documents ?? []

function normalizeQuery(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[\s\u3000]+/gu, '')
}

const normalizedQuery = computed(() => normalizeQuery(query.value))
const results = computed(() => {
  const needle = normalizedQuery.value
  if (!needle) return []

  return documents
    .map((document) => {
      const fields = []
      if (document.normalizedTitle.includes(needle)) fields.push('title')
      if (document.normalizedCategory.includes(needle)) fields.push('category')
      const matchedIngredients = document.ingredients.filter((_, index) =>
        document.normalizedIngredients[index]?.includes(needle),
      )
      if (matchedIngredients.length) fields.push('ingredient')
      if (!fields.length) return null

      const primaryField = fields[0]
      return {
        ...document,
        primaryField,
        matchLabel:
          primaryField === 'title'
            ? '菜名匹配'
            : primaryField === 'category'
              ? '分类匹配'
              : `食材匹配：${matchedIngredients.slice(0, 3).join('、')}`,
        rank: primaryField === 'title' ? 3 : primaryField === 'category' ? 2 : 1,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.rank - a.rank || a.title.localeCompare(b.title, 'zh-CN-u-co-pinyin'))
})

const activeResult = computed(() => results.value[activeIndex.value] ?? null)
const resultSummary = computed(() => {
  if (!normalizedQuery.value) return '输入菜名、分类或食材开始搜索。'
  if (!results.value.length) return `没有找到“${query.value}”的菜谱。`
  return `找到 ${results.value.length} 个结果，使用上下方向键选择。`
})

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

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!results.value.length) return
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + direction + results.value.length) % results.value.length
    return
  }

  if (event.key === 'Enter' && document.activeElement === searchInput.value) {
    if (!activeResult.value) return
    event.preventDefault()
    openActiveResult()
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
    query.value = ''
    activeIndex.value = 0
    await nextTick()
    searchInput.value?.focus()
  },
)

watch(results, (nextResults) => {
  if (activeIndex.value >= nextResults.length) activeIndex.value = Math.max(0, nextResults.length - 1)
})

function openActiveResult() {
  if (!activeResult.value) return
  emit('close')
  window.location.assign(activeResult.value.slug)
}

function clearQuery() {
  query.value = ''
  activeIndex.value = 0
  searchInput.value?.focus()
}

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
          <button class="icon-button" type="button" aria-label="关闭搜索" @click="emit('close')">
            <X :size="21" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </header>

        <form class="search-overlay__form" role="search" @submit.prevent="openActiveResult">
          <Search :size="24" :stroke-width="1.7" aria-hidden="true" />
          <label class="sr-only" for="recipe-search-input">搜索菜名、分类或食材</label>
          <input
            id="recipe-search-input"
            ref="searchInput"
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="搜索菜名、分类或食材"
            :aria-activedescendant="activeResult ? `search-result-${activeIndex}` : undefined"
          />
          <button v-if="query" class="icon-button" type="button" aria-label="清除搜索内容" @click="clearQuery">
            <X :size="19" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </form>

        <p id="search-description" class="search-overlay__hint" aria-live="polite">{{ resultSummary }}</p>

        <ul v-if="results.length" class="search-overlay__results" role="listbox" aria-label="菜谱搜索结果">
          <li v-for="(result, index) in results" :key="result.recipeId" class="search-overlay__result">
            <a
              :id="`search-result-${index}`"
              class="search-overlay__result-link"
              :class="{ 'search-overlay__result-link--active': index === activeIndex }"
              :href="result.slug"
              role="option"
              :aria-selected="index === activeIndex"
              @mouseenter="activeIndex = index"
              @focus="activeIndex = index"
              @click="emit('close')"
            >
              <span>
                <span class="search-overlay__result-meta">{{ result.matchLabel }}</span>
                <strong class="search-overlay__result-title">{{ result.title }}</strong>
                <span class="search-overlay__result-context">{{ result.category }}</span>
              </span>
              <ArrowUpRight :size="21" :stroke-width="1.7" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </div>
  </Transition>
</template>
