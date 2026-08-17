import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  GENERATED_DIR,
  ROOT_DIR,
  canonicalHeadingName,
  encodeSitePath,
  extractTitle,
  findSection,
  listRecipeFiles,
  makeSiteLink,
  normalizeForMatch,
  parseInlineLinks,
  parseListLine,
  parseNutritionTable,
  readUtf8,
  resolveLocalTarget,
  sourceIdFromPath,
  sourcePathFromAbsolute,
  stripMarkdownInline,
  writeJson,
} from './content-utils.mjs'
import { createImageResolver } from './resolve-images.mjs'
import { generateRelations } from './generate-relations.mjs'

const INGREDIENT_HEADINGS = ['配料', '原料', '已知成分', '品类']
const STEP_HEADINGS = ['步骤']
const NUTRITION_HEADINGS = ['营养成分']

function buildLinks(rawText, sourcePath, rootDir) {
  return parseInlineLinks(rawText)
    .filter((token) => !token.isImage)
    .map((token) => {
      const local = resolveLocalTarget(token.target, sourcePath, rootDir)
      const isInternal = Boolean(local?.exists && local.sourcePath.toLowerCase().endsWith('.md'))
      return {
        label: stripMarkdownInline(token.label),
        href: isInternal ? makeSiteLink(local.sourcePath) : token.target,
        internal: isInternal,
        ...(isInternal ? { sourcePath: local.sourcePath } : {}),
      }
    })
}

function parseIngredients(section, sourcePath, rootDir) {
  if (!section) return []
  const items = []
  let current = null

  for (const line of section.lines) {
    if (!line.trim()) continue
    const listItem = parseListLine(line)
    if (listItem) {
      current = {
        text: stripMarkdownInline(listItem.text),
        links: buildLinks(listItem.text, sourcePath, rootDir).filter((link) => link.internal),
      }
      items.push(current)
      continue
    }

    if (current && /^\s+/u.test(line)) {
      current.text = `${current.text} ${stripMarkdownInline(line)}`.trim()
    }
  }

  return items
}

function parseSteps(section) {
  if (!section) return []
  const steps = []
  let group = null
  let current = null

  const appendContinuation = (value) => {
    if (!current || !value.trim()) return
    current.text = `${current.text}\n${stripMarkdownInline(value).trim()}`.trim()
  }

  for (const line of section.lines) {
    const heading = line.match(/^###\s+(.+?)\s*$/u)
    if (heading) {
      group = canonicalHeadingName(heading[1])
      current = null
      continue
    }
    if (!line.trim()) continue

    const substep = line.match(/^\s*([①②③④⑤⑥⑦⑧⑨⑩])\s*(.*)$/u)
    if (substep && current) {
      current.substeps.push({ marker: substep[1], text: stripMarkdownInline(substep[2]).trim() })
      continue
    }

    const listItem = parseListLine(line)
    if (listItem) {
      current = {
        index: steps.length + 1,
        sourceNumber: listItem.sourceNumber,
        group,
        text: stripMarkdownInline(listItem.text),
        substeps: [],
      }
      steps.push(current)
      continue
    }

    appendContinuation(line)
  }

  if (steps.length === 0) {
    const fallback = section.lines.map((line) => line.trim()).filter(Boolean).join('\n')
    if (fallback) {
      steps.push({ index: 1, sourceNumber: null, group: null, text: stripMarkdownInline(fallback), substeps: [] })
    }
  }

  return steps
}

function parseRecipe(filePath, rootDir, imageResolver) {
  const markdown = readUtf8(filePath)
  const sourcePath = sourcePathFromAbsolute(filePath, rootDir)
  const category = sourcePath.split('/')[0]
  const fallbackTitle = path.basename(filePath, path.extname(filePath))
  const title = extractTitle(markdown, fallbackTitle)
  const lines = markdown.split(/\r?\n/u)
  const ingredientSection = findSection(lines, INGREDIENT_HEADINGS)
  const stepSection = findSection(lines, STEP_HEADINGS)
  const nutritionSection = findSection(lines, NUTRITION_HEADINGS)
  const ingredients = parseIngredients(ingredientSection, sourcePath, rootDir)
  const steps = parseSteps(stepSection)
  const nutrition = nutritionSection ? parseNutritionTable(nutritionSection.lines) : null
  const imageResolution = imageResolver.resolve({ title, sourcePath, markdown })
  const warnings = []

  if (!/^#\s+\S/u.test(lines.find((line) => line.trim()) ?? '')) warnings.push('missing-h1')
  if (!ingredientSection && category !== '配料') warnings.push('missing-ingredient-section')
  if (!stepSection && category !== '配料') warnings.push('missing-step-section')
  if (nutritionSection && !nutrition) warnings.push('nutrition-table-unparseable')
  if (imageResolution.status === 'missing') warnings.push('image-not-resolved')

  const recipe = {
    id: sourceIdFromPath(sourcePath),
    slug: encodeSitePath(sourceIdFromPath(sourcePath)),
    title,
    category,
    image: imageResolution.url,
    imageResolution,
    ingredients,
    steps,
    sourcePath,
    diagnostics: {
      headings: {
        ingredients: ingredientSection?.heading.text ?? null,
        steps: stepSection?.heading.text ?? null,
        nutrition: nutritionSection?.heading.text ?? null,
      },
      warnings,
    },
  }
  if (nutrition) recipe.nutrition = nutrition
  return recipe
}

function aggregateCategories(recipes) {
  const categories = new Map()
  for (const recipe of recipes) {
    if (!categories.has(recipe.category)) {
      categories.set(recipe.category, { id: recipe.category, name: recipe.category, recipeIds: [] })
    }
    categories.get(recipe.category).recipeIds.push(recipe.id)
  }
  return [...categories.values()].map((category) => ({
    ...category,
    recipeCount: category.recipeIds.length,
  }))
}

function aggregateIngredients(recipes) {
  const ingredients = new Map()
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = normalizeForMatch(ingredient.text)
      if (!key) continue
      if (!ingredients.has(key)) {
        ingredients.set(key, { id: key, name: ingredient.text, recipeIds: [], count: 0 })
      }
      const aggregate = ingredients.get(key)
      aggregate.count += 1
      if (!aggregate.recipeIds.includes(recipe.id)) aggregate.recipeIds.push(recipe.id)
    }
  }
  return [...ingredients.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN-u-co-pinyin'))
}

function finalizeImages(inventory, recipes) {
  const usage = new Map()
  for (const recipe of recipes) {
    const sourcePath = recipe.imageResolution.sourcePath
    if (!sourcePath) continue
    if (!usage.has(sourcePath)) usage.set(sourcePath, [])
    usage.get(sourcePath).push({ recipeId: recipe.id, matchType: recipe.imageResolution.matchType })
  }

  return inventory.map(({ key, keyWithoutVersion, ...image }) => ({
    ...image,
    referencedBy: usage.get(image.sourcePath) ?? [],
    referenceCount: (usage.get(image.sourcePath) ?? []).length,
  }))
}

function buildDiagnostics(recipes) {
  const warningCounts = {}
  for (const recipe of recipes) {
    for (const warning of recipe.diagnostics.warnings) {
      warningCounts[warning] = (warningCounts[warning] ?? 0) + 1
    }
  }
  return {
    schemaVersion: 1,
    summary: {
      recipeCount: recipes.length,
      warningCounts,
      imageMatched: recipes.filter((recipe) => recipe.imageResolution.status === 'matched').length,
      nutritionPresent: recipes.filter((recipe) => recipe.nutrition).length,
      internalIngredientLinks: recipes.reduce(
        (count, recipe) => count + recipe.ingredients.reduce((inner, ingredient) => inner + ingredient.links.length, 0),
        0,
      ),
    },
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      sourcePath: recipe.sourcePath,
      warnings: recipe.diagnostics.warnings,
    })),
  }
}

export function generateRecipeData({ rootDir = ROOT_DIR, outputDir = GENERATED_DIR } = {}) {
  const imageResolver = createImageResolver({ rootDir })
  const recipes = listRecipeFiles(rootDir).map((filePath) => parseRecipe(filePath, rootDir, imageResolver))
  const images = finalizeImages(imageResolver.inventory, recipes)

  writeJson(path.join(outputDir, 'recipes.generated.json'), {
    schemaVersion: 1,
    generatedFrom: 'Markdown',
    recipes,
  })
  writeJson(path.join(outputDir, 'categories.generated.json'), {
    schemaVersion: 1,
    categories: aggregateCategories(recipes),
  })
  writeJson(path.join(outputDir, 'ingredients.generated.json'), {
    schemaVersion: 1,
    ingredients: aggregateIngredients(recipes),
  })
  writeJson(path.join(outputDir, 'images.generated.json'), {
    schemaVersion: 1,
    images,
  })
  writeJson(path.join(outputDir, 'content-diagnostics.generated.json'), buildDiagnostics(recipes))
  generateRelations(recipes, outputDir)

  return {
    recipeCount: recipes.length,
    categoryCount: new Set(recipes.map((recipe) => recipe.category)).size,
    imageCount: imageResolver.inventory.length,
    matchedImageCount: recipes.filter((recipe) => recipe.imageResolution.status === 'matched').length,
    outputDir,
  }
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  const summary = generateRecipeData()
  console.log(`[generate-recipes] recipes=${summary.recipeCount} categories=${summary.categoryCount} images=${summary.imageCount} matchedImages=${summary.matchedImageCount}`)
}

