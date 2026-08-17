import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readRepoFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8')

test('P5 dispatches category root routes to the dedicated layout', async () => {
  const layout = await readRepoFile('.vitepress/theme/Layout.vue')
  const category = await readRepoFile('.vitepress/theme/layouts/CategoryLayout.vue')

  assert.match(layout, /import CategoryLayout from '\.\/layouts\/CategoryLayout\.vue'/)
  assert.match(layout, /const isCategory = computed/)
  assert.match(layout, /<CategoryLayout v-else-if="isCategory"/)
  assert.match(category, /<section class="category-hero" aria-labelledby="category-title">/)
  assert.match(category, /<h1 id="category-title"/)
  assert.match(category, /<ul class="category-recipe-grid"/)
  assert.match(category, /:href="recipe\.slug"/)
})

test('every generated category has a route stub and uses real recipe counts', async () => {
  const categoryLayout = await readRepoFile('.vitepress/theme/layouts/CategoryLayout.vue')
  const categories = JSON.parse(await readRepoFile('.vitepress/generated/categories.generated.json'))
  const recipes = JSON.parse(await readRepoFile('.vitepress/generated/recipes.generated.json'))
  const recipeIds = new Set(recipes.recipes.map((recipe) => recipe.id))

  assert.equal(categories.categories.length, 15)
  assert.match(categoryLayout, /categories\.generated\.json/)
  assert.match(categoryLayout, /recipes\.generated\.json/)
  assert.match(categoryLayout, /category\.recipeCount/)
  assert.match(categoryLayout, /categoryRecipes = computed/)

  for (const category of categories.categories) {
    const index = await readRepoFile(path.join(category.name, 'index.md'))
    assert.match(index, new RegExp(`title: ${category.name} \\| CookLikeHOC`))
    assert.match(index, /description: .*原始 Markdown。/)
    assert.equal(category.recipeIds.every((recipeId) => recipeIds.has(recipeId)), true)
  }
})

test('P5 keeps missing images graceful, mobile-specific, and accessible', async () => {
  const category = await readRepoFile('.vitepress/theme/layouts/CategoryLayout.vue')
  const styles = await readRepoFile('.vitepress/theme/styles/category.css')
  const packageJson = JSON.parse(await readRepoFile('package.json'))

  assert.match(category, /category-hero__media--empty/)
  assert.match(category, /category-recipe__media--missing/)
  assert.match(category, /:alt="recipe\.title"/)
  assert.match(category, /aria-label="分类菜谱列表"/)
  assert.match(styles, /grid-template-columns: repeat\(12, minmax\(0, 1fr\)\)/)
  assert.match(styles, /@media \(max-width: 48rem\)/)
  assert.match(styles, /@media \(max-width: 30rem\)/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.equal(packageJson.scripts['test:category'], 'node --test tests/category.test.mjs')
  assert.doesNotMatch(category, /[\u{1F000}-\u{1FAFF}]/u)
  assert.doesNotMatch(category, /[—–]/u)
  assert.doesNotMatch(styles, /[—–]/u)
})
