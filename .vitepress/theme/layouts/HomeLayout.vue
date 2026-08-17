<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowUpRight } from '@lucide/vue'

import categoriesData from '../../generated/categories.generated.json'
import imagesData from '../../generated/images.generated.json'
import recipesData from '../../generated/recipes.generated.json'

const homeRoot = ref(null)
let animationContext
let disposed = false

const categories = categoriesData.categories ?? []
const imageMetaBySource = new Map((imagesData.images ?? []).map((image) => [image.sourcePath, image]))
const recipeById = new Map((recipesData.recipes ?? []).map((recipe) => [recipe.id, recipe]))
const curatedIds = [
  '炒菜/肥肠鸡',
  '烫菜/麻辣鸡块',
  '蒸菜/剁椒鱼头（草鱼头版）',
  '主食/大大大块牛腩面',
]
const featuredRecipes = curatedIds
  .map((id) => recipeById.get(id))
  .filter((recipe) => recipe?.image)
  .map((recipe) => ({
    ...recipe,
    imageMeta: imageMetaBySource.get(recipe.imageResolution?.sourcePath),
  }))

if (featuredRecipes.length < 4) {
  throw new Error('P4 首页缺少真实菜谱图片样本，停止构建以避免虚构内容。')
}

const heroRecipe = featuredRecipes[0]
const stats = {
  recipes: recipesData.recipes?.length ?? 0,
  categories: categories.length,
  images: (imagesData.images ?? []).filter((image) => image.referenceCount > 0).length,
}

function categoryHref(category) {
  return `/${encodeURIComponent(category.name)}/`
}

onMounted(async () => {
  if (!homeRoot.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const { gsap } = await import('gsap')
  if (disposed || !homeRoot.value) return

  animationContext = gsap.context(() => {
    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })

    intro.from('[data-home-reveal]', {
      opacity: 0,
      y: 24,
      duration: 0.72,
      stagger: 0.08,
      clearProps: 'all',
    })

    intro.from(
      '.home-hero__heat',
      {
        opacity: 0,
        scale: 0.78,
        duration: 1.2,
        ease: 'power2.out',
      },
      '<+0.08',
    )
  }, homeRoot.value)
})

onBeforeUnmount(() => {
  disposed = true
  animationContext?.revert()
})
</script>

<template>
  <div ref="homeRoot" class="home-layout">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-hero__copy" data-home-reveal>
        <p class="home-hero__kicker">Interactive cooking archive</p>
        <h1 id="home-title" class="home-hero__title">
          <span>像老乡鸡</span>
          <span>那样做饭</span>
        </h1>
        <p class="home-hero__lede">
          把真实的 Markdown 菜谱，变成可以进入、浏览和开火的烹饪档案。
        </p>
        <a class="home-link home-link--primary" href="#archive">
          开始探索
          <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
        </a>
      </div>

      <div class="home-hero__visual" aria-label="真实菜谱与项目原始横幅">
        <div class="home-hero__cover" data-home-reveal>
          <img src="/banner.png" alt="项目原始横幅图" width="2048" height="1024" fetchpriority="high" />
        </div>
        <figure class="home-hero__dish" data-home-reveal>
          <div class="home-photo home-photo--hero">
            <img
              :src="heroRecipe.image"
              :alt="heroRecipe.title"
              :width="heroRecipe.imageMeta?.width"
              :height="heroRecipe.imageMeta?.height"
              fetchpriority="high"
            />
          </div>
          <figcaption>
            <strong>{{ heroRecipe.title }}</strong>
            <span>{{ heroRecipe.category }}</span>
          </figcaption>
        </figure>
        <div class="home-hero__heat" aria-hidden="true" />
      </div>
    </section>

    <section id="archive" class="home-section home-rail-section" aria-labelledby="archive-title">
      <div class="home-section__heading">
        <h2 id="archive-title">今天想吃点什么？</h2>
        <p>从真实菜谱中先看一眼，再决定下一道。</p>
        <a class="home-text-link" href="#category-index">
          按分类浏览
          <ArrowUpRight :size="17" :stroke-width="1.8" aria-hidden="true" />
        </a>
      </div>

      <div class="home-recipe-rail" role="list" aria-label="精选真实菜谱">
        <a
          v-for="recipe in featuredRecipes"
          :key="recipe.id"
          class="home-recipe"
          :href="recipe.slug"
          role="listitem"
        >
          <div class="home-photo home-photo--rail">
            <img
              :src="recipe.image"
              :alt="recipe.title"
              :width="recipe.imageMeta?.width"
              :height="recipe.imageMeta?.height"
              loading="lazy"
            />
          </div>
          <div class="home-recipe__caption">
            <span>{{ recipe.category }}</span>
            <h3>{{ recipe.title }}</h3>
            <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
          </div>
        </a>
      </div>
    </section>

    <section id="category-index" class="home-section home-category-section" aria-labelledby="category-title">
      <div class="home-section__heading">
        <h2 id="category-title">按真实分类，找到下一道菜。</h2>
        <p>菜谱、分类和图片均来自内容生成流程，不额外编造评分或热度。</p>
      </div>

      <nav class="home-category-grid" aria-label="全部菜谱分类">
        <a
          v-for="category in categories"
          :key="category.id"
          class="home-category-link"
          :href="categoryHref(category)"
        >
          <span class="home-category-link__name">{{ category.name }}</span>
          <span class="home-category-link__count">{{ category.recipeCount }} recipes</span>
          <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
        </a>
      </nav>
    </section>

    <section class="home-section home-note" aria-labelledby="project-note-title">
      <div class="home-section__heading">
        <h2 id="project-note-title">这是一个非官方的菜谱档案。</h2>
        <p>本项目与老乡鸡官方没有关联，也不是任何官方站点。内容来自仓库中的原始 Markdown，欢迎继续查阅、补充和贡献真实图片。</p>
      </div>
      <dl class="home-stats" aria-label="档案统计">
        <div>
          <dt>Recipes</dt>
          <dd>{{ stats.recipes }}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>{{ stats.categories }}</dd>
        </div>
        <div>
          <dt>Images</dt>
          <dd>{{ stats.images }}</dd>
        </div>
      </dl>
      <a class="home-link home-link--outline" href="https://github.com/zhs1234/lxj-cook" target="_blank" rel="noreferrer">
        查看项目仓库
        <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
      </a>
    </section>
  </div>
</template>
