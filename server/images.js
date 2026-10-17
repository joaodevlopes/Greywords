// Image search intermediary (spec 003, R1.4–R1.7). It keeps the Unsplash key away from the browser.
// Runtime-agnostic (only fetch and URLSearchParams; returns plain data): used by the Vite dev plugin (vite.config.js)
// and by the Cloudflare Worker (worker/index.js). The app talks to it at <VITE_IMAGES_API>/search and /download.

const API = 'https://api.unsplash.com'
const UTM = 'utm_source=greywords&utm_medium=referral'
const MAX_IMAGES = 12
const TIMEOUT_MS = 6000

/** Adds the referral parameters Unsplash asks for on every link back to it. */
export function withUtm(url) {
  if (!url) return ''
  return `${url}${url.includes('?') ? '&' : '?'}${UTM}`
}

/** Unsplash search URL: safest content filter, at most 12 photos. */
export function searchUrl(query, n = MAX_IMAGES) {
  const count = Math.min(MAX_IMAGES, Math.max(1, Number.parseInt(n, 10) || MAX_IMAGES))
  const params = new URLSearchParams({ query, per_page: String(count), content_filter: 'high' })
  return `${API}/search/photos?${params}`
}

/** Unsplash photo → the image shape the app stores (plus the credit link and the id for /download). */
export function trimPhoto(photo, query = '') {
  return {
    id: `us:${photo.id}`,
    thumb: photo.urls?.small ?? photo.urls?.regular ?? '',
    title: photo.alt_description || photo.description || query,
    credit: photo.user?.name || 'Unsplash',
    creditLink: withUtm(photo.user?.links?.html),
    link: withUtm(photo.links?.html),
    source: 'unsplash',
  }
}

// Unsplash photo ids are short url-safe strings ("Hcfwew744z4").
export const isPhotoId = (id) => typeof id === 'string' && /^[A-Za-z0-9_-]{6,32}$/.test(id)

const json = (status, body, cacheSeconds = 0) => ({ status, body, cacheSeconds })

/**
 * Handles one request. `path` is what comes after the mount point ("/search" or "/download").
 * Returns { status, body, cacheSeconds }; the caller turns it into an HTTP response.
 * A 429 from Unsplash is not an error for the app: it gets { images: [], limited: true } and falls back.
 */
export async function handle(path, params, { key, fetchImpl = fetch } = {}) {
  if (!key) return json(503, { error: 'missing UNSPLASH_ACCESS_KEY' })
  const headers = { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' }

  if (path === '/search') {
    const query = (params.get('q') ?? '').trim().slice(0, 80)
    if (!query) return json(400, { error: 'missing q' })
    let res
    try {
      res = await fetchImpl(searchUrl(query, params.get('n')), { headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
    } catch {
      return json(502, { error: 'unsplash unreachable' })
    }
    // Unsplash answers its hourly limit with 403 "Rate Limit Exceeded" (X-Ratelimit-Remaining: 0), not only 429
    const outOfQuota = res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')
    if (outOfQuota) return json(200, { images: [], limited: true })
    if (!res.ok) return json(502, { error: `unsplash ${res.status}` })
    const data = await res.json()
    const images = (data.results ?? []).filter((p) => p?.id && p.urls).map((p) => trimPhoto(p, query))
    return json(200, { images, limited: false }, 24 * 60 * 60)
  }

  if (path === '/download') {
    const id = params.get('id') ?? ''
    if (!isPhotoId(id)) return json(400, { error: 'invalid id' })
    try {
      const res = await fetchImpl(`${API}/photos/${id}/download`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
      return json(res.ok ? 200 : 502, { ok: res.ok })
    } catch {
      return json(502, { ok: false })
    }
  }

  return json(404, { error: 'not found' })
}
