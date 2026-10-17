import { test } from 'node:test'
import assert from 'node:assert/strict'
import { revealVariants, splitWords, textVariants } from './variants.js'

test('splitWords: keeps punctuation with the word and drops extra spaces', () => {
  assert.deepEqual(splitWords('  Aprenda palavras  vendo, não traduzindo. '), [
    'Aprenda',
    'palavras',
    'vendo,',
    'não',
    'traduzindo.',
  ])
})

test('textVariants: full motion staggers and moves each word', () => {
  const v = textVariants(false, { stagger: 0.1 })
  assert.equal(v.container.visible.transition.staggerChildren, 0.1)
  assert.equal(v.item.hidden.opacity, 0)
  assert.equal(v.item.hidden.y, '0.3em')
})

test('textVariants: reduced motion shows words at once, without movement (R5.1)', () => {
  const v = textVariants(true)
  assert.deepEqual(v.item.hidden, { opacity: 1 })
  assert.deepEqual(v.container.visible, {})
})

test('revealVariants: full motion rises, unblurs and fades in', () => {
  const v = revealVariants(false)
  assert.equal(v.hidden.opacity, 0)
  assert.equal(v.hidden.y, 8)
  assert.equal(v.hidden.filter, 'blur(6px)')
  assert.equal(v.visible.y, 0)
  assert.equal(v.visible.opacity, 1)
})

test('revealVariants: delay is carried in the visible transition', () => {
  assert.equal(revealVariants(false, { delay: 0.3 }).visible.transition.delay, 0.3)
  assert.equal(revealVariants(true, { delay: 0.3 }).visible.transition.delay, 0.3)
})

test('revealVariants: reduced motion only fades (R5.1)', () => {
  const v = revealVariants(true)
  for (const state of [v.hidden, v.visible]) {
    assert.deepEqual(
      Object.keys(state).filter((k) => k !== 'transition'),
      ['opacity'],
    )
  }
})
