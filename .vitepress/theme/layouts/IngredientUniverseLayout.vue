<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowUpRight, RotateCcw, Search } from '@lucide/vue'

import ingredientsData from '../../generated/ingredients.generated.json'
import recipesData from '../../generated/recipes.generated.json'
import relationsData from '../../generated/relations.generated.json'
import { getMotionCapabilities } from '../utils/motion-capabilities.js'

const IngredientUniverseCanvas = defineAsyncComponent(() => import('../components/webgl/IngredientUniverseCanvas.vue'))

const ingredients = (ingredientsData.ingredients ?? [])
  .slice()
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN-u-co-pinyin'))
const recipes = recipesData.recipes ?? []
const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
const relationByRecipeId = new Map(
  (relationsData.relations ?? []).map((relation) => [relation.recipeId, relation]),
)
const visibleNodeLimit = 48
const listLimit = 36
const query = ref('')
const selectedId = ref(ingredients[0]?.id ?? '')
const ingredientSearchInput = ref(null)
const canvasMount = ref(null)
const canvasVisible = ref(false)
let canvasObserver = null
let idleHandle = null

function normalizeValue(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[\s\u3000]+/gu, '')
}

const normalizedQuery = computed(() => normalizeValue(query.value))
const visualIngredients = computed(() => ingredients.slice(0, visibleNodeLimit))
const edges = computed(() => {
  const nextEdges = []
  for (let sourceIndex = 0; sourceIndex < visualIngredients.value.length; sourceIndex += 1) {
    const source = visualIngredients.value[sourceIndex]
    const sourceRecipes = new Set(source.recipeIds)
    for (let targetIndex = sourceIndex + 1; targetIndex < visualIngredients.value.length; targetIndex += 1) {
      const target = visualIngredients.value[targetIndex]
      const overlap = target.recipeIds.reduce(
        (count, recipeId) => count + (sourceRecipes.has(recipeId) ? 1 : 0),
        0,
      )
      if (overlap > 0) {
        nextEdges.push({ source: source.id, target: target.id, strength: overlap })
      }
    }
  }
  return nextEdges.sort((a, b) => b.strength - a.strength).slice(0, 180)
})

const filteredIngredients = computed(() => {
  if (!normalizedQuery.value) return ingredients
  return ingredients.filter((ingredient) => normalizeValue(ingredient.name).includes(normalizedQuery.value))
})

const visibleIngredients = computed(() => filteredIngredients.value.slice(0, listLimit))
const selectedIngredient = computed(() => ingredients.find((ingredient) => ingredient.id === selectedId.value) ?? ingredients[0])
const selectedRecipes = computed(() =>
  (selectedIngredient.value?.recipeIds ?? [])
    .map((recipeId) => recipeById.get(recipeId))
    .filter(Boolean),
)
const relatedRecipeCount = computed(() => {
  const relatedIds = new Set()
  for (const recipe of selectedRecipes.value) {
    for (const item of relationByRecipeId.get(recipe.id)?.related ?? []) {
      relatedIds.add(item.recipeId)
    }
  }
  return relatedIds.size
})
const resultSummary = computed(() => {
  if (!normalizedQuery.value) return `显示 ${visibleIngredients.value.length} 个高频食材节点，共 ${ingredients.length} 个解析食材。`
  if (!filteredIngredients.value.length) return `没有找到“${query.value}”对应的食材。`
  return `显示 ${visibleIngredients.value.length} 个结果，共 ${filteredIngredients.value.length} 个匹配食材。`
})

function selectIngredient(id) {
  if (!ingredients.some((ingredient) => ingredient.id === id)) return
  selectedId.value = id
}

function reselectIngredient() {
  query.value = ''
  nextTick(() => ingredientSearchInput.value?.focus())
}

function recipeHref(recipe) {
  return recipe.slug
}

function queueCanvasLoad() {
  if (!canvasMount.value || !getMotionCapabilities().advanced) return

  const load = () => {
    canvasVisible.value = true
    canvasObserver?.disconnect()
  }
  const schedule = () => {
    if ('requestIdleCallback' in window) {
      idleHandle = { kind: 'idle', id: window.requestIdleCallback(load, { timeout: 1200 }) }
    } else {
      idleHandle = { kind: 'timeout', id: window.setTimeout(load, 120) }
    }
  }

  if (!('IntersectionObserver' in window)) {
    schedule()
    return
  }

  canvasObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) schedule()
    },
    { rootMargin: '160px 0px' },
  )
  canvasObserver.observe(canvasMount.value)
}

onMounted(queueCanvasLoad)
onBeforeUnmount(() => {
  canvasObserver?.disconnect()
  if (!idleHandle) return
  if (idleHandle.kind === 'idle' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(idleHandle.id)
  } else {
    window.clearTimeout(idleHandle.id)
  }
})
</script>

<template>
  <div class="ingredient-universe">
    <section class="ingredient-universe__hero" aria-labelledby="ingredient-universe-title">
      <div>
        <p class="type-meta">Ingredient Universe</p>
        <h1 id="ingredient-universe-title">食材之间，有路径。</h1>
        <p>
          这里的节点和连线都来自真实菜谱配料与关系数据。选中一个食材，继续钻进使用它的菜谱。
        </p>
        <a class="ingredient-universe__home-link" href="/">
          返回首页
          <ArrowUpRight :size="17" :stroke-width="1.8" aria-hidden="true" />
        </a>
      </div>

      <div class="ingredient-universe__hero-panel">
        <div ref="canvasMount" class="ingredient-universe__stage" aria-label="食材关系可视化">
          <IngredientUniverseCanvas
            v-if="canvasVisible"
            :nodes="visualIngredients"
            :edges="edges"
            :active-id="selectedId"
            @select="selectIngredient"
            @degraded="canvasVisible = false"
          />
          <div v-else class="ingredient-universe__stage-fallback" aria-hidden="true">
            <span>{{ selectedIngredient?.name }}</span>
            <small>{{ selectedIngredient?.count }} 道菜谱</small>
          </div>
        </div>

        <aside v-if="selectedIngredient" class="ingredient-universe__detail" aria-labelledby="selected-ingredient-title">
          <p class="type-meta">Selected ingredient</p>
          <h2 id="selected-ingredient-title">{{ selectedIngredient.name }}</h2>
          <p>
            这个食材出现在 {{ selectedIngredient.count }} 道真实菜谱中，并与 {{ relatedRecipeCount }} 道关联菜谱相连。
          </p>

          <button class="ingredient-universe__reselect" type="button" @click="reselectIngredient">
            <RotateCcw :size="16" :stroke-width="1.8" aria-hidden="true" />
            <span>重选食材</span>
          </button>

          <ul class="ingredient-universe__recipes" aria-label="使用该食材的菜谱">
            <li v-for="recipe in selectedRecipes.slice(0, 8)" :key="recipe.id">
              <a
                :href="recipeHref(recipe)"
                :data-transition-image="recipe.image || undefined"
              >
                <span>{{ recipe.title }}</span>
                <ArrowUpRight :size="17" :stroke-width="1.8" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="ingredient-universe__explore" aria-labelledby="ingredient-list-title">
      <div class="ingredient-universe__list-column">
        <header class="ingredient-universe__heading">
          <h2 id="ingredient-list-title">从一个食材开始。</h2>
          <p id="ingredient-list-description" aria-live="polite">{{ resultSummary }}</p>
        </header>

        <form class="ingredient-universe__search" role="search" @submit.prevent>
          <Search :size="19" :stroke-width="1.8" aria-hidden="true" />
          <label class="sr-only" for="ingredient-search-input">搜索食材</label>
          <input
            ref="ingredientSearchInput"
            id="ingredient-search-input"
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="搜索食材"
            aria-describedby="ingredient-list-description"
          />
        </form>

        <p v-if="!visibleIngredients.length" class="ingredient-universe__empty">
          没有匹配的食材，请换一个关键词。
        </p>
        <ul v-else class="ingredient-universe__list" aria-label="食材节点列表">
          <li v-for="ingredient in visibleIngredients" :key="ingredient.id">
            <button
              type="button"
              :class="{ 'is-active': ingredient.id === selectedId }"
              :aria-pressed="ingredient.id === selectedId"
              @click="selectIngredient(ingredient.id)"
            >
              <span>{{ ingredient.name }}</span>
              <small>{{ ingredient.count }} 道菜谱</small>
            </button>
          </li>
        </ul>
      </div>

    </section>
  </div>
</template>
