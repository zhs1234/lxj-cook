import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { GENERATED_DIR, ROOT_DIR, normalizeForMatch, writeJson } from './content-utils.mjs'

function buildIngredientSet(recipe) {
  return new Map(
    recipe.ingredients
      .map((ingredient) => [normalizeForMatch(ingredient.name), ingredient.name])
      .filter(([key]) => key.length > 0),
  )
}

export function generateRelations(recipes, outputDir = GENERATED_DIR) {
  const relations = recipes.map((recipe) => {
    const sourceIngredients = buildIngredientSet(recipe)
    const related = []

    for (const candidate of recipes) {
      if (candidate.id === recipe.id) continue
      const candidateIngredients = buildIngredientSet(candidate)
      const sharedIngredients = []
      for (const [key, name] of sourceIngredients) {
        if (candidateIngredients.has(key)) sharedIngredients.push(name)
      }
      const sameCategory = recipe.category === candidate.category
      const score = sharedIngredients.length * 2 + (sameCategory ? 1 : 0)
      if (score === 0) continue

      related.push({
        recipeId: candidate.id,
        score,
        sameCategory,
        sharedIngredients: sharedIngredients.sort((a, b) => a.localeCompare(b, 'zh-CN-u-co-pinyin')),
      })
    }

    related.sort((a, b) => b.score - a.score || a.recipeId.localeCompare(b.recipeId, 'zh-CN-u-co-pinyin'))
    return { recipeId: recipe.id, related: related.slice(0, 8) }
  })

  const output = {
    schemaVersion: 1,
    generatedFrom: 'recipes.generated.json',
    relations,
  }
  writeJson(path.join(outputDir, 'relations.generated.json'), output)
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
  generateRelations(recipes, GENERATED_DIR)
}

