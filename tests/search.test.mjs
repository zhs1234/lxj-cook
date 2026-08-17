import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readRepoFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8')

test('P8 generates searchable documents from real recipe data', async () => {
  const search = JSON.parse(await readRepoFile('.vitepress/generated/search.generated.json'))
  const recipes = JSON.parse(await readRepoFile('.vitepress/generated/recipes.generated.json'))
  const document = search.documents.find((item) => item.title === '肥肠鸡')

  assert.equal(search.generatedFrom, 'recipes.generated.json')
  assert.equal(search.documents.length, recipes.recipes.length)
  assert.ok(document)
  assert.equal(document.category, '炒菜')
  assert.ok(document.ingredients.includes('肥肠鸡酱料'))
  assert.ok(document.normalizedTitle.includes('肥肠鸡'))
  assert.ok(document.normalizedIngredients.includes('肥肠鸡酱料'))
})

test('P8 relation data uses real ingredients and explains every match', async () => {
  const relationScript = await readRepoFile('.vitepress/scripts/generate-relations.mjs')
  const relations = JSON.parse(await readRepoFile('.vitepress/generated/relations.generated.json'))
  const related = relations.relations.flatMap((item) => item.related)
  const explained = related.find((item) => item.matchReasons?.length)
  const sharedIngredientMatch = related.find((item) =>
    item.matchReasons?.some((reason) => reason.type === 'shared-ingredient'),
  )

  assert.match(relationScript, /ingredient\.text/)
  assert.doesNotMatch(relationScript, /ingredient\.name/)
  assert.ok(explained)
  assert.ok(sharedIngredientMatch)
  assert.ok(related.every((item) => item.matchReasons?.every((reason) => reason.label && reason.value)))
})

test('P8 search overlay is semantic, keyboard navigable, and responsive', async () => {
  const component = await readRepoFile('.vitepress/theme/components/SearchOverlay.vue')
  const styles = await readRepoFile('.vitepress/theme/styles/search.css')
  const index = await readRepoFile('.vitepress/theme/index.js')
  const packageJson = JSON.parse(await readRepoFile('package.json'))

  assert.match(component, /search\.generated\.json/)
  assert.match(component, /role="dialog"/)
  assert.match(component, /role="search"/)
  assert.match(component, /role="listbox"/)
  assert.match(component, /role="option"/)
  assert.match(component, /ArrowDown/)
  assert.match(component, /ArrowUp/)
  assert.match(component, /event\.key === 'Enter'/)
  assert.match(component, /没有找到/)
  assert.match(component, /window\.location\.assign/)
  assert.match(index, /styles\/search\.css/)
  assert.match(styles, /@media \(max-width: 42rem\)/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
  assert.equal(packageJson.scripts['test:search'], 'node --test tests/search.test.mjs')
  assert.doesNotMatch(component, /[\u{1F000}-\u{1FAFF}]/u)
  assert.doesNotMatch(styles, /[—–]/u)
})
