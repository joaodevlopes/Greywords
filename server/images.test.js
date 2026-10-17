import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { handle, isPhotoId, searchUrl, trimPhoto, withUtm } from './images.js'

const photo = (id) => ({
  id,
  urls: { small: `https://images.unsplash.com/${id}?w=400`, regular: `https://images.unsplash.com/${id}?w=1080` },
  alt_description: `photo ${id}`,
  user: { name: 'Ana Lima', links: { html: 'https://unsplash.com/@ana' } },
  links: { html: `https://unsplash.com/photos/${id}` },
})
const respond = (status, body) => async () => new Response(JSON.stringify(body), { status })
const params = (q) => new URLSearchParams(q)

describe('server/images: building blocks', () => {
  it('adds the Unsplash referral parameters', () => {
    assert.equal(withUtm('https://unsplash.com/@ana'), 'https://unsplash.com/@ana?utm_source=greywords&utm_medium=referral')
    assert.equal(withUtm('https://x.com/?a=1'), 'https://x.com/?a=1&utm_source=greywords&utm_medium=referral')
    assert.equal(withUtm(undefined), '')
  })

  it('searches with the safest content filter and at most 12 photos', () => {
    const u = new URL(searchUrl('person studying', 50))
    assert.equal(u.searchParams.get('query'), 'person studying')
    assert.equal(u.searchParams.get('content_filter'), 'high')
    assert.equal(u.searchParams.get('per_page'), '12')
    assert.equal(new URL(searchUrl('sun', 'x')).searchParams.get('per_page'), '12')
    assert.equal(new URL(searchUrl('sun', 3)).searchParams.get('per_page'), '3')
  })

  it('trims a photo to what the app stores, with credit links', () => {
    const img = trimPhoto(photo('abc123XYZ'), 'study')
    assert.deepEqual(img, {
      id: 'us:abc123XYZ',
      thumb: 'https://images.unsplash.com/abc123XYZ?w=400',
      title: 'photo abc123XYZ',
      credit: 'Ana Lima',
      creditLink: 'https://unsplash.com/@ana?utm_source=greywords&utm_medium=referral',
      link: 'https://unsplash.com/photos/abc123XYZ?utm_source=greywords&utm_medium=referral',
      source: 'unsplash',
    })
  })

  it('accepts only url-safe photo ids', () => {
    assert.equal(isPhotoId('Hcfwew744z4'), true)
    assert.equal(isPhotoId('../../me'), false)
    assert.equal(isPhotoId('a'), false)
  })
})

describe('server/images: handle()', () => {
  it('refuses to work without the key', async () => {
    const r = await handle('/search', params('q=sun'), { key: '' })
    assert.equal(r.status, 503)
  })

  it('/search sends the key in the header and returns trimmed photos, cacheable for a day', async () => {
    let seen
    const fetchImpl = async (url, opts) => {
      seen = { url, auth: opts.headers.Authorization }
      return new Response(JSON.stringify({ results: [photo('aaaaaa1'), { id: 'bad' }, photo('bbbbbb2')] }), { status: 200 })
    }
    const r = await handle('/search', params('q=study&n=9'), { key: 'k123', fetchImpl })
    assert.equal(r.status, 200)
    assert.equal(seen.auth, 'Client-ID k123')
    assert.ok(!seen.url.includes('k123'), 'the key never goes in the URL')
    assert.deepEqual(r.body.images.map((i) => i.id), ['us:aaaaaa1', 'us:bbbbbb2'])
    assert.equal(r.body.limited, false)
    assert.equal(r.cacheSeconds, 86400)
  })

  it('/search turns a 429 into limited, so the app falls back quietly', async () => {
    const r = await handle('/search', params('q=study'), { key: 'k', fetchImpl: respond(429, {}) })
    assert.deepEqual(r, { status: 200, body: { images: [], limited: true }, cacheSeconds: 0 })
  })

  it('/search also treats the Unsplash 403 "Rate Limit Exceeded" as limited', async () => {
    const fetchImpl = async () => new Response('Rate Limit Exceeded', { status: 403, headers: { 'X-Ratelimit-Remaining': '0' } })
    const r = await handle('/search', params('q=bat'), { key: 'k', fetchImpl })
    assert.deepEqual(r.body, { images: [], limited: true })
    const forbidden = async () => new Response('nope', { status: 403, headers: { 'X-Ratelimit-Remaining': '42' } })
    assert.equal((await handle('/search', params('q=bat'), { key: 'k', fetchImpl: forbidden })).status, 502)
  })

  it('/search reports other failures as 502 and never caches them', async () => {
    const down = await handle('/search', params('q=study'), { key: 'k', fetchImpl: respond(500, {}) })
    assert.equal(down.status, 502)
    assert.equal(down.cacheSeconds, 0)
    const offline = await handle('/search', params('q=study'), {
      key: 'k',
      fetchImpl: async () => {
        throw new TypeError('fetch failed')
      },
    })
    assert.equal(offline.status, 502)
  })

  it('/search needs a query', async () => {
    const r = await handle('/search', params('q=%20'), { key: 'k', fetchImpl: respond(200, { results: [] }) })
    assert.equal(r.status, 400)
  })

  it('/download validates the id and calls the Unsplash download endpoint', async () => {
    let seen
    const fetchImpl = async (url) => {
      seen = url
      return new Response('{}', { status: 200 })
    }
    assert.equal((await handle('/download', params('id=../x'), { key: 'k', fetchImpl })).status, 400)
    const r = await handle('/download', params('id=Hcfwew744z4'), { key: 'k', fetchImpl })
    assert.equal(r.status, 200)
    assert.equal(seen, 'https://api.unsplash.com/photos/Hcfwew744z4/download')
  })

  it('unknown paths are 404', async () => {
    assert.equal((await handle('/other', params(''), { key: 'k' })).status, 404)
  })
})
