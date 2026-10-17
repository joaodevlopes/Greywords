import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterVideos, formatDuration, newKeywords, sortVideos, targetLevel } from './videos.js'

const v = (id, level, durationSec, niches = ['tech'], title = id) => ({ id, level, durationSec, niches, title })
const VIDEOS = [
  v('hard-short', 'hard', 300),
  v('easy-long', 'easy', 900, ['science']),
  v('medium-mid', 'medium', 600, ['games', 'tech']),
  v('easy-short', 'easy', 400),
  v('medium-short', 'medium', 200, ['food']),
]
const ids = (list) => list.map((x) => x.id)

describe('targetLevel', () => {
  it('maps the user level to a video level', () => {
    assert.equal(targetLevel('beginner'), 'easy')
    assert.equal(targetLevel('advanced'), 'hard')
    assert.equal(targetLevel(null), null)
  })
})

describe('sortVideos (R2.3)', () => {
  it('puts the closest level first, then shorter videos', () => {
    assert.deepEqual(ids(sortVideos(VIDEOS, 'beginner')), ['easy-short', 'easy-long', 'medium-short', 'medium-mid', 'hard-short'])
    assert.deepEqual(ids(sortVideos(VIDEOS, 'intermediate')), ['medium-short', 'medium-mid', 'hard-short', 'easy-short', 'easy-long'])
  })

  it('sorts by duration when there is no user level', () => {
    assert.deepEqual(ids(sortVideos(VIDEOS, null)), ['medium-short', 'hard-short', 'easy-short', 'medium-mid', 'easy-long'])
  })

  it('does not mutate the input', () => {
    const copy = [...VIDEOS]
    sortVideos(VIDEOS, 'advanced')
    assert.deepEqual(VIDEOS, copy)
  })
})

describe('filterVideos (R2.4, R5.4)', () => {
  it('keeps only the user niches', () => {
    assert.deepEqual(ids(filterVideos(VIDEOS, { niches: ['science', 'food'] })), ['easy-long', 'medium-short'])
  })

  it('applies niche and level filters', () => {
    assert.deepEqual(ids(filterVideos(VIDEOS, { niches: ['tech', 'games'], niche: 'games' })), ['medium-mid'])
    assert.deepEqual(ids(filterVideos(VIDEOS, { niches: ['tech'], level: 'easy' })), ['easy-short'])
  })

  it('returns an empty list when nothing matches', () => {
    assert.deepEqual(filterVideos(VIDEOS, { niches: ['sports'] }), [])
  })

  it('hides watched videos only when asked', () => {
    const watched = { 'easy-short': '2026-10-16' }
    assert.ok(ids(filterVideos(VIDEOS, { watched })).includes('easy-short'))
    assert.ok(!ids(filterVideos(VIDEOS, { watched, hideWatched: true })).includes('easy-short'))
  })
})

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    assert.equal(formatDuration(1151), '19:11')
    assert.equal(formatDuration(65), '1:05')
    assert.equal(formatDuration(3725), '1:02:05')
  })
})

describe('newKeywords (R6.1)', () => {
  it('drops words already in the dictionary', () => {
    assert.deepEqual(newKeywords(['galaxy', 'orbit', 'Comet'], { orbit: {}, comet: {} }), ['galaxy'])
  })
})
