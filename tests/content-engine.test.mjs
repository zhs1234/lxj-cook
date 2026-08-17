import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { GENERATED_DIR, ROOT_DIR } from '../.vitepress/scripts/content-utils.mjs'
import { generateRecipeData } from '../.vitepress/scripts/generate-recipes.mjs'

function readGenerated(outputDir, fileName) {
  return JSON.parse(fs.readFileSync(path.join(outputDir, fileName), 'utf8'))
}

function findRecipe(recipes, id) {
  const recipe = recipes.find((item) => item.id === id)
  assert.ok(recipe, `缺少真实菜谱样本：${id}`)
  return recipe
}

test('P1 content engine parses the real repository without changing source Markdown', () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cooklikehoc-content-'))
  try {
    const summary = generateRecipeData({ rootDir: ROOT_DIR, outputDir })
    const recipes = readGenerated(outputDir, 'recipes.generated.json').recipes
    const categories = readGenerated(outputDir, 'categories.generated.json').categories
    const images = readGenerated(outputDir, 'images.generated.json').images

    assert.equal(summary.recipeCount, 336)
    assert.equal(recipes.length, 336)
    assert.equal(categories.length, 15)
    assert.equal(images.length, 192)
    assert.ok(recipes.every((recipe) => recipe.title && recipe.category && recipe.sourcePath))
    assert.ok(recipes.every((recipe) => Array.isArray(recipe.ingredients)))
    assert.ok(recipes.every((recipe) => Array.isArray(recipe.steps)))
    assert.ok(recipes.every((recipe) => recipe.imageResolution?.status))

    const linkedRecipe = findRecipe(recipes, '炒菜/芋儿鸡')
    assert.deepEqual(linkedRecipe.ingredients.find((item) => item.text === '肥肠鸡酱料')?.links[0], {
      label: '肥肠鸡酱料',
      href: '/%E9%85%8D%E6%96%99/%E8%82%A5%E8%82%A0%E9%B8%A1%E9%85%B1%E6%96%99',
      internal: true,
      sourcePath: '配料/肥肠鸡酱料.md',
    })

    const nestedSteps = findRecipe(recipes, '主食/大大大块牛腩面')
    assert.equal(nestedSteps.steps[0].substeps.length, 5)
    assert.equal(nestedSteps.steps[0].substeps[0].marker, '①')

    const nutrition = findRecipe(recipes, '饮品/红豆酒酿')
    assert.equal(nutrition.nutrition.basis, '每 100g 含量')
    assert.equal(nutrition.nutrition.entries.length, 5)
    assert.equal(nutrition.nutrition.entries[0].value, '56 Kcal')

    const parenthesisImage = findRecipe(recipes, '炒菜/农家小炒肉（鸡蛋干）')
    assert.equal(parenthesisImage.imageResolution.matchType, 'markdown-reference')
    assert.equal(parenthesisImage.imageResolution.sourcePath, 'images/农家小炒肉(鸡蛋干版本).png')

    const versionImage = findRecipe(recipes, '饮品/原味豆浆（冲调版本）')
    assert.equal(versionImage.imageResolution.matchType, 'version')
    assert.equal(versionImage.imageResolution.sourcePath, 'images/原味豆浆（冲调版）.png')

    const packagedDrink = findRecipe(recipes, '饮品/东方树叶（335mL）')
    assert.deepEqual(packagedDrink.steps, [])
    assert.equal(packagedDrink.nutrition, undefined)
    assert.equal(packagedDrink.image, null)

    const internalLinks = recipes.flatMap((recipe) => recipe.ingredients.flatMap((item) => item.links))
    assert.ok(internalLinks.length >= 70)
    assert.ok(internalLinks.every((link) => link.internal && fs.existsSync(path.join(ROOT_DIR, link.sourcePath))))
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true })
  }
})

test('generated data remains available at the repository output path', () => {
  assert.ok(fs.existsSync(path.join(GENERATED_DIR, 'recipes.generated.json')))
  assert.ok(fs.existsSync(path.join(GENERATED_DIR, 'images.generated.json')))
})
