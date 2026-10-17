import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatNumber, formatPercent } from './number.js'

test('formatPercent: pt-BR decimal comma, fixed digits, safe with zero total', () => {
  assert.equal(formatPercent(82, 180, 1), '45,6%')
  assert.equal(formatPercent(30, 45), '67%')
  assert.equal(formatPercent(2, 18), '11%')
  assert.equal(formatPercent(1, 0), '0%')
})

test('formatNumber: pt-BR thousands separator and rounding', () => {
  assert.equal(formatNumber(2809), '2.809')
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(1404.6), '1.405')
})
