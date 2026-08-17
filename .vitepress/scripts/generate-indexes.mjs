import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  ROOT_DIR,
  listCategoryDirectories,
  readUtf8,
  sortNames,
} from './content-utils.mjs'
import { generateRecipeData } from './generate-recipes.mjs'

function titleFromName(name) {
  return name.replace(/\.md$/iu, '')
}

function buildIndexContent(dirName, files) {
  const header = `# ${dirName}\n\n<!-- AUTO-GENERATED: index for ${dirName}. Edit source files instead. -->\n\n`
  const list = files
    .sort((a, b) => sortNames(a, b))
    .map((fileName) => `- [${titleFromName(fileName)}](${encodeURI(`./${fileName}`)})`)
    .join('\n')
  return `${header}${list}${list ? '\n' : '（暂无条目）\n'}`.replace(/\n/gu, '\r\n')
}

export function generateIndexes(rootDir = ROOT_DIR) {
  let updated = 0
  let skipped = 0
  for (const categoryDir of listCategoryDirectories(rootDir)) {
    const files = fs
      .readdirSync(categoryDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .filter((entry) => !/^(readme|index)\.md$/iu.test(entry.name))
      .map((entry) => entry.name)
      .sort(sortNames)
    const readmePath = path.join(categoryDir, 'README.md')
    const nextContent = buildIndexContent(path.basename(categoryDir), files)
    const previousContent = fs.existsSync(readmePath) ? readUtf8(readmePath) : null
    if (previousContent) {
      skipped += 1
      continue
    }
    if (previousContent === nextContent) continue
    fs.writeFileSync(readmePath, nextContent, 'utf8')
    updated += 1
  }
  return { updated, skipped }
}

function isMainModule() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
}

if (isMainModule()) {
  const summary = generateRecipeData()
  const indexes = generateIndexes()
  console.log(`[generate-indexes] updated=${indexes.updated} skipped=${indexes.skipped} recipes=${summary.recipeCount}`)
}
