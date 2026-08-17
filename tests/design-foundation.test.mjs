import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readRepoFile = (relativePath) => readFile(path.join(repoRoot, relativePath), 'utf8')

test('design foundation imports the complete style stack', async () => {
  const index = await readRepoFile('.vitepress/theme/styles/index.css')

  for (const layer of ['reset', 'tokens', 'typography', 'animation', 'global']) {
    assert.match(index, new RegExp(`@import ".+/${layer}\\.css"`))
  }
})

test('design tokens cover the shared visual and motion vocabulary', async () => {
  const tokens = await readRepoFile('.vitepress/theme/styles/tokens.css')

  for (const token of [
    '--color-paper',
    '--color-ink',
    '--color-accent',
    '--space-4',
    '--font-display',
    '--text-xl',
    '--motion-duration-base',
    '--motion-ease-standard',
    '--focus-color',
  ]) {
    assert.match(tokens, new RegExp(`${token}:`))
  }
})

test('foundation includes visible focus treatment and reduced-motion handling', async () => {
  const globalStyles = await readRepoFile('.vitepress/theme/styles/global.css')
  const animationStyles = await readRepoFile('.vitepress/theme/styles/animation.css')

  assert.match(globalStyles, /:focus-visible/)
  assert.match(animationStyles, /prefers-reduced-motion: reduce/)
  assert.match(animationStyles, /animation: none/)
  assert.match(animationStyles, /transition: none/)
})

test('the sandbox uses Lucide for functional icons and contains no emoji glyphs', async () => {
  const sandbox = await readRepoFile('.vitepress/theme/DesignFoundationSandbox.vue')
  const packageJson = JSON.parse(await readRepoFile('package.json'))

  assert.equal(packageJson.devDependencies['@lucide/vue'] !== undefined, true)
  assert.match(sandbox, /from '@lucide\/vue'/)
  assert.match(sandbox, /<Search /)
  assert.match(sandbox, /<ArrowUpRight /)
  assert.doesNotMatch(sandbox, /[\u{1F000}-\u{1FAFF}]/u)
})
