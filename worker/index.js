// Production image intermediary (spec 003, R1.5): a Cloudflare Worker around server/images.js.
// The Unsplash key is a Worker secret (npx wrangler secret put UNSPLASH_ACCESS_KEY), never in the site.
// Routes: GET /search?q=&n=  and  GET /download?id=  (the app calls them at VITE_IMAGES_API).
// Searches are kept for a day in Workers KV (binding IMAGE_CACHE), so a repeated word does not spend the
// Unsplash quota. KV and not the edge Cache API: caches.default does nothing on *.workers.dev.
// The X-Greywords-Cache header says hit or miss.
import { handle } from '../server/images.js'

const DAY = 24 * 60 * 60
const JSON_HEADERS = { 'content-type': 'application/json' }

// Same search, same key: the query is trimmed and lowercased ("Study " = "study"); n stays as asked.
export const searchKey = (params) =>
  `search:${(params.get('q') ?? '').trim().toLowerCase().slice(0, 200)}|${params.get('n') ?? ''}`

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  // no list configured: any site may read (development); with a list, only those origins
  const allow = !allowed.length || allowed.includes(origin) ? origin || '*' : allowed[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'GET') return new Response('method not allowed', { status: 405, headers: cors })

    const url = new URL(request.url)
    const kv = url.pathname === '/search' ? env.IMAGE_CACHE : null
    const key = kv && searchKey(url.searchParams)
    if (kv) {
      const hit = await kv.get(key).catch(() => null) // a KV hiccup is just a miss
      if (hit) {
        const headers = { ...JSON_HEADERS, ...cors, 'Cache-Control': `public, max-age=${DAY}`, 'X-Greywords-Cache': 'hit' }
        return new Response(hit, { status: 200, headers })
      }
    }

    const result = await handle(url.pathname, url.searchParams, { key: env.UNSPLASH_ACCESS_KEY })
    const body = JSON.stringify(result.body)
    const headers = { ...JSON_HEADERS, ...cors }
    if (result.cacheSeconds) headers['Cache-Control'] = `public, max-age=${result.cacheSeconds}`
    if (kv) headers['X-Greywords-Cache'] = 'miss'
    // only answers marked cacheable (real results; never errors or "limited") are kept
    if (kv && result.cacheSeconds) ctx.waitUntil(kv.put(key, body, { expirationTtl: result.cacheSeconds }).catch(() => {}))
    return new Response(body, { status: result.status, headers })
  },
}
