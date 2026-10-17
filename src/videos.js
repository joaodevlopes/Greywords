// Video recommendations logic (spec 002). Pure functions, tested in videos.test.js.

export const LEVELS = ['easy', 'medium', 'hard']
export const LEVEL_LABEL = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }

export const USER_LEVELS = [
  { id: 'beginner', label: 'Iniciante', target: 'easy' },
  { id: 'intermediate', label: 'Intermediário', target: 'medium' },
  { id: 'advanced', label: 'Avançado', target: 'hard' },
]

export function targetLevel(userLevel) {
  return USER_LEVELS.find((l) => l.id === userLevel)?.target ?? null
}

/**
 * Closest level to the user's first (R2.3), then shorter videos, then title.
 * Without a user level, shorter first.
 */
export function sortVideos(videos, userLevel) {
  const target = LEVELS.indexOf(targetLevel(userLevel))
  const distance = (v) => (target < 0 ? 0 : Math.abs(LEVELS.indexOf(v.level) - target))
  return [...videos].sort(
    (a, b) => distance(a) - distance(b) || a.durationSec - b.durationSec || a.title.localeCompare(b.title),
  )
}

/**
 * Keeps videos from the user's niches, then applies the niche / level filters (R2.4)
 * and hides watched ones when asked (R5.4). 'all' means no filter.
 */
export function filterVideos(videos, { niches = [], niche = 'all', level = 'all', hideWatched = false, watched = {} } = {}) {
  const mine = new Set(niches)
  return videos.filter(
    (v) =>
      (!mine.size || v.niches.some((n) => mine.has(n))) &&
      (niche === 'all' || v.niches.includes(niche)) &&
      (level === 'all' || v.level === level) &&
      !(hideWatched && watched[v.id]),
  )
}

/** 1151 → "19:11"; 3725 → "1:02:05". */
export function formatDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = String(sec % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** Video keywords not yet in the user's dictionary (R6.1). */
export function newKeywords(keywords = [], words = {}) {
  return keywords.filter((k) => !(k.toLowerCase() in words))
}
