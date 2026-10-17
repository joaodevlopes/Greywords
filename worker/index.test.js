import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import worker, { searchKey } from './index.js'

// Stand-ins for the Cloudflare runtime: a Workers KV namespace (get / put with expirationTtl) and ctx.waitUntil.
const kvStore = new Map()
const kvPuts = []
const kv = {
  get: async (key) => kvStore.get(key) ?? null,
  put: async (key, value, opts) => {
    kvPuts.push({ key, ttl: opts?.expirationTtl })
    kvStore.set(key, value)
  },
}
const pending = []
const ctx = { waitUntil: (p) => pending.push(p) }
const settle = () => Promise.all(pending.splice(0))

const realFetch = globalThis.fetch
let unsplashCalls = 0
let unsplashStatus = 200
const env = { UNSPLASH_ACCESS_KEY: 'k', ALLOWED_ORIGINS: '', IMAGE_CACHE: kv }
const get = (path, { origin = 'https://greywords.example', envOver = {} } = {}) =>
  worker.fetch(new Request(`https://images.example${path}`, { headers: { Origin: origin } }), { ...env, ...envOver }, ctx)

beforeEach(() => {
  kvStore.clear()
  kvPuts.length = 0
  unsplashCalls = 0
  unsplashStatus = 200
  globalThis.fetch = async () => {
    unsplashCalls++
    if (unsplashStatus !== 200) return new Response('{}', { status: unsplashStatus })
    const photo = { id: 'abcdef1', urls: { small: 's' }, user: { name: 'A', links: { html: 'h' } }, links: { html: 'l' } }
    return new Response(JSON.stringify({ results: [photo] }), { status: 200 })
  }
})
afterEach(() => {
  globalThis.fetch = realFetch
})

describe('worker (spec 003, T7a)', () => {
  it('answers /search with CORS', async () => {
    const res = await get('/search?q=study')
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://greywords.example')
    assert.equal((await res.json()).images[0].id, 'us:abcdef1')
  })

  it('answers the CORS preflight and refuses other methods', async () => {
    const pre = await worker.fetch(new Request('https://images.example/search', { method: 'OPTIONS' }), env, ctx)
    assert.equal(pre.status, 204)
    const post = await worker.fetch(new Request('https://images.example/search', { method: 'POST' }), env, ctx)
    assert.equal(post.status, 405)
  })

  it('with ALLOWED_ORIGINS set, does not echo other sites', async () => {
    const res = await get('/search?q=sun', { origin: 'https://evil.example', envOver: { ALLOWED_ORIGINS: 'https://greywords.example' } })
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://greywords.example')
  })
})

describe('worker search cache in Workers KV', () => {
  it('keeps a search for a day: the same word costs one Unsplash call, the second answer is a hit', async () => {
    const first = await get('/search?q=study&n=12')
    assert.equal(first.headers.get('X-Greywords-Cache'), 'miss')
    await settle()
    assert.deepEqual(kvPuts, [{ key: 'search:study|12', ttl: 86400 }])

    const second = await get('/search?q=study&n=12', { origin: 'https://other.example' })
    assert.equal(second.headers.get('X-Greywords-Cache'), 'hit')
    assert.equal(second.headers.get('Access-Control-Allow-Origin'), 'https://other.example') // CORS is per request, not cached
    assert.equal((await second.json()).images[0].id, 'us:abcdef1')
    assert.equal(unsplashCalls, 1)
  })

  it('treats "Study " and "study" as the same search, and a different n as another one', async () => {
    assert.equal(searchKey(new URLSearchParams('q=Study%20&n=12')), searchKey(new URLSearchParams('q=study&n=12')))
    assert.notEqual(searchKey(new URLSearchParams('q=study&n=3')), searchKey(new URLSearchParams('q=study&n=12')))
  })

  it('never keeps errors or a "limited" answer', async () => {
    unsplashStatus = 500
    assert.equal((await get('/search?q=sun')).status, 502)
    unsplashStatus = 429
    assert.equal((await get('/search?q=moon')).status, 200)
    await settle()
    assert.equal(kvPuts.length, 0)
  })

  it('works without the KV binding (calls Unsplash every time) and when KV fails', async () => {
    await get('/search?q=river', { envOver: { IMAGE_CACHE: undefined } })
    await get('/search?q=river', { envOver: { IMAGE_CACHE: undefined } })
    assert.equal(unsplashCalls, 2)
    const broken = { get: async () => Promise.reject(new Error('kv down')), put: async () => Promise.reject(new Error('kv down')) }
    const res = await get('/search?q=lake', { envOver: { IMAGE_CACHE: broken } })
    await settle()
    assert.equal(res.status, 200)
  })

  it('does not cache /download', async () => {
    await get('/download?id=us:abcdef1')
    await settle()
    assert.equal(kvPuts.length, 0)
  })
})
