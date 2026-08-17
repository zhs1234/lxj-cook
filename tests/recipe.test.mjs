import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readRepoFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8')

function findRecipe(recipes, id) {
  const recipe = recipes.find((item) => item.id === id)
  assert.ok(recipe, `缺少真实菜谱样本：${id}`)
  return recipe
}

test('P6 dispatches real two-segment recipe routes to RecipeLayout', async () => {
  const layout = await readRepoFile('.vitepress/theme/Layout.vue')
  const recipeLayout = await readRepoFile('.vitepress/theme/layouts/RecipeLayout.vue')

  assert.match(layout, /import recipesData from '\.\.\/generated\/recipes\.generated\.json'/)
  assert.match(layout, /import RecipeLayout from '\.\/layouts\/RecipeLayout\.vue'/)
  assert.match(layout, /const recipeId = computed/)
  assert.match(layout, /replace\(\/\\\.html\$\/, ''\)/)
  assert.match(layout, /const isRecipe = computed/)
  assert.match(layout, /<RecipeLayout v-else-if="isRecipe" :recipe-id="recipeId" \/>/)
  assert.match(recipeLayout, /recipes\.generated\.json/)
  assert.match(recipeLayout, /relations\.generated\.json/)
  assert.match(recipeLayout, /recipe\.sourcePath/)
})

test('P6 uses multiple real generated recipes without inventing cooking facts', async () => {
  const recipeLayout = await readRepoFile('.vitepress/theme/layouts/RecipeLayout.vue')
  const generated = JSON.parse(await readRepoFile('.vitepress/generated/recipes.generated.json'))
  const recipes = generated.recipes

  const linked = findRecipe(recipes, '炒菜/芋儿鸡')
  const withImage = findRecipe(recipes, '炒菜/农家小炒肉（鸡蛋干）')
  const withNutrition = findRecipe(recipes, '饮品/红豆酒酿')
  const withoutNutrition = findRecipe(recipes, '饮品/东方树叶（335mL）')
  const withSubsteps = findRecipe(recipes, '主食/大大大块牛腩面')

  assert.equal(recipes.length, 336)
  assert.ok(linked.ingredients.some((item) => item.links?.some((link) => link.internal)))
  assert.equal(withImage.imageResolution.matchType, 'markdown-reference')
  assert.ok(withNutrition.nutrition.entries.length > 0)
  assert.equal(withoutNutrition.nutrition, undefined)
  assert.equal(withSubsteps.steps[0].substeps.length, 5)

  assert.match(recipeLayout, /recipe\.imageResolution\?\.width/)
  assert.match(recipeLayout, /recipe\.imageResolution\?\.height/)
  assert.match(recipeLayout, /v-if="hasNutrition"/)
  assert.match(recipeLayout, /recipe\.nutrition\.entries/)
  assert.match(recipeLayout, /:href="part\.link\.href"/)
  assert.match(recipeLayout, /<ol v-if="steps\.length" class="recipe-timeline"/)
  assert.match(recipeLayout, /step\.substeps\?\.length/)
  assert.doesNotMatch(recipeLayout, /difficulty|rating|servings|portion|calories|minutes/i)
})

test('P6 keeps the cooking sequence semantic, accessible, responsive, and reduced-motion safe', async () => {
  const recipeLayout = await readRepoFile('.vitepress/theme/layouts/RecipeLayout.vue')
  const styles = await readRepoFile('.vitepress/theme/styles/recipe.css')
  const packageJson = JSON.parse(await readRepoFile('package.json'))

  assert.match(recipeLayout, /<article class="recipe-layout">/)
  assert.match(recipeLayout, /<section id="ingredients"/)
  assert.match(recipeLayout, /<section id="timeline"/)
  assert.match(recipeLayout, /<section v-if="hasNutrition" id="nutrition"/)
  assert.match(recipeLayout, /<section v-if="relatedRecipes\.length" class="recipe-section recipe-related"/)
  assert.match(recipeLayout, /id="cook-mode-entry"/)
  assert.match(recipeLayout, /aria-label="烹饪步骤"/)
  assert.match(recipeLayout, /aria-label="菜谱配料"/)
  assert.match(styles, /grid-template-columns: minmax\(0, 0\.78fr\) minmax\(0, 1\.22fr\)/)
  assert.match(styles, /@media \(max-width: 48rem\)/)
  assert.match(styles, /@media \(max-width: 30rem\)/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.equal(packageJson.scripts['test:recipe'], 'node --test tests/recipe.test.mjs')
  assert.doesNotMatch(recipeLayout, /[\u{1F000}-\u{1FAFF}]/u)
  assert.doesNotMatch(recipeLayout, /[—–]/u)
  assert.doesNotMatch(styles, /[—–]/u)
})
