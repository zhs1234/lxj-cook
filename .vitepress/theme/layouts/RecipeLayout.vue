<script setup>
import { computed } from 'vue'
import { ArrowUpRight, ImageOff } from '@lucide/vue'

import relationsData from '../../generated/relations.generated.json'
import recipesData from '../../generated/recipes.generated.json'
import CookMode from '../components/recipe/CookMode.vue'

const props = defineProps({
  recipeId: {
    type: String,
    required: true,
  },
})

const recipes = recipesData.recipes ?? []
const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]))
const relationsByRecipeId = new Map(
  (relationsData.relations ?? []).map((relation) => [relation.recipeId, relation]),
)

const recipe = computed(() => recipeById.get(props.recipeId))

if (!recipe.value) {
  throw new Error(`P6 菜谱路由没有对应的真实菜谱数据：${props.recipeId}`)
}

const ingredients = computed(() => recipe.value.ingredients ?? [])
const steps = computed(() => recipe.value.steps ?? [])
const hasNutrition = computed(() => Boolean(recipe.value.nutrition?.entries?.length))
const relatedRecipes = computed(() => {
  const relation = relationsByRecipeId.get(recipe.value.id)
  return (relation?.related ?? [])
    .map((item) => ({ ...item, recipe: recipeById.get(item.recipeId) }))
    .filter((item) => item.recipe)
    .slice(0, 4)
})

function categoryHref() {
  return `/${encodeURIComponent(recipe.value.category)}/`
}

function stepIndex(step, index) {
  return String(step.index ?? index + 1).padStart(2, '0')
}

function relationLabel(item) {
  const explainedIngredients = (item.matchReasons ?? [])
    .filter((reason) => reason.type === 'shared-ingredient')
    .map((reason) => reason.value)
  const sharedIngredients = explainedIngredients.length ? explainedIngredients : item.sharedIngredients ?? []
  if (sharedIngredients.length) return `共同食材：${sharedIngredients.join('、')}`
  const titleReason = item.matchReasons?.find((reason) => reason.type === 'title-keyword')
  if (titleReason) return `标题关联：${titleReason.value}`
  if (item.sameCategory) return '同一分类'
  return '档案关联'
}

function ingredientParts(ingredient) {
  let parts = [{ text: ingredient.text, link: null }]

  for (const link of ingredient.links ?? []) {
    if (!link.label || !link.href) continue

    const nextParts = []
    for (const part of parts) {
      if (part.link) {
        nextParts.push(part)
        continue
      }

      const start = part.text.indexOf(link.label)
      if (start < 0) {
        nextParts.push(part)
        continue
      }

      const before = part.text.slice(0, start)
      const after = part.text.slice(start + link.label.length)
      if (before) nextParts.push({ text: before, link: null })
      nextParts.push({ text: link.label, link })
      if (after) nextParts.push({ text: after, link: null })
    }
    parts = nextParts
  }

  return parts
}
</script>

<template>
  <article class="recipe-layout">
    <section class="recipe-hero" aria-labelledby="recipe-title">
      <div class="recipe-hero__copy">
        <a class="recipe-hero__category" :href="categoryHref()">
          {{ recipe.category }}
          <ArrowUpRight :size="16" :stroke-width="1.8" aria-hidden="true" />
        </a>
        <h1 id="recipe-title" class="recipe-hero__title">{{ recipe.title }}</h1>
        <p class="recipe-hero__source">内容来源：{{ recipe.sourcePath }}</p>
        <nav class="recipe-hero__actions" aria-label="菜谱章节导航">
          <a href="#ingredients">先看配料</a>
          <a href="#timeline">进入烹饪步骤</a>
          <a href="#cook-mode-entry">Cook Mode 入口</a>
        </nav>
      </div>

      <figure v-if="recipe.image" class="recipe-hero__media">
        <div class="recipe-hero__image-frame">
          <img
            :src="recipe.image"
            :alt="recipe.title"
            :width="recipe.imageResolution?.width"
            :height="recipe.imageResolution?.height"
            fetchpriority="high"
          />
        </div>
        <figcaption>
          <strong>{{ recipe.title }}</strong>
          <span>{{ recipe.category }}</span>
        </figcaption>
      </figure>

      <div v-else class="recipe-hero__media recipe-hero__media--missing" aria-label="该菜谱暂无已解析图片">
        <ImageOff :size="34" :stroke-width="1.4" aria-hidden="true" />
        <strong>{{ recipe.title }}</strong>
        <span>暂无已解析图片</span>
      </div>
    </section>

      <section id="ingredients" class="recipe-section recipe-ingredients" aria-labelledby="ingredients-title">
        <header class="recipe-section__heading">
          <h2 id="ingredients-title">先把东西摆上台面。</h2>
          <p>配料保持原始记录，仓库中的内部配料链接继续可用。</p>
      </header>

      <ul v-if="ingredients.length" class="recipe-ingredient-list" aria-label="菜谱配料">
        <li v-for="(ingredient, index) in ingredients" :key="`${ingredient.text}-${index}`">
          <span class="recipe-ingredient-list__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="recipe-ingredient-list__text">
            <template v-for="(part, partIndex) in ingredientParts(ingredient)" :key="`${part.text}-${partIndex}`">
              <a v-if="part.link" :href="part.link.href">{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </span>
        </li>
      </ul>
      <p v-else class="recipe-empty-note">原始内容未解析到配料列表。</p>
    </section>

      <section id="timeline" class="recipe-section recipe-timeline-section" aria-labelledby="timeline-title">
        <header class="recipe-section__heading">
          <h2 id="timeline-title">火候跟着步骤走。</h2>
          <p>每一步都保留在页面结构中，适合阅读、查找和后续进入 Cook Mode。</p>
      </header>

      <ol v-if="steps.length" class="recipe-timeline" aria-label="烹饪步骤">
        <li v-for="(step, index) in steps" :key="`${step.index}-${step.text}`" class="recipe-step">
          <div class="recipe-step__rail" aria-hidden="true">
            <span>{{ stepIndex(step, index) }}</span>
          </div>
          <article class="recipe-step__body">
            <h3 class="sr-only">步骤 {{ stepIndex(step, index) }}</h3>
            <p v-if="step.group" class="recipe-step__group">{{ step.group }}</p>
            <p class="recipe-step__action">{{ step.text }}</p>
            <ol v-if="step.substeps?.length" class="recipe-step__substeps">
              <li v-for="substep in step.substeps" :key="`${substep.marker}-${substep.text}`">
                <span>{{ substep.marker }}</span>
                <p>{{ substep.text }}</p>
              </li>
            </ol>
          </article>
        </li>
      </ol>
      <p v-else class="recipe-empty-note">原始内容未解析到烹饪步骤。</p>
    </section>

      <section v-if="hasNutrition" id="nutrition" class="recipe-section recipe-nutrition" aria-labelledby="nutrition-title">
        <header class="recipe-section__heading">
          <h2 id="nutrition-title">有数据，才展示。</h2>
          <p>{{ recipe.nutrition.basis }}</p>
      </header>

      <dl class="recipe-nutrition__list">
        <div v-for="entry in recipe.nutrition.entries" :key="`${entry.label}-${entry.value}`">
          <dt>{{ entry.label }}</dt>
          <dd>{{ entry.value }}</dd>
        </div>
      </dl>
    </section>

      <section v-if="relatedRecipes.length" class="recipe-section recipe-related" aria-labelledby="related-title">
        <header class="recipe-section__heading">
          <h2 id="related-title">继续在这份档案里找。</h2>
          <p>关联关系来自 generated relations 数据，不使用虚构评分或热度。</p>
      </header>

      <ul class="recipe-related__list" aria-label="相关菜谱">
        <li v-for="item in relatedRecipes" :key="item.recipe.id">
          <a
            :href="item.recipe.slug"
            :data-transition-image="item.recipe.image || undefined"
          >
            <div v-if="item.recipe.image" class="recipe-related__media">
              <img
                :src="item.recipe.image"
                :alt="item.recipe.title"
                :width="item.recipe.imageResolution?.width"
                :height="item.recipe.imageResolution?.height"
                loading="lazy"
              />
            </div>
            <div v-else class="recipe-related__media recipe-related__media--missing" aria-label="相关菜谱暂无图片">
              <ImageOff :size="22" :stroke-width="1.4" aria-hidden="true" />
            </div>
            <span>{{ relationLabel(item) }}</span>
            <h3>{{ item.recipe.title }}</h3>
            <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
          </a>
        </li>
      </ul>
    </section>

    <section id="cook-mode-entry" class="recipe-cook-entry" aria-labelledby="cook-mode-title">
      <div>
        <p class="recipe-section__label">Cook Mode Entry</p>
        <h2 id="cook-mode-title">把步骤带到灶台边。</h2>
        <p>进入后可以逐步查看真实烹饪步骤，完整时间线仍保留在当前页面。</p>
      </div>
      <CookMode :steps="steps" :recipe-title="recipe.title" />
    </section>
  </article>
</template>
