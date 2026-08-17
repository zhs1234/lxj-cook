import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readRepoFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8')

test('P4 routes the root page to a dedicated semantic Home layout', async () => {
  const index = await readRepoFile('index.md')
  const layout = await readRepoFile('.vitepress/theme/Layout.vue')
  const home = await readRepoFile('.vitepress/theme/layouts/HomeLayout.vue')

  assert.match(index, /title: CookLikeHOC \| 非官方菜谱档案/)
  assert.match(index, /description: 基于仓库原始 Markdown 的非官方中文菜谱档案。/)
  assert.match(layout, /const isHome = computed\(\(\) => route\.path === '\/'\)/)
  assert.match(layout, /<HomeLayout v-if="isHome" \/>/)
  assert.match(home, /<section class="home-hero" aria-labelledby="home-title">/)
  assert.match(home, /<h1 id="home-title"/)
  assert.match(home, /<section id="archive"/)
  assert.match(home, /<section id="category-index"/)
})

test('home content is selected from generated recipe and category data', async () => {
  const home = await readRepoFile('.vitepress/theme/layouts/HomeLayout.vue')
  const recipes = JSON.parse(await readRepoFile('.vitepress/generated/recipes.generated.json'))
  const categories = JSON.parse(await readRepoFile('.vitepress/generated/categories.generated.json'))

  assert.match(home, /recipes\.generated\.json/)
  assert.match(home, /categories\.generated\.json/)
  assert.match(home, /images\.generated\.json/)
  assert.equal(recipes.recipes.length, 336)
  assert.equal(categories.categories.length, 15)
  assert.match(home, /featuredRecipes\.length < 4/)
  assert.match(home, /停止构建以避免虚构内容/)
})

test('P4 motion uses GSAP with cleanup and reduced-motion fallback', async () => {
  const home = await readRepoFile('.vitepress/theme/layouts/HomeLayout.vue')
  const styles = await readRepoFile('.vitepress/theme/styles/home.css')
  const packageJson = JSON.parse(await readRepoFile('package.json'))

  assert.equal(packageJson.devDependencies.gsap !== undefined, true)
  assert.match(home, /import\('gsap'\)/)
  assert.match(home, /prefers-reduced-motion: reduce/)
  assert.match(home, /animationContext\?\.revert\(\)/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(home, /window\.addEventListener\(['"]scroll/)
})

test('home keeps real image alt text, mobile collapse, and no emoji or em dash copy', async () => {
  const home = await readRepoFile('.vitepress/theme/layouts/HomeLayout.vue')
  const styles = await readRepoFile('.vitepress/theme/styles/home.css')

  assert.match(home, /:alt="heroRecipe\.title"/)
  assert.match(home, /:alt="recipe\.title"/)
  assert.match(styles, /@media \(max-width: 48rem\)/)
  assert.match(styles, /grid-template-columns: 1fr/)
  assert.doesNotMatch(home, /[\u{1F000}-\u{1FAFF}]/u)
  assert.doesNotMatch(home, /[—–]/u)
})
