// Production image intermediary (spec 003, R1.5): a Cloudflare Worker around server/images.js.
// The Unsplash key is a Worker secret (npx wrangler secret put UNSPLASH_ACCESS_KEY), never in the site.
// Routes: GET /search?q=&n=  and  GET /download?id=  (the app calls them at VITE_IMAGES_API).
// Searches are cached at the edge for a day, so repeated words do not spend the Unsplash quota.
import { handle } from '../server/images.js'

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') ?? ''
  const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean)
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
    const cache = caches.default
    const cacheKey = new Request(url.toString(), { method: 'GET' })
    if (url.pathname === '/search') {
      const hit = await cache.match(cacheKey)
      if (hit) {
        const res = new Response(hit.body, hit)
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v)
        return res
      }
    }

    const result = await handle(url.pathname, url.searchParams, { key: env.UNSPLASH_ACCESS_KEY })
    const headers = { 'content-type': 'application/json', ...cors }
    if (result.cacheSeconds) headers['Cache-Control'] = `public, max-age=${result.cacheSeconds}`
    const response = new Response(JSON.stringify(result.body), { status: result.status, headers })
    if (result.cacheSeconds) ctx.waitUntil(cache.put(cacheKey, response.clone()))
    return response
  },
}
