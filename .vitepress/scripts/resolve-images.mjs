import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  IMAGE_EXTENSIONS,
  IMAGES_DIR,
  ROOT_DIR,
  encodeAssetPath,
  normalizeForMatch,
  parseInlineLinks,
  resolveLocalTarget,
  sourcePathFromAbsolute,
} from './content-utils.mjs'

const IMAGE_MAP_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'image-map.json')

function readImageMap(imageMapPath = IMAGE_MAP_PATH) {
  if (!fs.existsSync(imageMapPath)) return { bySourcePath: {}, byTitle: {} }
  const parsed = JSON.parse(fs.readFileSync(imageMapPath, 'utf8'))
  return {
    bySourcePath: parsed.bySourcePath ?? {},
    byTitle: parsed.byTitle ?? {},
  }
}

function readPngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') return null
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

function readJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = buffer[offset + 1]
    offset += 2
    if (marker === 0xd8 || marker === 0xd9) continue
    if (offset + 2 > buffer.length) break
    const length = buffer.readUInt16BE(offset)
    if (length < 2 || offset + length > buffer.length) break
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    if (isStartOfFrame && offset + 7 < buffer.length) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      }
    }
    offset += length
  }
  return null
}

function readWebpDimensions(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null
  }
  const chunk = buffer.toString('ascii', 12, 16)
  if (chunk === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16),
      height: 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16),
    }
  }
  return null
}

function readDimensions(filePath) {
  const buffer = fs.readFileSync(filePath)
  return readPngDimensions(buffer) ?? readJpegDimensions(buffer) ?? readWebpDimensions(buffer)
}

function imageKey(fileName, options = {}) {
  return normalizeForMatch(path.parse(fileName).name, options)
}

function createImageRecord(filePath, rootDir) {
  const fileName = path.basename(filePath)
  const sourcePath = sourcePathFromAbsolute(filePath, rootDir)
  const dimensions = readDimensions(filePath)
  return {
    fileName,
    sourcePath,
    url: encodeAssetPath(sourcePath),
    extension: path.extname(fileName).slice(1).toLowerCase(),
    bytes: fs.statSync(filePath).size,
    width: dimensions?.width ?? null,
    height: dimensions?.height ?? null,
    key: imageKey(fileName),
    keyWithoutVersion: imageKey(fileName, { removeVersion: true }),
    referencedBy: [],
  }
}

export function buildImageInventory(rootDir = ROOT_DIR) {
  if (!fs.existsSync(IMAGES_DIR)) return []
  return fs
    .readdirSync(IMAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN-u-co-pinyin'))
    .map((entry) => createImageRecord(path.join(IMAGES_DIR, entry.name), rootDir))
}

function findBySourcePath(inventory, sourcePath) {
  const normalized = sourcePath.toLowerCase()
  return inventory.find((image) => image.sourcePath.toLowerCase() === normalized) ?? null
}

function resolveMapValue(value, inventory, rootDir) {
  if (!value) return null
  const target = typeof value === 'string' ? value : value.sourcePath ?? value.fileName
  if (!target) return null
  const sourcePath = target.replace(/^\.?\//u, '').replace(/^images[\\/]/u, 'images/')
  const direct = findBySourcePath(inventory, sourcePath)
  if (direct) return direct
  const absolute = path.resolve(rootDir, 'images', path.basename(target))
  return fs.existsSync(absolute) ? findBySourcePath(inventory, sourcePathFromAbsolute(absolute, rootDir)) : null
}

function resolveReferenceImage(reference, recipeSourcePath, inventory, rootDir) {
  const target = resolveLocalTarget(reference.target, recipeSourcePath, rootDir)
  if (!target || !target.exists) return null
  if (!IMAGE_EXTENSIONS.has(path.extname(target.absolutePath).toLowerCase())) return null
  return findBySourcePath(inventory, target.sourcePath)
}

function resultFor(image, matchType, score = null, reason = null) {
  if (!image) {
    return {
      status: 'missing',
      url: null,
      sourcePath: null,
      fileName: null,
      width: null,
      height: null,
      bytes: null,
      matchType: 'none',
      score: null,
      reason: reason ?? 'no-candidate',
    }
  }
  return {
    status: 'matched',
    url: image.url,
    sourcePath: image.sourcePath,
    fileName: image.fileName,
    width: image.width,
    height: image.height,
    bytes: image.bytes,
    matchType,
    score,
    reason,
  }
}

function chooseCandidate(title, inventory) {
  const exactKey = normalizeForMatch(title)
  const versionKey = normalizeForMatch(title, { removeVersion: true })
  const exact = inventory.filter((image) => image.key === exactKey)
  if (exact.length === 1) return resultFor(exact[0], 'exact', 100, 'normalized-title')

  const versionMatches = inventory.filter((image) => image.keyWithoutVersion === versionKey)
  if (versionMatches.length === 1) return resultFor(versionMatches[0], 'version', 90, 'version-normalized-title')

  const titleParts = exactKey.split(/[()\uFF08\uFF09/／、|｜]/u).filter((part) => part.length >= 2)
  const scored = inventory
    .map((image) => {
      const imageKey = image.key
      const matchingParts = titleParts.filter((part) => imageKey.includes(part))
      const containsTitle = imageKey.includes(exactKey)
      return {
        image,
        score: (containsTitle ? 60 : 0) + matchingParts.length * 10,
      }
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.image.fileName.localeCompare(b.image.fileName, 'zh-CN'))

  if (scored.length === 0) return resultFor(null, 'none', null, 'no-title-match')
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return resultFor(null, 'ambiguous', scored[0].score, 'ambiguous-title-match')
  }
  return resultFor(scored[0].image, 'containment', scored[0].score, 'title-part-match')
}

export function createImageResolver({ rootDir = ROOT_DIR, imageMapPath = IMAGE_MAP_PATH } = {}) {
  const inventory = buildImageInventory(rootDir)
  const imageMap = readImageMap(imageMapPath)

  function resolve({ title, sourcePath, markdown }) {
    const references = parseInlineLinks(markdown).filter((token) => token.isImage)
    const sourceOverride = imageMap.bySourcePath[sourcePath]
    const titleOverride = imageMap.byTitle[title]
    const override = resolveMapValue(sourceOverride ?? titleOverride, inventory, rootDir)
    if (override) return resultFor(override, 'override', 110, sourceOverride ? 'source-path-map' : 'title-map')

    for (const reference of references) {
      const image = resolveReferenceImage(reference, sourcePath, inventory, rootDir)
      if (image) return resultFor(image, 'markdown-reference', 120, reference.target)
    }

    return chooseCandidate(title, inventory)
  }

  return { inventory, resolve }
}
