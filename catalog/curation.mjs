// Helpers for the dev-only curation page (spec 002, T4): the user pastes a TED transcript they copied by
// hand in their own browser; nothing here requests TED.com. Used by the Vite dev middleware (vite.config.js).

const SLUG = /^[a-z0-9_]+$/

/** Slug from a TED talk link the user pasted: https://www.ted.com/talks/<slug>[/transcript][?…]. */
export function slugFromTedUrl(url) {
  const m = /ted\.com\/talks\/([a-z0-9_]+)/i.exec(String(url ?? '').trim())
  return m ? m[1].toLowerCase() : null
}

export const tedTalkUrl = (slug) => `https://www.ted.com/talks/${slug}`
export const tedSearchUrl = (title) => `https://www.ted.com/search?q=${encodeURIComponent(title)}`

/**
 * Duration suggested by the transcript's timestamps ("00:12", "1:02:03"): the last one, in seconds.
 * It is when the last paragraph starts, so it runs a little short; the page lets the user correct it.
 */
export function durationFromTranscript(text) {
  let last = null
  for (const m of String(text ?? '').matchAll(/(?<![\d:])(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?![\d:])/g)) {
    const [h, mi, s] = [Number(m[1] ?? 0), Number(m[2]), Number(m[3])]
    if (s < 60 && (m[1] === undefined || mi < 60)) last = h * 3600 + mi * 60 + s
  }
  return last
}

/** "19:11" or "1:02:03" or "1151" → seconds; null when it does not read as a duration. */
export function parseDuration(value) {
  const v = String(value ?? '').trim()
  if (/^\d+$/.test(v)) return Number(v) || null
  const m = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/.exec(v)
  if (!m || Number(m[3]) >= 60) return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) || null
}

export const formatDuration = (sec) =>
  Number.isInteger(sec) && sec > 0 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : ''

/**
 * Applies one saved transcript to sources.json data. `slug` is the talk's current slug; `tedUrl` may fix it.
 * Returns { data, slug, renamedFrom } or { error } (in Portuguese, shown on the page). Does not mutate `data`.
 */
export function applyCuration(data, { slug, tedUrl, durationSec, text }) {
  const talks = data?.talks ?? []
  const index = talks.findIndex((t) => t.tedSlug === slug)
  if (index < 0) return { error: `talk desconhecido: ${slug}` }
  const newSlug = tedUrl ? slugFromTedUrl(tedUrl) : slug
  if (!newSlug || !SLUG.test(newSlug)) return { error: 'o link do TED deve ser como https://www.ted.com/talks/nome_do_talk' }
  if (newSlug !== slug && talks.some((t) => t.tedSlug === newSlug)) return { error: `outro talk já usa ${newSlug}` }
  if (!Number.isInteger(durationSec) || durationSec <= 0) return { error: 'informe a duração (ex.: 19:11)' }
  if (String(text ?? '').trim().split(/\s+/).length < 100) return { error: 'a transcrição parece curta demais: copiou o texto inteiro?' }
  const next = { ...data, talks: talks.map((t, i) => (i === index ? { ...t, tedSlug: newSlug, durationSec } : t)) }
  return { data: next, slug: newSlug, renamedFrom: newSlug !== slug ? slug : null }
}
