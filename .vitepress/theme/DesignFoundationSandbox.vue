<script setup>
import { ArrowUpRight, Search } from '@lucide/vue'
</script>

<template>
  <main class="foundation-sandbox surface flow" style="--flow-space: var(--space-12)">
    <header class="flow" style="--flow-space: var(--space-4)">
      <p class="type-meta">Design Foundation / P2</p>
      <h1 class="type-display type-balance">Cook with intention.</h1>
      <p class="type-body type-measure">
        A private fixture for checking hierarchy, control states, icon treatment, image framing,
        and motion preferences before they are connected to the site shell.
      </p>
    </header>

    <section class="flow" style="--flow-space: var(--space-5)" aria-labelledby="foundation-controls">
      <h2 id="foundation-controls" class="type-section">Controls</h2>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3)">
        <button class="button button--primary motion-interactive" type="button">
          <Search :size="18" :stroke-width="1.8" aria-hidden="true" />
          <span>Search recipes</span>
        </button>
        <a class="button button--quiet motion-interactive" href="#foundation-image">
          <span>View treatment</span>
          <ArrowUpRight :size="18" :stroke-width="1.8" aria-hidden="true" />
        </a>
        <button class="icon-button motion-interactive" type="button" aria-label="Open search">
          <Search :size="18" :stroke-width="1.8" aria-hidden="true" />
        </button>
      </div>
    </section>

    <section id="foundation-image" class="flow" style="--flow-space: var(--space-5)" aria-labelledby="foundation-media">
      <h2 id="foundation-media" class="type-section">Image treatment</h2>
      <figure class="media-frame media-frame--placeholder">
        <figcaption>Source image slot</figcaption>
      </figure>
    </section>

    <section class="flow" style="--flow-space: var(--space-5)" aria-labelledby="foundation-motion">
      <h2 id="foundation-motion" class="type-section">Motion preference</h2>
      <div class="media-frame motion-fade-up" data-motion="fade-up" style="padding: var(--space-8)">
        Reduced motion disables this non-essential entrance transition.
      </div>
    </section>
  </main>
</template>

<style>
  @import './styles/index.css';

  .foundation-sandbox {
    min-height: 100vh;
    padding: var(--space-12) var(--gutter-page);
  }
</style>
