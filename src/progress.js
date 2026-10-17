// Study calendar logic (spec 001). Pure functions, no React.
// Days are 'YYYY-MM-DD' keys in LOCAL time: never toISOString (UTC shifts the day at night in Brazil),
// and day math goes through new Date(y, m, d + n), never by adding milliseconds (DST-safe).

const pad = (n) => String(n).padStart(2, '0')

/** Local calendar day of a Date or timestamp, as 'YYYY-MM-DD'. */
export function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Local midnight (or the first valid hour, on DST days) of a day key. */
export function parseDay(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key, n) {
  const d = parseDay(key)
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n))
}

/** Monday of the week that contains `key` (weeks run Monday → Sunday). */
export function mondayOf(key) {
  const offset = (parseDay(key).getDay() + 6) % 7
  return addDays(key, -offset)
}

/**
 * Weeks of a month, Monday first. `month` is 0-based like Date.
 * Each week: { monday, days: [7 day keys, null where the day is outside the month] }.
 * `monday` may fall in the previous month; it identifies the whole week.
 */
export function monthGrid(year, month) {
  const first = dayKey(new Date(year, month, 1))
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks = []
  let monday = mondayOf(first)
  for (;;) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const key = addDays(monday, i)
      const d = parseDay(key)
      return d.getFullYear() === year && d.getMonth() === month ? key : null
    })
    if (days.every((k) => k === null)) break
    weeks.push({ monday, days })
    if (days.includes(dayKey(new Date(year, month, daysInMonth)))) break
    monday = addDays(monday, 7)
  }
  return weeks
}

// ---------- goals, weeks and streak ----------

export const MIN_GOAL = 1
export const MAX_GOAL = 7

/**
 * Sets the weekly goal from the current week on. Past weeks keep the goal they had:
 * same week → replaces that week's entry; new week → appends. Sorted by `from`.
 */
export function withGoal(goals, days, today = dayKey()) {
  if (!Number.isInteger(days) || days < MIN_GOAL || days > MAX_GOAL) {
    throw new RangeError(`goal must be an integer from ${MIN_GOAL} to ${MAX_GOAL}`)
  }
  const from = mondayOf(today)
  return [...goals.filter((g) => g.from < from), { from, days }]
}

/** Goal (days) in force for the week starting at `monday`, or null before the first goal. */
export function goalForWeek(goals, monday) {
  let days = null
  for (const g of goals) if (g.from <= monday) days = g.days
  return days
}

/** Days that count as studied: app activity or manual check-in, each day once. */
export function studiedDays(state) {
  return new Set([...(state.activityDays ?? []), ...(state.checkinDays ?? [])])
}

export function weekSummary(state, monday, studied = studiedDays(state)) {
  let count = 0
  for (let i = 0; i < 7; i++) if (studied.has(addDays(monday, i))) count++
  const goal = goalForWeek(state.goals ?? [], monday)
  return { monday, count, goal, met: goal !== null && count >= goal }
}

/**
 * True when the week's goal was just reached by studying (spec 005, B5): same week, not met before,
 * met now, and the count went up. Lowering the goal or reopening the app never counts.
 */
export function goalJustMet(prev, next) {
  return Boolean(prev && next && prev.monday === next.monday && !prev.met && next.met && next.count > prev.count)
}

/**
 * Consecutive weeks with the goal met, counting back from the current week.
 * The current week counts only once met; while still open it does not break the streak.
 * A week without a goal, or below it, ends the streak.
 */
export function currentStreak(state, today = dayKey()) {
  const studied = studiedDays(state)
  let monday = mondayOf(today)
  let streak = weekSummary(state, monday, studied).met ? 1 : 0
  // bounded walk back: ~10 years of weeks
  for (let i = 0; i < 520; i++) {
    monday = addDays(monday, -7)
    if (!weekSummary(state, monday, studied).met) break
    streak++
  }
  return streak
}

// ---------- day lists (activityDays, checkinDays) ----------

/** Adds a day to a sorted list of day keys; same array back if already there. */
export function withDay(list = [], key = dayKey()) {
  return list.includes(key) ? list : [...list, key].sort()
}

export function withoutDay(list = [], key = dayKey()) {
  return list.includes(key) ? list.filter((k) => k !== key) : list
}
