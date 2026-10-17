import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { contrastRatio, parsePalette } from './contrast.js'

const palette = parsePalette(readFileSync(new URL('./palette.css', import.meta.url), 'utf8'))

// [foreground, background] pairs actually used by the app. Text needs 4.5:1, graphics 3:1 (WCAG AA).
const TEXT = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'raised'],
  ['ink-soft', 'bg'],
  ['ink-soft', 'surface'],
  ['ink-soft', 'raised'],
  ['brand-ink', 'bg'],
  ['brand-ink', 'surface'],
  ['brand-ink', 'raised'],
  ['terracotta', 'bg'],
  ['cta-fg', 'cta-bg'],
]
const GRAPHIC = [
  ['brand', 'bg'],
  ['brand', 'surface'],
  ['brand', 'raised'],
]

test('palette: both themes define the same tokens', () => {
  assert.ok(Object.keys(palette.light).length > 10)
  assert.deepEqual(Object.keys(palette.dark).sort(), Object.keys(palette.light).sort())
})

test('contrastRatio: known reference values', () => {
  assert.equal(contrastRatio('#000000', '#ffffff').toFixed(1), '21.0')
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1)
})

for (const theme of ['light', 'dark']) {
  for (const [fg, bg] of TEXT) {
    test(`palette ${theme}: text ${fg} on ${bg} >= 4.5`, () => {
      const ratio = contrastRatio(palette[theme][fg], palette[theme][bg])
      assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}:1`)
    })
  }
  for (const [fg, bg] of GRAPHIC) {
    test(`palette ${theme}: graphic ${fg} on ${bg} >= 3`, () => {
      const ratio = contrastRatio(palette[theme][fg], palette[theme][bg])
      assert.ok(ratio >= 3, `${ratio.toFixed(2)}:1`)
    })
  }
}
