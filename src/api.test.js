import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fetchDefinition, fetchImagesFor, orTimeout, trackImageUse } from './api.js'

// Fake fetch: routes by host; each handler gets the URL and returns a Response or throws.
const realFetch = globalThis.fetch
const calls = []
function mockFetch({ openverse, wikimedia }) {
  globalThis.fetch = async (url) => {
    const u = new URL(url)
    calls.push(u)
    const handler = u.host === 'api.openverse.org' ? openverse : wikimedia
    return handler(u)
  }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const ov = (...ids) => json({ results: ids.map((id) => ({ id, thumbnail: `https://img/${id}.jpg`, title: id, creator: 'a', foreign_landing_url: `https://ov/${id}` })) })
const wm = (...ids) =>
  json({ query: { pages: Object.fromEntries(ids.map((id, i) => [id, { pageid: id, index: i, title: `File:${id}.jpg`, imageinfo: [{ thumburl: `https://wm/${id}.jpg`, descriptionurl: `https://wm/p/${id}` }] }])) } })
const timeout = () => {
  throw new DOMException('The operation timed out.', 'TimeoutError')
}

afterEach(() => {
  globalThis.fetch = realFetch
  calls.length = 0
})

describe('fetchImagesFor (spec 003, T3)', () => {
  it('asks Openverse for photographs only, with the adult filter, at most 2 queries', async () => {
    mockFetch({ openverse: () => ov('a'), wikimedia: () => wm() })
    await fetchImagesFor(['person studying', 'study', 'extra', 'study'])
    assert.equal(calls.length, 2)
    for (const u of calls) {
      assert.equal(u.searchParams.get('category'), 'photograph')
      assert.equal(u.searchParams.get('mature'), 'false')
    }
    assert.deepEqual(calls.map((u) => u.searchParams.get('q')), ['person studying', 'study'])
  })

  it('merges without repeats, context query first, up to n', async () => {
    mockFetch({
      openverse: (u) => (u.searchParams.get('q') === 'person studying' ? ov('c1', 'c2', 'shared') : ov('shared', 'w1', 'w2')),
      wikimedia: () => wm('never'),
    })
    const r = await fetchImagesFor(['person studying', 'study'], 4)
    assert.deepEqual(r.images.map((i) => i.id), ['ov:c1', 'ov:c2', 'ov:shared', 'ov:w1'])
    assert.equal(r.source, 'openverse')
    assert.equal(r.limited, false)
    assert.equal(calls.some((u) => u.host !== 'api.openverse.org'), false)
  })

  it('uses Wikimedia, with the word alone, only when every Openverse query fails', async () => {
    mockFetch({ openverse: () => json({}, 500), wikimedia: () => wm('m1', 'm2') })
    const r = await fetchImagesFor(['person studying', 'study'])
    assert.deepEqual(r.images.map((i) => i.id), ['wm:m1', 'wm:m2'])
    assert.equal(r.source, 'wikimedia')
    const wmCall = calls.find((u) => u.host === 'commons.wikimedia.org')
    assert.match(wmCall.searchParams.get('gsrsearch'), /^study /)
  })

  it('uses Wikimedia when Openverse answers but has no images', async () => {
    mockFetch({ openverse: () => ov(), wikimedia: () => wm('m1') })
    const r = await fetchImagesFor(['sun'])
    assert.equal(r.source, 'wikimedia')
    assert.equal(r.images.length, 1)
  })

  it('marks limited on 429 and keeps the images of the query that worked', async () => {
    mockFetch({
      openverse: (u) => (u.searchParams.get('q') === 'person studying' ? json({ detail: 'throttled' }, 429) : ov('w1')),
      wikimedia: () => wm('never'),
    })
    const r = await fetchImagesFor(['person studying', 'study'])
    assert.equal(r.limited, true)
    assert.equal(r.source, 'openverse')
    assert.deepEqual(r.images.map((i) => i.id), ['ov:w1'])
  })

  it('treats a timeout as a failure and falls back to Wikimedia', async () => {
    mockFetch({ openverse: timeout, wikimedia: () => wm('m1') })
    const r = await fetchImagesFor(['sun'])
    assert.equal(r.source, 'wikimedia')
    assert.equal(r.limited, false)
  })

  it('throws only when nothing could be fetched at all', async () => {
    mockFetch({ openverse: timeout, wikimedia: timeout })
    await assert.rejects(fetchImagesFor(['sun']))
  })

  it('returns an empty list (no error) when Openverse is empty and Wikimedia fails', async () => {
    mockFetch({ openverse: () => ov(), wikimedia: timeout })
    const r = await fetchImagesFor(['sun'])
    assert.deepEqual(r.images, [])
  })
})

describe('orTimeout (spec 003, D2: images wait up to 2 s for the definition)', () => {
  const later = (value, ms) => new Promise((r) => setTimeout(() => r(value), ms))
  it('returns the value when it arrives in time', async () => {
    assert.equal(await orTimeout(later('def', 10), 200), 'def')
  })
  it('returns the fallback when it is too slow', async () => {
    assert.equal(await orTimeout(later('def', 300), 30, null), null)
  })
  it('returns the fallback when the promise rejects', async () => {
    assert.equal(await orTimeout(Promise.reject(new Error('x')), 200, 'none'), 'none')
  })
})

describe('fetchDefinition: hedged request (spec 003, T4)', () => {
  const dictBody = json([{ phonetic: '/sʌn/', phonetics: [], meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'The star.' }] }] }])
  const wiktBody = () => json({ en: [{ language: 'English', partOfSpeech: 'Noun', definitions: [{ definition: 'A star.' }] }] })
  function route({ dict, wikt }) {
    globalThis.fetch = async (url) => {
      const u = new URL(url)
      calls.push(u)
      return u.host === 'api.dictionaryapi.dev' ? dict() : wikt()
    }
  }
  const delay = (ms, fn) => () => new Promise((r) => setTimeout(() => r(fn()), ms))

  it('uses dictionaryapi.dev when it answers quickly, without asking Wiktionary', async () => {
    route({ dict: () => dictBody.clone(), wikt: wiktBody })
    const d = await fetchDefinition('sun', 50)
    assert.equal(d.meanings[0].definition, 'The star.')
    assert.equal(d.phonetic, '/sʌn/')
    assert.equal(calls.some((u) => u.host === 'en.wiktionary.org'), false)
  })

  it('asks Wiktionary after the hedge time when dictionaryapi.dev is slow, and takes the first answer', async () => {
    route({ dict: delay(400, () => dictBody.clone()), wikt: wiktBody })
    const t0 = Date.now()
    const d = await fetchDefinition('sun', 30)
    assert.equal(d.meanings[0].definition, 'A star.')
    assert.ok(Date.now() - t0 < 300)
  })

  it('goes straight to Wiktionary when dictionaryapi.dev fails fast (404)', async () => {
    route({ dict: () => json({ title: 'No Definitions Found' }, 404), wikt: wiktBody })
    const d = await fetchDefinition('sun', 500)
    assert.equal(d.meanings[0].definition, 'A star.')
  })

  it('returns null when neither knows the word', async () => {
    route({ dict: delay(100, () => json({}, 404)), wikt: () => json({}, 404) })
    assert.equal(await fetchDefinition('zzqx', 20), null)
  })
})

describe('Unsplash through the intermediary (spec 003, T8a)', () => {
  const API = 'https://imgs.test'
  const us = (...ids) => ids.map((id) => ({ id: `us:${id}`, thumb: `https://images.unsplash.com/${id}`, title: id, credit: 'A', source: 'unsplash' }))
  function route({ images, openverse = () => ov('o1'), wikimedia = () => wm('m1') }) {
    globalThis.fetch = async (url) => {
      const u = new URL(url)
      calls.push(u)
      if (u.host === 'imgs.test') return images(u)
      return u.host === 'api.openverse.org' ? openverse(u) : wikimedia(u)
    }
  }

  it('uses Unsplash with one query, the word alone, and skips Openverse', async () => {
    route({ images: () => json({ images: us('a', 'b'), limited: false }) })
    const r = await fetchImagesFor(['person studying', 'study'], 9, { api: API })
    assert.equal(r.source, 'unsplash')
    assert.deepEqual(r.images.map((i) => i.id), ['us:a', 'us:b'])
    assert.equal(calls.length, 1)
    assert.equal(calls[0].pathname, '/search')
    assert.equal(calls[0].searchParams.get('q'), 'study')
    assert.equal(calls[0].searchParams.get('n'), '9')
  })

  it('falls back to Openverse, marked limited, when Unsplash is at its limit', async () => {
    route({ images: () => json({ images: [], limited: true }) })
    const r = await fetchImagesFor(['study'], 9, { api: API })
    assert.equal(r.source, 'openverse')
    assert.equal(r.limited, true)
  })

  it('falls back to Openverse quietly when the intermediary is down or finds nothing', async () => {
    route({ images: () => json({ error: 'x' }, 502) })
    const down = await fetchImagesFor(['study'], 9, { api: API })
    assert.equal(down.source, 'openverse')
    assert.equal(down.limited, false)
    route({ images: () => json({ images: [], limited: false }) })
    assert.equal((await fetchImagesFor(['study'], 9, { api: API })).source, 'openverse')
  })

  it('without an intermediary (no VITE_IMAGES_API) goes straight to Openverse', async () => {
    route({ images: () => json({ images: us('a') }) })
    const r = await fetchImagesFor(['study'], 9, { api: '' })
    assert.equal(r.source, 'openverse')
    assert.equal(calls.some((u) => u.host === 'imgs.test'), false)
  })

  it('trackImageUse notifies Unsplash once per Unsplash photo, and only when there is an intermediary', async () => {
    route({ images: () => json({ ok: true }) })
    const sent = trackImageUse([...us('a', 'b'), { id: 'ov:1', source: 'openverse' }], { api: API })
    await new Promise((r) => setTimeout(r, 0))
    assert.equal(sent, 2)
    assert.deepEqual(calls.map((u) => u.pathname + u.search), ['/download?id=a', '/download?id=b'])
    assert.equal(trackImageUse(us('a'), { api: '' }), 0)
  })
})
