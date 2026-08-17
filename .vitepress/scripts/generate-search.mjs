import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { GENERATED_DIR, normalizeForMatch, writeJson } from './content-utils.mjs'

function unique(values) {
  return [...new Set(values)]
}

function buildDocument(recipe) {
  const ingredients = unique(
    (recipe.ingredients ?? [])
      .map((ingredient) => ingredient.text)
      .filter(Boolean),
  )

  return {
    recipeId: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    category: recipe.category,
    ingredients,
    normalizedTitle: normalizeForMatch(recipe.title),
    normalizedCategory: normalizeForMatch(recipe.category),
    normalizedIngredients: ingredients.map((ingredient) => normalizeForMatch(ingredient)),
  }
}

export function generateSearch(recipes, outputDir = GENERATED_DIR) {
  const output = {
    schemaVersion: 1,
    generatedFrom: 'recipes.generated.json',
    documents: recipes.map(buildDocument),
  }
  writeJson(path.join(outputDir, 'search.generated.json'), output)
  return output
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  const recipesPath = path.join(GENERATED_DIR, 'recipes.generated.json')
  if (!fs.existsSync(recipesPath)) {
    throw new Error('recipes.generated.json 不存在，请先运行 generate-recipes.mjs')
  }
  const { recipes } = JSON.parse(fs.readFileSync(recipesPath, 'utf8'))
  const output = generateSearch(recipes, GENERATED_DIR)
  console.log(`[generate-search] documents=${output.documents.length}`)
}
