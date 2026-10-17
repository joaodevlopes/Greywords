import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { migrate, serializeState } from './storage.js'

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('migrate (spec 001, T3)', () => {
  it('fills an empty state with every field', () => {
    assert.deepEqual(migrate({}), {
      words: {},
      log: [],
      goals: [],
      checkinDays: [],
      videoNiches: [],
      userLevel: null,
      watchedVideos: {},
      hideWatched: false,
      hiddenImages: {},
      activityDays: [],
    })
  })

  it('seeds activityDays from the review log and saved words of an old state', () => {
    const old = {
      words: {
        sun: { key: 'sun', addedAt: at(2026, 10, 14, 9) },
        river: { key: 'river', addedAt: at(2026, 10, 16, 23) }, // late night stays on the 16th (local time)
      },
      log: [
        { t: at(2026, 10, 15, 8), word: 'sun', q: 4 },
        { t: at(2026, 10, 15, 20), word: 'sun', q: 1 }, // same day twice → once
        { t: at(2026, 10, 16, 7), word: 'river', q: 5 },
      ],
    }
    const state = migrate(old)
    assert.deepEqual(state.activityDays, ['2026-10-14', '2026-10-15', '2026-10-16'])
    assert.deepEqual(state.goals, [])
    assert.deepEqual(state.checkinDays, [])
    assert.equal(state.words, old.words) // words and log are kept as they were
    assert.equal(state.log, old.log)
  })

  it('returns an already-migrated state unchanged', () => {
    const current = {
      words: { sun: { key: 'sun', addedAt: at(2026, 10, 1) } },
      log: [{ t: at(2026, 10, 2), word: 'sun', q: 4 }],
      goals: [{ from: '2026-10-12', days: 4 }],
      checkinDays: ['2026-10-13'],
      activityDays: ['2026-10-14'], // not re-seeded from log/words once present
      videoNiches: ['tech'],
      userLevel: 'advanced',
      watchedVideos: { 'ted:x': '2026-10-15' },
      hideWatched: true,
      hiddenImages: { sun: ['ov:1'] },
    }
    assert.deepEqual(migrate(current), current)
  })

  it('ignores malformed log rows and words without a date', () => {
    const state = migrate({ words: { x: { key: 'x' } }, log: [null, { t: 'ontem' }, { t: at(2026, 10, 3) }] })
    assert.deepEqual(state.activityDays, ['2026-10-03'])
  })

  it('does not mutate the saved object', () => {
    const saved = { words: {}, log: [] }
    migrate(saved)
    assert.deepEqual(saved, { words: {}, log: [] })
  })
})

describe('serializeState (spec 001, R5.2)', () => {
  it('exports goals, activity and check-in days with the words', () => {
    const state = migrate({ words: {}, log: [], goals: [{ from: '2026-10-12', days: 4 }], checkinDays: ['2026-10-15'], activityDays: ['2026-10-16'] })
    const out = JSON.parse(serializeState(state))
    assert.deepEqual(out.goals, [{ from: '2026-10-12', days: 4 }])
    assert.deepEqual(out.checkinDays, ['2026-10-15'])
    assert.deepEqual(out.activityDays, ['2026-10-16'])
  })
})

describe('migrate video fields (spec 002, T6)', () => {
  it('replaces invalid saved values with defaults', () => {
    const s = migrate({ userLevel: 'expert', watchedVideos: ['x'], hideWatched: 'yes', videoNiches: 'tech' })
    assert.equal(s.userLevel, null)
    assert.deepEqual(s.watchedVideos, {})
    assert.equal(s.hideWatched, false)
    assert.deepEqual(s.videoNiches, [])
  })
})

describe('migrate hiddenImages (spec 003, T6)', () => {
  it('adds an empty map to old data', () => {
    assert.deepEqual(migrate({ words: {}, log: [] }).hiddenImages, {})
  })
  it('keeps saved hidden images and drops malformed entries', () => {
    const s = migrate({ hiddenImages: { sun: ['ov:1', 2, 'wm:3'], bad: 'ov:9' } })
    assert.deepEqual(s.hiddenImages, { sun: ['ov:1', 'wm:3'] })
  })
  it('replaces a non-object value', () => {
    assert.deepEqual(migrate({ hiddenImages: ['ov:1'] }).hiddenImages, {})
  })
})
