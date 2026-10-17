import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDemoState } from './demoState.js'
import { currentStreak, dayKey, weekSummary, mondayOf } from '../progress.js'
import { isDue } from '../srs.js'
import { migrate } from '../storage.js'

const now = new Date(2026, 9, 15, 14).getTime() // a Thursday
const images = { sun: 'data:a', moon: 'data:b', beach: 'data:c', sunset: 'data:d', field: 'data:e', lamp: 'data:f' }
const state = buildDemoState({ images, now })

test('demo state is already in the current shape (migrate leaves it unchanged)', () => {
  assert.deepEqual(migrate(structuredClone(state)), state)
})

test('demo state has words to review now and words scheduled later', () => {
  const due = Object.values(state.words).filter((w) => isDue(w.srs, now))
  assert.equal(due.length, 3)
  assert.equal(Object.keys(state.words).length, 6)
  for (const w of Object.values(state.words)) assert.equal(w.images[0].thumb, images[w.word])
})

test('demo state never has days or reviews in the future', () => {
  const today = dayKey(now)
  assert.ok(state.activityDays.every((d) => d <= today))
  assert.ok(state.log.every((r) => r.t <= now))
})

test('demo state shows a met goal streak and progress this week', () => {
  assert.equal(currentStreak(state, dayKey(now)), 3)
  const week = weekSummary(state, mondayOf(dayKey(now)))
  assert.equal(week.goal, 4)
  assert.ok(week.count >= 3)
})
