import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Minimal stand-ins for the Cloudflare runtime: an edge cache and ctx.waitUntil.
const store = new Map()
globalThis.caches = {
  default: {
    match: async (req) => store.get(req.url)?.clone(),
    put: async (req, res) => {
      store.set(req.url, res)
    },
  },
}
const { default: worker } = await import('./index.js')

const realFetch = globalThis.fetch
let unsplashCalls = 0
const ctx = { waitUntil: (p) => p }
const env = { UNSPLASH_ACCESS_KEY: 'k', ALLOWED_ORIGINS: '' }
const get = (path, origin = 'https://greywords.example') =>
  worker.fetch(new Request(`https://images.example${path}`, { headers: { Origin: origin } }), env, ctx)

beforeEach(() => {
  store.clear()
  unsplashCalls = 0
  globalThis.fetch = async () => {
    unsplashCalls++
    const photo = { id: 'abcdef1', urls: { small: 's' }, user: { name: 'A', links: { html: 'h' } }, links: { html: 'l' } }
    return new Response(JSON.stringify({ results: [photo] }), { status: 200 })
  }
})
afterEach(() => {
  globalThis.fetch = realFetch
})

describe('worker (spec 003, T7a)', () => {
  it('answers /search with CORS and caches it, so the same word costs one Unsplash call', async () => {
    const first = await get('/search?q=study')
    assert.equal(first.status, 200)
    assert.equal(first.headers.get('Access-Control-Allow-Origin'), 'https://greywords.example')
    assert.equal((await first.json()).images[0].id, 'us:abcdef1')
    await new Promise((r) => setTimeout(r, 0))
    const second = await get('/search?q=study')
    assert.equal((await second.json()).images.length, 1)
    assert.equal(unsplashCalls, 1)
  })

  it('answers the CORS preflight and refuses other methods', async () => {
    const pre = await worker.fetch(new Request('https://images.example/search', { method: 'OPTIONS' }), env, ctx)
    assert.equal(pre.status, 204)
    const post = await worker.fetch(new Request('https://images.example/search', { method: 'POST' }), env, ctx)
    assert.equal(post.status, 405)
  })

  it('with ALLOWED_ORIGINS set, does not echo other sites', async () => {
    const res = await worker.fetch(
      new Request('https://images.example/search?q=sun', { headers: { Origin: 'https://evil.example' } }),
      { ...env, ALLOWED_ORIGINS: 'https://greywords.example' },
      ctx,
    )
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://greywords.example')
  })
})
