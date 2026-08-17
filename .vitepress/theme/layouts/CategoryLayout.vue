<script setup>
import { computed } from 'vue'
import { ArrowLeft, ArrowRight, ArrowUpRight, ImageOff } from '@lucide/vue'

import categoriesData from '../../generated/categories.generated.json'
import recipesData from '../../generated/recipes.generated.json'

const props = defineProps({
  categoryName: {
    type: String,
    required: true,
  },
})

const categories = categoriesData.categories ?? []
const recipeById = new Map((recipesData.recipes ?? []).map((recipe) => [recipe.id, recipe]))

const category = computed(() => categories.find((item) => item.name === props.categoryName))

if (!category.value) {
  throw new Error(`P5 分类路由没有对应的真实分类数据：${props.categoryName}`)
}

const categoryIndex = computed(() => categories.findIndex((item) => item.id === category.value.id) + 1)
const categoryRecipes = computed(() =>
  category.value.recipeIds.map((id) => recipeById.get(id)).filter(Boolean),
)
const heroRecipe = computed(() => categoryRecipes.value.find((recipe) => recipe.image) ?? null)
const previousCategory = computed(() => categories[categoryIndex.value - 2] ?? null)
const nextCategory = computed(() => categories[categoryIndex.value] ?? null)

function categoryHref(item) {
  return `/${encodeURIComponent(item.name)}/`
}

function recipeClasses(recipe, index) {
  return {
    'category-recipe-item--wide': index % 5 === 0,
    'category-recipe-item--offset': index % 5 === 2,
    'category-recipe-item--missing': !recipe.image,
  }
}

function recipeIndex(index) {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div class="category-layout">
    <section class="category-hero" aria-labelledby="category-title">
      <div class="category-hero__copy">
        <p class="category-hero__index">{{ String(categoryIndex).padStart(2, '0') }} / {{ categories.length }}</p>
        <h1 id="category-title" class="category-hero__title">
          <span v-for="(character, index) in category.name.split('')" :key="`${character}-${index}`">
            {{ character }}
          </span>
        </h1>
        <p class="category-hero__lede">
          从仓库原始 Markdown 进入「{{ category.name }}」的真实记录，按菜名浏览下一道。
        </p>
        <a class="category-link category-link--primary" href="#recipe-list">
          浏览本类菜谱
          <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
        </a>
      </div>

      <figure v-if="heroRecipe" class="category-hero__media">
        <div class="category-hero__image-frame">
          <img
            :src="heroRecipe.image"
            :alt="heroRecipe.title"
            :width="heroRecipe.imageResolution?.width"
            :height="heroRecipe.imageResolution?.height"
            fetchpriority="high"
          />
        </div>
        <figcaption>
          <strong>{{ heroRecipe.title }}</strong>
          <span>本类首张已解析图片</span>
        </figcaption>
      </figure>

      <div v-else class="category-hero__media category-hero__media--empty" aria-label="本分类暂无已解析图片">
        <ImageOff :size="30" :stroke-width="1.4" aria-hidden="true" />
        <strong>{{ category.name }}</strong>
        <span>本分类暂无已解析图片</span>
      </div>
    </section>

    <section id="recipe-list" class="category-recipe-section" aria-labelledby="recipe-list-title">
      <header class="category-section-heading">
        <h2 id="recipe-list-title">{{ category.name }}，一条一条看。</h2>
        <p>{{ category.recipeCount }} 条记录，保留原始 Markdown 的菜名和图片状态。</p>
      </header>

      <ul class="category-recipe-grid" aria-label="分类菜谱列表">
        <li
          v-for="(recipe, index) in categoryRecipes"
          :key="recipe.id"
          class="category-recipe-item"
          :class="recipeClasses(recipe, index)"
        >
          <a
            class="category-recipe"
            :href="recipe.slug"
            :data-transition-image="recipe.image || undefined"
          >
            <article>
              <div v-if="recipe.image" class="category-recipe__media">
                <img
                  :src="recipe.image"
                  :alt="recipe.title"
                  :width="recipe.imageResolution?.width"
                  :height="recipe.imageResolution?.height"
                  loading="lazy"
                />
              </div>
              <div v-else class="category-recipe__media category-recipe__media--missing">
                <ImageOff :size="24" :stroke-width="1.4" aria-hidden="true" />
                <span>暂无图片</span>
              </div>
              <div class="category-recipe__info">
                <span class="category-recipe__index">{{ recipeIndex(index) }}</span>
                <span class="category-recipe__category">{{ category.name }}</span>
                <h3>{{ recipe.title }}</h3>
                <ArrowUpRight class="category-recipe__arrow" :size="18" :stroke-width="1.8" aria-hidden="true" />
              </div>
            </article>
          </a>
        </li>
      </ul>
    </section>

    <nav class="category-next-nav" aria-label="分类导航">
      <a v-if="previousCategory" class="category-next-nav__link" :href="categoryHref(previousCategory)">
        <ArrowLeft :size="18" :stroke-width="1.8" aria-hidden="true" />
        <span>上一分类</span>
        <strong>{{ previousCategory.name }}</strong>
      </a>
      <a class="category-next-nav__all" href="/#category-index">
        <span>全部分类</span>
        <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
      </a>
      <a v-if="nextCategory" class="category-next-nav__link category-next-nav__link--next" :href="categoryHref(nextCategory)">
        <span>下一分类</span>
        <strong>{{ nextCategory.name }}</strong>
        <ArrowRight :size="18" :stroke-width="1.8" aria-hidden="true" />
      </a>
    </nav>
  </div>
</template>
