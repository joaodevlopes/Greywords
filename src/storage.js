import { dayKey } from './progress.js'

const KEY = 'greywords:v1'
// earlier name of the project; read once so saved words survive the rename
const LEGACY_KEY = 'lexi:v1'

/**
 * Brings any saved state up to the current shape without losing data (spec 001, R5.1).
 * Adds goals / checkinDays / video preferences empty, and seeds activityDays once from the review log
 * and the day each word was saved, so existing history shows on the calendar.
 * Already-current state comes back unchanged.
 */
export function migrate(saved) {
  const state = { words: {}, log: [], ...saved }
  if (!Array.isArray(state.goals)) state.goals = []
  if (!Array.isArray(state.checkinDays)) state.checkinDays = []
  // spec 002: video preferences
  if (!Array.isArray(state.videoNiches)) state.videoNiches = []
  if (!['beginner', 'intermediate', 'advanced'].includes(state.userLevel)) state.userLevel = null
  if (!state.watchedVideos || typeof state.watchedVideos !== 'object' || Array.isArray(state.watchedVideos)) state.watchedVideos = {}
  if (typeof state.hideWatched !== 'boolean') state.hideWatched = false
  // spec 003, R1.3: images hidden per word ({ [word]: [imageId] }); keeps only well-formed lists
  const hidden = state.hiddenImages
  state.hiddenImages = {}
  if (hidden && typeof hidden === 'object' && !Array.isArray(hidden)) {
    for (const [word, ids] of Object.entries(hidden)) {
      if (Array.isArray(ids)) state.hiddenImages[word] = ids.filter((id) => typeof id === 'string')
    }
  }
  if (!Array.isArray(state.activityDays)) {
    const days = new Set()
    for (const r of state.log) if (Number.isFinite(r?.t)) days.add(dayKey(r.t))
    for (const w of Object.values(state.words)) if (Number.isFinite(w?.addedAt)) days.add(dayKey(w.addedAt))
    state.activityDays = [...days].sort()
  }
  return state
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (raw) return migrate(JSON.parse(raw))
  } catch {
    // storage blocked or corrupt: start fresh
  }
  return migrate({})
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // quota or private mode: nothing to do
  }
}

/** JSON of the whole state: words, review log, goals, activity and check-in days (spec 001, R5.2). */
export function serializeState(state) {
  return JSON.stringify(state, null, 2)
}

export function exportState(state) {
  const blob = new Blob([serializeState(state)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `greywords-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}
