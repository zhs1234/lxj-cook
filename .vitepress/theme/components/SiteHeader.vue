<script setup>
import { ref } from 'vue'
import { ArrowUpRight, Menu, Search, X } from '@lucide/vue'

defineProps({
  menuOpen: Boolean,
  searchOpen: Boolean,
})

const emit = defineEmits(['open-menu', 'open-search'])
const menuButton = ref(null)
const searchButton = ref(null)

function focusMenuButton() {
  menuButton.value?.focus()
}

function focusSearchButton() {
  searchButton.value?.focus()
}

defineExpose({ focusMenuButton, focusSearchButton })
</script>

<template>
  <header class="site-header">
    <a class="site-header__brand" href="/" aria-label="CookLikeHOC 首页">
      <span class="site-header__wordmark">CookLikeHOC</span>
      <span class="site-header__descriptor">Chinese cooking archive</span>
    </a>

    <nav class="site-header__nav" aria-label="主要导航">
      <button class="site-header__nav-link" type="button" @click="emit('open-menu')">
        Explore
        <ArrowUpRight :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button class="site-header__nav-link" type="button" @click="emit('open-search')">
        Search
        <Search :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <a
        class="site-header__nav-link"
        href="https://github.com/zhs1234/lxj-cook"
        target="_blank"
        rel="noreferrer"
      >
        GitHub
        <ArrowUpRight :size="16" :stroke-width="1.8" aria-hidden="true" />
      </a>
    </nav>

    <div class="site-header__actions">
      <button
        ref="searchButton"
        class="icon-button site-header__icon-button"
        type="button"
        :aria-label="searchOpen ? '关闭搜索' : '打开搜索'"
        aria-haspopup="dialog"
        :aria-expanded="searchOpen"
        @click="emit('open-search')"
      >
        <Search :size="19" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        ref="menuButton"
        class="icon-button site-header__icon-button"
        type="button"
        :aria-label="menuOpen ? '关闭菜单' : '打开菜单'"
        aria-haspopup="dialog"
        :aria-expanded="menuOpen"
        @click="emit('open-menu')"
      >
        <X v-if="menuOpen" :size="20" :stroke-width="1.8" aria-hidden="true" />
        <Menu v-else :size="20" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>
