<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Content, useRoute } from 'vitepress'

import categoriesData from '../generated/categories.generated.json'
import recipesData from '../generated/recipes.generated.json'
import CustomCursor from './components/CustomCursor.vue'
import FullscreenMenu from './components/FullscreenMenu.vue'
import PageTransition from './components/PageTransition.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import SiteHeader from './components/SiteHeader.vue'
import CategoryLayout from './layouts/CategoryLayout.vue'
import HomeLayout from './layouts/HomeLayout.vue'
import IngredientUniverseLayout from './layouts/IngredientUniverseLayout.vue'
import RecipeLayout from './layouts/RecipeLayout.vue'

const route = useRoute()
const siteHeader = ref(null)
const menuOpen = ref(false)
const searchOpen = ref(false)
const categories = categoriesData.categories ?? []
const isHome = computed(() => route.path === '/')
const isIngredients = computed(() => route.path.replace(/\/$/u, '') === '/ingredients')
const categoryName = computed(() => {
  const segments = route.path
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })

  return segments.length === 1 ? segments[0] : null
})
const isCategory = computed(() => categories.some((category) => category.name === categoryName.value))
const recipeIds = new Set((recipesData.recipes ?? []).map((recipe) => recipe.id))
const recipeId = computed(() => {
  const normalizedPath = route.path.replace(/\.html$/, '').replace(/\/$/, '')
  const segments = normalizedPath
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })

  return segments.length === 2 ? segments.join('/') : null
})
const isRecipe = computed(() => recipeIds.has(recipeId.value))

let previousOverflow = ''

function openMenu() {
  searchOpen.value = false
  menuOpen.value = true
}

function closeMenu({ restoreFocus = true } = {}) {
  menuOpen.value = false
  if (restoreFocus) {
    requestAnimationFrame(() => siteHeader.value?.focusMenuButton())
  }
}

function openSearch() {
  menuOpen.value = false
  searchOpen.value = true
}

function closeSearch({ restoreFocus = true } = {}) {
  searchOpen.value = false
  if (restoreFocus) {
    requestAnimationFrame(() => siteHeader.value?.focusSearchButton())
  }
}

function closeOverlays() {
  closeMenu({ restoreFocus: false })
  closeSearch({ restoreFocus: false })
}

watch(
  [menuOpen, searchOpen],
  ([isMenuOpen, isSearchOpen]) => {
    if (typeof document === 'undefined') return

    if (isMenuOpen || isSearchOpen) {
      previousOverflow = document.documentElement.style.overflow
      document.documentElement.style.overflow = 'hidden'
      return
    }

    document.documentElement.style.overflow = previousOverflow
    previousOverflow = ''
  },
)

watch(
  () => route.path,
  () => {
    closeOverlays()
  },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = previousOverflow
  }
})
</script>

<template>
  <div class="site-frame" :class="{ 'site-frame--overlay-open': menuOpen || searchOpen }">
    <a class="skip-link" href="#main-content">跳转到主要内容</a>

    <SiteHeader
      ref="siteHeader"
      :menu-open="menuOpen"
      :search-open="searchOpen"
      @open-menu="openMenu"
      @open-search="openSearch"
    />

    <main id="main-content" class="site-main" tabindex="-1">
      <PageTransition>
        <HomeLayout v-if="isHome" />
        <IngredientUniverseLayout v-else-if="isIngredients" />
        <CategoryLayout v-else-if="isCategory" :category-name="categoryName" />
        <RecipeLayout v-else-if="isRecipe" :recipe-id="recipeId" />
        <template v-else>
          <Content />
        </template>
      </PageTransition>
    </main>

    <footer class="site-footer">
      <p>CookLikeHOC 是非官方项目，内容来自仓库中的原始 Markdown。</p>
      <a href="https://github.com/zhs1234/lxj-cook" target="_blank" rel="noreferrer">
        查看 GitHub 仓库
      </a>
    </footer>

    <ScrollProgress />
    <CustomCursor />

    <FullscreenMenu :open="menuOpen" :categories="categories" @close="closeMenu" />
    <SearchOverlay :open="searchOpen" @close="closeSearch" />
  </div>
</template>
