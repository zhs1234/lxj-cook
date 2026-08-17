<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()
</script>

<template>
  <Transition name="page-sweep" mode="out-in">
    <div :key="route.path" class="page-transition-shell">
      <slot />
    </div>
  </Transition>
</template>
