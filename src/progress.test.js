import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  addDays,
  currentStreak,
  dayKey,
  goalForWeek,
  goalJustMet,
  mondayOf,
  monthGrid,
  parseDay,
  studiedDays,
  weekSummary,
  withDay,
  withGoal,
  withoutDay,
} from './progress.js'

describe('dayKey', () => {
  it('uses the local calendar day, zero-padded', () => {
    assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05')
  })

  it('keeps the same day at 23:59 local time', () => {
    assert.equal(dayKey(new Date(2026, 9, 16, 23, 59)), '2026-10-16')
  })

  it('accepts timestamps', () => {
    assert.equal(dayKey(new Date(2026, 9, 16, 8).getTime()), '2026-10-16')
  })

  it('round-trips with parseDay', () => {
    assert.equal(dayKey(parseDay('2026-02-28')), '2026-02-28')
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    assert.equal(addDays('2026-10-31', 1), '2026-11-01')
    assert.equal(addDays('2026-12-31', 1), '2027-01-01')
    assert.equal(addDays('2026-03-01', -1), '2026-02-28')
    assert.equal(addDays('2028-03-01', -1), '2028-02-29')
  })
})

describe('mondayOf (weeks start on Monday)', () => {
  it('returns the same day for a Monday', () => {
    assert.equal(mondayOf('2026-10-12'), '2026-10-12')
  })

  it('maps mid-week days to that Monday', () => {
    assert.equal(mondayOf('2026-10-16'), '2026-10-12') // Friday
  })

  it('puts Sunday in the week that started the Monday before', () => {
    assert.equal(mondayOf('2026-10-18'), '2026-10-12')
  })

  it('crosses into the previous month and year', () => {
    assert.equal(mondayOf('2026-10-01'), '2026-09-28') // Thursday
    assert.equal(mondayOf('2027-01-01'), '2026-12-28') // Friday
  })
})

describe('monthGrid', () => {
  it('lays out October 2026 starting on Thursday, Monday first', () => {
    const weeks = monthGrid(2026, 9)
    assert.equal(weeks.length, 5)
    assert.deepEqual(weeks[0].days, [null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'])
    assert.equal(weeks[0].monday, '2026-09-28')
    assert.deepEqual(weeks[4].days, ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', null])
  })

  it('contains every day of the month once, in order, for a whole year', () => {
    for (let month = 0; month < 12; month++) {
      const weeks = monthGrid(2027, month)
      const days = weeks.flatMap((w) => w.days).filter(Boolean)
      const expected = Array.from({ length: new Date(2027, month + 1, 0).getDate() }, (_, i) =>
        dayKey(new Date(2027, month, i + 1)),
      )
      assert.deepEqual(days, expected, `month ${month}`)
      for (const w of weeks) {
        assert.equal(w.days.length, 7)
        assert.equal(mondayOf(w.days.find(Boolean)), w.monday)
      }
    }
  })

  it('handles a month that starts on Monday and ends on Sunday (Feb 2021)', () => {
    const weeks = monthGrid(2021, 1)
    assert.equal(weeks.length, 4)
    assert.ok(weeks.every((w) => w.days.every(Boolean)))
  })
})

describe('daylight saving time', () => {
  // Brazil's last DST start: 2018-11-04 at 00:00 São Paulo, so that midnight never existed.
  it('does not skip or repeat days around a DST change', { skip: !supportsTz('America/Sao_Paulo') }, () => {
    withTz('America/Sao_Paulo', () => {
      assert.equal(addDays('2018-11-03', 1), '2018-11-04')
      assert.equal(addDays('2018-11-04', 1), '2018-11-05')
      assert.equal(dayKey(parseDay('2018-11-04')), '2018-11-04')
      assert.equal(mondayOf('2018-11-04'), '2018-10-29') // that day was a Sunday
    })
  })
})

function withTz(tz, fn) {
  const previous = process.env.TZ
  process.env.TZ = tz
  try {
    fn()
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
}

function supportsTz(tz) {
  let ok = false
  withTz(tz, () => {
    // 2018-11-04 00:00 does not exist in São Paulo; the engine moves it to 01:00
    ok = new Date(2018, 10, 4).getHours() === 1
  })
  return ok
}

// ---------- T2: goals, weeks and streak ----------
// Reference weeks (Mondays): 2026-09-28, 2026-10-05, 2026-10-12. "Today" = Friday 2026-10-16.
const TODAY = '2026-10-16'
const days = (monday, n) => Array.from({ length: n }, (_, i) => addDays(monday, i))

describe('withGoal / goalForWeek', () => {
  it('replaces the goal when changed again in the same week', () => {
    let goals = withGoal([], 3, '2026-10-13')
    goals = withGoal(goals, 5, TODAY)
    assert.deepEqual(goals, [{ from: '2026-10-12', days: 5 }])
  })

  it('appends when changed in a new week, keeping past weeks on the old goal', () => {
    const goals = withGoal(withGoal([], 3, '2026-10-01'), 5, TODAY)
    assert.deepEqual(goals, [
      { from: '2026-09-28', days: 3 },
      { from: '2026-10-12', days: 5 },
    ])
    assert.equal(goalForWeek(goals, '2026-09-28'), 3)
    assert.equal(goalForWeek(goals, '2026-10-05'), 3)
    assert.equal(goalForWeek(goals, '2026-10-12'), 5)
  })

  it('has no goal before the first one was set', () => {
    const goals = withGoal([], 4, TODAY)
    assert.equal(goalForWeek(goals, '2026-10-05'), null)
  })

  it('only accepts whole numbers from 1 to 7', () => {
    for (const bad of [0, 8, 2.5, '4', null]) assert.throws(() => withGoal([], bad, TODAY), RangeError)
    assert.doesNotThrow(() => withGoal([], 1, TODAY))
    assert.doesNotThrow(() => withGoal([], 7, TODAY))
  })
})

describe('studiedDays / weekSummary', () => {
  it('counts a day with both activity and check-in once', () => {
    const state = { activityDays: ['2026-10-13', '2026-10-14'], checkinDays: ['2026-10-14', '2026-10-15'] }
    assert.deepEqual([...studiedDays(state)].sort(), ['2026-10-13', '2026-10-14', '2026-10-15'])
    assert.equal(weekSummary(state, '2026-10-12').count, 3)
  })

  it('reports met only when the count reaches the goal', () => {
    const goals = withGoal([], 4, TODAY)
    const three = { goals, activityDays: days('2026-10-12', 3) }
    const four = { goals, activityDays: days('2026-10-12', 4) }
    assert.deepEqual(weekSummary(three, '2026-10-12'), { monday: '2026-10-12', count: 3, goal: 4, met: false })
    assert.equal(weekSummary(four, '2026-10-12').met, true)
  })

  it('does not count days from the next or previous week', () => {
    const state = { goals: [], activityDays: ['2026-10-11', '2026-10-19'] } // Sunday before, Monday after
    assert.equal(weekSummary(state, '2026-10-12').count, 0)
  })

  it('handles missing fields (state before migration)', () => {
    assert.deepEqual(weekSummary({}, '2026-10-12'), { monday: '2026-10-12', count: 0, goal: null, met: false })
  })
})

describe('currentStreak', () => {
  const goals = withGoal([], 2, '2026-09-28')

  it('counts consecutive met weeks including the current one once met', () => {
    const state = { goals, activityDays: [...days('2026-09-28', 2), ...days('2026-10-05', 2), ...days('2026-10-12', 2)] }
    assert.equal(currentStreak(state, TODAY), 3)
  })

  it('does not break while the current week is still open', () => {
    const state = { goals, activityDays: [...days('2026-09-28', 2), ...days('2026-10-05', 2), '2026-10-12'] }
    assert.equal(currentStreak(state, TODAY), 2)
  })

  it('stops at a week below the goal', () => {
    const state = { goals, activityDays: [...days('2026-09-28', 2), '2026-10-05', ...days('2026-10-12', 2)] }
    assert.equal(currentStreak(state, TODAY), 1)
  })

  it('stops at weeks before the first goal', () => {
    const late = withGoal([], 2, '2026-10-05')
    const state = { goals: late, activityDays: [...days('2026-09-28', 7), ...days('2026-10-05', 2), ...days('2026-10-12', 2)] }
    assert.equal(currentStreak(state, TODAY), 2)
  })

  it('is zero with no goal or no study', () => {
    assert.equal(currentStreak({}, TODAY), 0)
    assert.equal(currentStreak({ goals }, TODAY), 0)
  })
})

describe('withDay / withoutDay (T4)', () => {
  it('adds a day once and keeps the list sorted', () => {
    const list = withDay(['2026-10-16'], '2026-10-14')
    assert.deepEqual(list, ['2026-10-14', '2026-10-16'])
    assert.equal(withDay(list, '2026-10-16'), list) // already there: same array, no re-render
  })

  it('removes a day and leaves the list alone when absent', () => {
    assert.deepEqual(withoutDay(['2026-10-14', '2026-10-16'], '2026-10-16'), ['2026-10-14'])
    const list = ['2026-10-14']
    assert.equal(withoutDay(list, '2026-10-20'), list)
  })

  it('handles a missing list', () => {
    assert.deepEqual(withDay(undefined, '2026-10-16'), ['2026-10-16'])
    assert.deepEqual(withoutDay(undefined, '2026-10-16'), [])
  })
})

describe('goalJustMet (spec 005, B5)', () => {
  const week = (count, goal, monday = '2026-10-12') => ({ monday, count, goal, met: goal !== null && count >= goal })
  it('fires when studying reaches the goal', () => {
    assert.equal(goalJustMet(week(3, 4), week(4, 4)), true)
  })
  it('does not fire again once met, or when nothing changed', () => {
    assert.equal(goalJustMet(week(4, 4), week(5, 4)), false)
    assert.equal(goalJustMet(week(4, 4), week(4, 4)), false)
  })
  it('does not fire when the goal is lowered without new study', () => {
    assert.equal(goalJustMet(week(3, 4), week(3, 3)), false)
  })
  it('does not fire across weeks or without a previous value', () => {
    assert.equal(goalJustMet(week(3, 4, '2026-10-05'), week(4, 4)), false)
    assert.equal(goalJustMet(null, week(4, 4)), false)
  })
})
