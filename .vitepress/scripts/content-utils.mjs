import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
export const ROOT_DIR = path.resolve(SCRIPT_DIR, '../..')
export const GENERATED_DIR = path.join(ROOT_DIR, '.vitepress', 'generated')
export const IMAGES_DIR = path.join(ROOT_DIR, 'images')

export const EXCLUDED_DIRS = new Set([
  '.git',
  '.github',
  '.vitepress',
  'docs',
  'docker_support',
  'images',
  'node_modules',
  'public',
  'tests',
])

export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export function toPosixPath(value) {
  return value.split(path.sep).join('/')
}

export function sourcePathFromAbsolute(filePath, rootDir = ROOT_DIR) {
  return toPosixPath(path.relative(rootDir, filePath))
}

export function sourceIdFromPath(sourcePath) {
  return sourcePath.replace(/\.md$/i, '')
}

export function encodeSitePath(sourcePath) {
  return `/${sourcePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`
}

export function encodeAssetPath(sourcePath) {
  return encodeSitePath(sourcePath)
}

export function sortNames(a, b) {
  return a.localeCompare(b, 'zh-Hans-CN-u-co-pinyin')
}

export function listCategoryDirectories(rootDir = ROOT_DIR) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !EXCLUDED_DIRS.has(entry.name) && !entry.name.startsWith('.'))
    .sort((a, b) => sortNames(a.name, b.name))
    .map((entry) => path.join(rootDir, entry.name))
}

export function listRecipeFiles(rootDir = ROOT_DIR) {
  const files = []
  for (const categoryDir of listCategoryDirectories(rootDir)) {
    for (const entry of fs.readdirSync(categoryDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) continue
      if (/^(readme|index)\.md$/i.test(entry.name)) continue
      files.push(path.join(categoryDir, entry.name))
    }
  }
  return files.sort((a, b) => sortNames(a, b))
}

export function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function isEscaped(value, index) {
  let slashCount = 0
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    slashCount += 1
  }
  return slashCount % 2 === 1
}

function findClosingBracket(value, start) {
  for (let index = start; index < value.length; index += 1) {
    if (value[index] === ']' && !isEscaped(value, index)) return index
  }
  return -1
}

function findClosingParenthesis(value, start) {
  let depth = 1
  for (let index = start; index < value.length; index += 1) {
    if (isEscaped(value, index)) continue
    if (value[index] === '(') depth += 1
    if (value[index] === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }
  return -1
}

export function cleanLinkTarget(rawTarget) {
  let target = rawTarget.trim()
  if (target.startsWith('<') && target.endsWith('>')) {
    target = target.slice(1, -1)
  } else {
    target = target.replace(/\s+(?:"[^"]*"|'[^']*')\s*$/u, '')
  }
  return target
}

export function parseInlineLinks(markdown) {
  const tokens = []
  for (let index = 0; index < markdown.length; index += 1) {
    const isImage = markdown.startsWith('![', index)
    const isLink = !isImage && markdown[index] === '['
    if (!isImage && !isLink) continue

    const labelStart = index + (isImage ? 2 : 1)
    const labelEnd = findClosingBracket(markdown, labelStart)
    if (labelEnd < 0 || markdown[labelEnd + 1] !== '(') continue

    const targetStart = labelEnd + 2
    const targetEnd = findClosingParenthesis(markdown, targetStart)
    if (targetEnd < 0) continue

    tokens.push({
      isImage,
      label: markdown.slice(labelStart, labelEnd),
      target: cleanLinkTarget(markdown.slice(targetStart, targetEnd)),
      start: index,
      end: targetEnd + 1,
    })
    index = targetEnd
  }
  return tokens
}

export function stripMarkdownInline(value) {
  let result = ''
  let cursor = 0
  for (const token of parseInlineLinks(value)) {
    result += value.slice(cursor, token.start)
    result += token.label
    cursor = token.end
  }
  result += value.slice(cursor)

  return result
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeForMatch(value, { removeVersion = false } = {}) {
  let normalized = stripMarkdownInline(String(value ?? ''))
    .normalize('NFKC')
    .toLocaleLowerCase('zh-CN')
    .replace(/[\s\u3000]+/gu, '')
  if (removeVersion) normalized = normalized.replace(/版本|版/gu, '')
  return normalized
}

export function parseHeadings(lines) {
  const headings = []
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/u)
    if (!match) return
    headings.push({
      level: match[1].length,
      text: stripMarkdownInline(match[2]),
      rawText: match[2].trim(),
      line: index,
    })
  })
  return headings
}

export function canonicalHeadingName(value) {
  return stripMarkdownInline(value).replace(/[：:]\s*$/u, '').trim()
}

export function findSection(lines, aliases) {
  const aliasSet = new Set(aliases)
  const headings = parseHeadings(lines)
  const heading = headings.find(
    (candidate) => candidate.level === 2 && aliasSet.has(canonicalHeadingName(candidate.text)),
  )
  if (!heading) return null

  const nextHeading = headings.find(
    (candidate) => candidate.line > heading.line && candidate.level <= heading.level,
  )
  return {
    heading,
    lines: lines.slice(heading.line + 1, nextHeading?.line ?? lines.length),
  }
}

export function extractTitle(markdown, fallback) {
  const lines = markdown.split(/\r?\n/u)
  const heading = lines.find((line) => /^#\s+\S/u.test(line))
  return heading ? stripMarkdownInline(heading.replace(/^#\s+/u, '')) : fallback
}

export function parseListLine(line) {
  const trimmed = line.trim()
  const bullet = trimmed.match(/^[-*+]\s*(.*)$/u)
  const withoutBullet = bullet ? bullet[1].trim() : trimmed
  const numbered = withoutBullet.match(/^(\d+)\s*[.)、]\s*(.*)$/u)
  if (numbered) {
    return {
      kind: 'numbered',
      sourceNumber: Number(numbered[1]),
      text: numbered[2].trim(),
    }
  }
  if (bullet) return { kind: 'bullet', sourceNumber: null, text: withoutBullet }

  const ordered = trimmed.match(/^(\d+)\s*[.)、]\s*(.*)$/u)
  if (ordered) {
    return {
      kind: 'numbered',
      sourceNumber: Number(ordered[1]),
      text: ordered[2].trim(),
    }
  }
  return null
}

export function resolveLocalTarget(target, sourcePath, rootDir = ROOT_DIR) {
  const cleaned = cleanLinkTarget(target)
  if (!cleaned || cleaned.startsWith('#') || /^(?:[a-z]+:)?\/\//iu.test(cleaned)) return null

  const withoutFragment = cleaned.split(/[?#]/u, 1)[0]
  const decoded = decodeURIComponentSafe(withoutFragment)
  const absolutePath = decoded.startsWith('/')
    ? path.resolve(rootDir, decoded.slice(1))
    : path.resolve(rootDir, path.dirname(sourcePath), decoded)
  const rootWithSeparator = `${path.resolve(rootDir)}${path.sep}`
  if (absolutePath !== path.resolve(rootDir) && !absolutePath.startsWith(rootWithSeparator)) {
    return null
  }

  return {
    absolutePath,
    sourcePath: sourcePathFromAbsolute(absolutePath, rootDir),
    exists: fs.existsSync(absolutePath),
  }
}

export function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/u, '').replace(/\|$/u, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

export function isTableSeparatorRow(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell))
}

export function parseNutritionTable(sectionLines) {
  const rows = sectionLines
    .filter((line) => /^\s*\|.*\|\s*$/u.test(line))
    .map(splitTableRow)
    .filter((cells) => cells.length > 0)

  if (rows.length < 2 || isTableSeparatorRow(rows[0]) || !isTableSeparatorRow(rows[1])) {
    return null
  }

  const header = rows[0]
  const entries = rows.slice(2).filter((cells) => cells.length >= 2 && cells.some(Boolean))
  return {
    basis: header[1] || null,
    entries: entries.map(([label, value]) => ({
      label: stripMarkdownInline(label),
      value: stripMarkdownInline(value),
    })),
  }
}

export function makeSiteLink(sourcePath) {
  return encodeSitePath(sourceIdFromPath(sourcePath))
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}
