<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Content, useRoute } from 'vitepress'

import categoriesData from '../generated/categories.generated.json'
import CustomCursor from './components/CustomCursor.vue'
import FullscreenMenu from './components/FullscreenMenu.vue'
import PageTransition from './components/PageTransition.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import SiteHeader from './components/SiteHeader.vue'
import HomeLayout from './layouts/HomeLayout.vue'

const route = useRoute()
const siteHeader = ref(null)
const menuOpen = ref(false)
const searchOpen = ref(false)
const categories = categoriesData.categories ?? []
const isHome = computed(() => route.path === '/')

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
      <HomeLayout v-if="isHome" />
      <PageTransition v-else>
        <Content />
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
