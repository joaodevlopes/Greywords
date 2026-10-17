import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildCatalog, quantile, summarize } from './catalog.mjs'
import { buildLemmaMap } from './text.mjs'

const lemmaMap = buildLemmaMap(['we,us,our', 'look,looks,looked', 'at', 'the', 'star,stars', 'and', 'ask,asks,asked', 'new', 'question,questions', 'every', 'night,nights'].join('\n'))
// Synthetic sentences (not real transcripts). The second one has many words outside the mini list.
const PLAIN = 'We look at the stars and we ask new questions every night. '.repeat(12)
const DENSE = 'We look at nebulae and quasars and pulsars every night. Quasars glow. '.repeat(10)

const NICHES = [{ id: 'science', label: 'Ciência' }]
const talks = [
  { tedSlug: 'plain_talk', title: 'Plain', speaker: 'A', durationSec: 60, youtubeId: 'aaaaaaaaaaa', niches: ['science'] },
  { tedSlug: 'dense_talk', title: 'Dense', speaker: 'B', durationSec: 600, youtubeId: 'bbbbbbbbbbb', niches: ['science'] },
]
const texts = new Map([
  ['plain_talk', PLAIN],
  ['dense_talk', DENSE],
])
const catalog = buildCatalog({ niches: NICHES, talks, texts, lemmaMap, generatedAt: '2026-10-16' })

describe('buildCatalog (T5)', () => {
  it('builds one entry per talk with links derived from slug and video id', () => {
    const [plain] = catalog.videos
    assert.equal(plain.id, 'ted:plain_talk')
    assert.equal(plain.tedUrl, 'https://www.ted.com/talks/plain_talk')
    assert.equal(plain.thumb, 'https://i.ytimg.com/vi/aaaaaaaaaaa/mqdefault.jpg')
    assert.deepEqual(Object.keys(catalog), ['generatedAt', 'levelRule', 'niches', 'videos'])
  })

  it('computes speed, uncommon share, level and keywords', () => {
    const [plain, dense] = catalog.videos
    assert.equal(plain.wpm, 144) // 144 words in 60 s
    assert.equal(plain.rareRatio, 0)
    assert.equal(plain.level, 'medium') // fast (> 140) but no uncommon words
    assert.equal(dense.level, 'hard') // most words outside the list
    assert.equal(dense.keywords[0], 'quasar')
  })

  it('never includes transcript text', () => {
    const json = JSON.stringify(catalog)
    assert.ok(!json.includes('ask new questions'))
    assert.ok(!json.includes('Quasars glow'))
  })
})

describe('summarize / quantile', () => {
  it('interpolates quantiles', () => {
    assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5)
    assert.equal(quantile([10], 0.9), 10)
  })

  it('counts levels and niches', () => {
    const s = summarize(catalog.videos)
    assert.equal(s.count, 2)
    assert.deepEqual(s.levels, { easy: 0, medium: 1, hard: 1 })
    assert.deepEqual(s.perNiche, { science: 2 })
    assert.equal(s.wpm.max, 144)
  })
})
