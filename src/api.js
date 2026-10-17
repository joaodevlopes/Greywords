// All free, no API key: Openverse + Wikimedia Commons (images),
// dictionaryapi.dev + Wiktionary (definitions), MyMemory (translation).
// Free APIs can hang, so every call has a timeout and a fallback.

// Image intermediary (spec 003, R1.4–R1.7): the Vite plugin at /api/images in `npm run dev`,
// VITE_IMAGES_API (the Cloudflare Worker) in production, none in Node (tests, image benchmark).
const viteEnv = import.meta.env ?? {}
export const IMAGES_API = viteEnv.VITE_IMAGES_API || (viteEnv.DEV ? '/api/images' : '')

/** Resolves with the promise's value, or with `fallback` if it takes longer than `ms` (or rejects). */
export function orTimeout(promise, ms, fallback = null) {
  let timer
  const late = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms)
  })
  return Promise.race([Promise.resolve(promise).catch(() => fallback), late]).finally(() => clearTimeout(timer))
}

async function getJSON(url, timeoutMs = 6000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) {
    const err = new Error(`HTTP ${r.status}`)
    err.status = r.status
    throw err
  }
  return r.json()
}

// Original logic (before spec 003): both sources in parallel, any Openverse category, Wikimedia fills
// the rest. Kept unchanged for the "antes" image measurement (bench/images); the app uses fetchImagesFor.
export async function fetchImages(q, n = 12) {
  const [ov, wm] = await Promise.allSettled([fetchOpenverse(q, n, { photosOnly: false }), fetchWikimedia(q, n)])
  const imgs = [...(ov.value || []), ...(wm.value || [])].slice(0, n)
  if (!imgs.length && ov.status === 'rejected' && wm.status === 'rejected') throw wm.reason
  return imgs
}

/**
 * Images for a word (spec 003): up to 2 Openverse queries in parallel, photographs only, adult filter on.
 * `queries` come from buildQueries (context first, the word alone last). Results are merged in query
 * order without repeats, up to `n`. Wikimedia is used only when every Openverse query failed or came
 * back empty (R1.2). `limited` is true when Openverse answered 429 (daily/minute quota, R2.4).
 * Throws only when nothing at all could be fetched.
 * @returns {Promise<{ images: object[], limited: boolean, source: 'openverse' | 'wikimedia' }>}
 */
export async function fetchImagesFor(queries, n = 12, { api = IMAGES_API } = {}) {
  const list = [...new Set(queries.filter(Boolean))].slice(0, 2)
  if (!list.length) return { images: [], limited: false, source: 'openverse' }

  // Unsplash first, through the intermediary, with one query: the word alone (or the refine text),
  // which is the last one. At its limit, down, or empty: the Openverse logic below (R1.7).
  let unsplashLimited = false
  if (api) {
    try {
      const q = list[list.length - 1]
      const d = await getJSON(`${api}/search?q=${encodeURIComponent(q)}&n=${n}`, 7000)
      if (d.limited) unsplashLimited = true
      else if (d.images?.length) return { images: d.images.slice(0, n), limited: false, source: 'unsplash' }
    } catch {
      // intermediary unavailable: fall back quietly
    }
  }

  const settled = await Promise.allSettled(list.map((q) => fetchOpenverse(q, n)))
  const limited = unsplashLimited || settled.some((r) => r.status === 'rejected' && r.reason?.status === 429)

  const seen = new Set()
  const images = []
  for (const r of settled) {
    for (const img of r.status === 'fulfilled' ? r.value : []) {
      if (images.length >= n) break
      if (seen.has(img.id)) continue
      seen.add(img.id)
      images.push(img)
    }
  }
  if (images.length) return { images, limited, source: 'openverse' }

  // every Openverse query failed or was empty: the word alone on Wikimedia
  try {
    return { images: await fetchWikimedia(list[list.length - 1], n), limited, source: 'wikimedia' }
  } catch (err) {
    if (settled.every((r) => r.status === 'rejected')) throw err
    return { images: [], limited, source: 'wikimedia' }
  }
}

/**
 * Tells Unsplash that its photos were used (saved), as its API rules ask (R1.6). Fire and forget:
 * a failure changes nothing for the user. Returns how many notices were sent.
 */
export function trackImageUse(images, { api = IMAGES_API } = {}) {
  if (!api) return 0
  const ids = images.filter((img) => img?.source === 'unsplash' && img.id?.startsWith('us:')).map((img) => img.id.slice(3))
  for (const id of ids) fetch(`${api}/download?id=${encodeURIComponent(id)}`).catch(() => {})
  return ids.length
}

async function fetchOpenverse(q, n, { photosOnly = true } = {}) {
  const category = photosOnly ? '&category=photograph' : ''
  const d = await getJSON(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${n}&mature=false${category}`,
    5000,
  )
  return (d.results || [])
    .filter((x) => x.thumbnail || x.url)
    .map((x) => ({
      id: `ov:${x.id}`,
      thumb: x.thumbnail || x.url,
      title: x.title || q,
      credit: x.creator || 'autor desconhecido',
      link: x.foreign_landing_url || x.url,
      source: 'openverse',
    }))
}

async function fetchWikimedia(q, n) {
  const d = await getJSON(
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
      `&generator=search&gsrnamespace=6&gsrlimit=${n}&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}` +
      '&prop=imageinfo&iiprop=url&iiurlwidth=480',
  )
  return Object.values(d.query?.pages || {})
    .sort((a, b) => a.index - b.index)
    .filter((p) => p.imageinfo?.[0]?.thumburl)
    .map((p) => ({
      id: `wm:${p.pageid}`,
      thumb: p.imageinfo[0].thumburl,
      title: p.title.replace(/^File:/, ''),
      credit: 'Wikimedia Commons',
      link: p.imageinfo[0].descriptionurl,
      source: 'wikimedia',
    }))
}

// Returns null when no dictionary knows the word.
// dictionaryapi.dev is preferred (it has phonetic and audio). If it has not answered after `hedgeMs`,
// Wiktionary is asked too and the first real answer wins, so a slow or down dictionaryapi.dev costs
// about `hedgeMs` instead of its whole timeout (spec 003: images wait at most 2 s for the meaning).
export async function fetchDefinition(word, hedgeMs = 1200) {
  const dict = fetchDictionaryApi(word)
  const head = await orTimeout(
    dict.then((value) => ({ value }), (error) => ({ error })),
    hedgeMs,
    null,
  )
  if (head?.value) return head.value
  // failed fast (404 or error): Wiktionary alone. Still pending: race both.
  const wikt = fetchWiktionary(word)
  if (head?.error) return wikt
  try {
    return await Promise.any([dict, wikt.then((v) => v ?? Promise.reject(new Error('not in Wiktionary')))])
  } catch {
    return null
  }
}

async function fetchDictionaryApi(word) {
  const d = await getJSON(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, 4000)
  const phonetics = d.flatMap((e) => e.phonetics || [])
  const audio =
    phonetics.find((p) => p.audio?.includes('-us.'))?.audio ||
    phonetics.find((p) => p.audio)?.audio ||
    ''
  const meanings = d
    .flatMap((e) => e.meanings || [])
    .flatMap((m) =>
      m.definitions.slice(0, 2).map((df) => ({
        pos: m.partOfSpeech,
        definition: df.definition,
        example: df.example || '',
      })),
    )
    .slice(0, 4)
  return {
    phonetic: d[0].phonetic || phonetics.find((p) => p.text)?.text || '',
    audio,
    meanings,
  }
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

// Browser: DOMParser. Node (the image benchmark in bench/images): tags removed by regex.
export const stripHtml = (html) => {
  const text =
    typeof DOMParser !== 'undefined'
      ? new DOMParser().parseFromString(html || '', 'text/html').body.textContent
      : (html || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/&(#\d+|[a-z]+);/gi, (m, e) => (e[0] === '#' ? String.fromCharCode(Number(e.slice(1))) : (ENTITIES[e] ?? m)))
  return text.replace(/\s+/g, ' ').trim()
}

async function fetchWiktionary(word) {
  let d
  try {
    d = await getJSON(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`)
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
  const meanings = (d.en || [])
    .filter((e) => e.language === 'English')
    .flatMap((e) =>
      e.definitions
        .map((df) => ({
          pos: e.partOfSpeech.toLowerCase(),
          definition: stripHtml(df.definition),
          example: stripHtml(df.parsedExamples?.[0]?.example || df.examples?.[0] || ''),
        }))
        .filter((m) => m.definition)
        .slice(0, 2),
    )
    .slice(0, 4)
  return meanings.length ? { phonetic: '', audio: '', meanings } : null
}

export async function fetchTranslation(word) {
  const d = await getJSON(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent('en|pt-BR')}`,
  )
  const main = (d.responseData?.translatedText || '').trim()
  const seen = new Set([main.toLowerCase(), word.toLowerCase()])
  const alts = []
  for (const m of d.matches || []) {
    const t = (m.translation || '').trim()
    if (!t || seen.has(t.toLowerCase()) || t.length > 40) continue
    seen.add(t.toLowerCase())
    alts.push(t)
    if (alts.length === 3) break
  }
  return { main, alts }
}
