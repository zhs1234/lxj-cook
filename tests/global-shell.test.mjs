import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readRepoFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8')

test('custom theme replaces the VitePress default layout and loads shell styles', async () => {
  const themeIndex = await readRepoFile('.vitepress/theme/index.js')

  assert.match(themeIndex, /import Layout from '\.\/Layout\.vue'/)
  assert.match(themeIndex, /Layout,/)
  assert.match(themeIndex, /\.\/styles\/shell\.css/)
})

test('global layout keeps semantic content and the non-official project disclosure', async () => {
  const layout = await readRepoFile('.vitepress/theme/Layout.vue')

  assert.match(layout, /<main id="main-content"/)
  assert.match(layout, /<Content \/>/)
  assert.match(layout, /非官方项目/)
  assert.match(layout, /zhs1234\/lxj-cook/)
  assert.match(layout, /categories\.generated\.json/)
})

test('menu and search overlays implement keyboard escape and modal semantics', async () => {
  const menu = await readRepoFile('.vitepress/theme/components/FullscreenMenu.vue')
  const search = await readRepoFile('.vitepress/theme/components/SearchOverlay.vue')

  for (const source of [menu, search]) {
    assert.match(source, /role="dialog"/)
    assert.match(source, /aria-modal="true"/)
    assert.match(source, /event\.key === 'Escape'/)
    assert.match(source, /event\.key !== 'Tab'/)
    assert.match(source, /event\.preventDefault\(\)/)
  }
})

test('shell functionality uses Lucide and the cursor is progressive enhancement', async () => {
  const header = await readRepoFile('.vitepress/theme/components/SiteHeader.vue')
  const menu = await readRepoFile('.vitepress/theme/components/FullscreenMenu.vue')
  const search = await readRepoFile('.vitepress/theme/components/SearchOverlay.vue')
  const cursor = await readRepoFile('.vitepress/theme/components/CustomCursor.vue')

  for (const source of [header, menu, search]) {
    assert.match(source, /from '@lucide\/vue'/)
    assert.doesNotMatch(source, /[\u{1F000}-\u{1FAFF}]/u)
  }

  assert.match(cursor, /pointer: fine/)
  assert.match(cursor, /prefers-reduced-motion: reduce/)
  assert.match(cursor, /removeEventListener/)
})
