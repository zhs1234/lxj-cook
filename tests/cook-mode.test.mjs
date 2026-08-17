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

test('P7 exposes Cook Mode from Recipe Detail without removing the full timeline', async () => {
  const recipeLayout = await readRepoFile('.vitepress/theme/layouts/RecipeLayout.vue')
  const cookMode = await readRepoFile('.vitepress/theme/components/recipe/CookMode.vue')

  assert.match(recipeLayout, /import CookMode from '\.\.\/components\/recipe\/CookMode\.vue'/)
  assert.match(recipeLayout, /<CookMode :steps="steps" :recipe-title="recipe\.title" \/>/)
  assert.match(recipeLayout, /<ol v-if="steps\.length" class="recipe-timeline"/)
  assert.match(cookMode, /const activeStep = computed/)
  assert.match(cookMode, /props\.steps\[activeIndex\.value\]/)
  assert.match(cookMode, /role="dialog"/)
  assert.match(cookMode, /aria-modal="true"/)
})

test('P7 controls are driven by real steps and handle empty step data honestly', async () => {
  const cookMode = await readRepoFile('.vitepress/theme/components/recipe/CookMode.vue')
  const recipes = JSON.parse(await readRepoFile('.vitepress/generated/recipes.generated.json')).recipes
  const recipe = findRecipe(recipes, '炒菜/芋儿鸡')
  const nestedRecipe = findRecipe(recipes, '主食/大大大块牛腩面')
  const emptyRecipe = findRecipe(recipes, '饮品/东方树叶（335mL）')

  assert.ok(recipe.steps.length > 0)
  assert.equal(nestedRecipe.steps[0].substeps.length, 5)
  assert.equal(emptyRecipe.steps.length, 0)
  assert.match(cookMode, /v-if="steps\.length"/)
  assert.match(cookMode, /原始内容没有可用步骤/)
  assert.match(cookMode, /function previousStep\(\)/)
  assert.match(cookMode, /function nextStep\(\)/)
  assert.match(cookMode, /event\.key === 'Escape'/)
  assert.match(cookMode, /event\.key === 'ArrowLeft'/)
  assert.match(cookMode, /event\.key === 'ArrowRight'/)
  assert.match(cookMode, /aria-keyshortcuts="ArrowLeft"/)
  assert.match(cookMode, /aria-keyshortcuts="ArrowRight"/)
})

test('P7 is mobile-first, touchable, focus-managed, and reduced-motion safe', async () => {
  const cookMode = await readRepoFile('.vitepress/theme/components/recipe/CookMode.vue')
  const styles = await readRepoFile('.vitepress/theme/styles/cook-mode.css')
  const packageJson = JSON.parse(await readRepoFile('package.json'))

  assert.match(cookMode, /document\.addEventListener\('keydown', handleKeydown\)/)
  assert.match(cookMode, /document\.removeEventListener\('keydown', handleKeydown\)/)
  assert.match(cookMode, /returnFocusElement/)
  assert.match(cookMode, /aria-label="退出 Cook Mode"/)
  assert.match(styles, /min-height: 100dvh/)
  assert.match(styles, /@media \(max-width: 48rem\)/)
  assert.match(styles, /@media \(max-width: 30rem\)/)
  assert.match(styles, /min-height: 3\.5rem/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.equal(packageJson.scripts['test:cook-mode'], 'node --test tests/cook-mode.test.mjs')
  assert.doesNotMatch(cookMode, /[\u{1F000}-\u{1FAFF}]/u)
  assert.doesNotMatch(cookMode, /[—–]/u)
  assert.doesNotMatch(styles, /[—–]/u)
})
