import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fetchExamples } from './api.js'

// Fake Tatoeba: the handler gets the URL and returns { data } (or throws / an HTTP error).
const realFetch = globalThis.fetch
const calls = []
const tatoeba = (handler) => {
  globalThis.fetch = async (url) => {
    const u = new URL(url)
    calls.push(u)
    return handler(u)
  }
}
const json = (body, status = 200) => new Response(JSON.stringify(body), { status })
const sentence = (id, text, pt) => ({
  id,
  text,
  lang: 'eng',
  license: 'CC BY 2.0 FR',
  owner: 'ana',
  is_unapproved: false,
  translations: pt ? [{ id: id + 1000, text: pt, lang: 'por', is_unapproved: false, is_direct: true }] : [],
})

afterEach(() => {
  globalThis.fetch = realFetch
  calls.length = 0
})

describe('fetchExamples (spec 004, T2)', () => {
  it('returns sentences in the app shape, Portuguese translation first, from one call when enough', async () => {
    tatoeba(() =>
      json({
        data: [1, 2, 3, 4, 5].map((i) => sentence(i, `I like to cook dinner number ${i}.`, `Eu gosto de cozinhar o jantar ${i}.`)),
      }),
    )
    const list = await fetchExamples('cook')
    assert.equal(calls.length, 1)
    assert.equal(calls[0].searchParams.get('trans:lang'), 'por')
    assert.equal(calls[0].searchParams.get('showtrans'), 'matching')
    assert.equal(calls[0].searchParams.get('q'), 'cook')
    assert.equal(list.length, 5)
    assert.deepEqual(list[0], {
      id: 1,
      text: 'I like to cook dinner number 1.',
      translation: 'Eu gosto de cozinhar o jantar 1.',
      owner: 'ana',
      license: 'CC BY 2.0 FR',
      link: 'https://tatoeba.org/en/sentences/show/1',
    })
  })

  it('makes a second call, without translations, only when fewer than 5 good sentences came back', async () => {
    tatoeba((u) =>
      u.searchParams.get('showtrans') === 'matching'
        ? json({ data: [sentence(1, 'They climb the hill together.', 'Eles sobem o morro juntos.')] })
        : json({ data: [sentence(2, 'We climb every weekend.'), sentence(3, 'Cats climb trees easily.')] }),
    )
    const list = await fetchExamples('climb')
    assert.equal(calls.length, 2)
    assert.equal(calls[1].searchParams.get('showtrans'), 'none')
    assert.equal(calls[1].searchParams.has('trans:lang'), false)
    assert.deepEqual(list.map((s) => s.id), [1, 2, 3]) // same length in words: the shorter text first
  })

  it('searches the exact word for grammar words', async () => {
    tatoeba(() => json({ data: [] }))
    await fetchExamples('although', { exact: true })
    assert.equal(calls[0].searchParams.get('q'), '=although')
  })

  it('returns [] without throwing when Tatoeba fails, and does not cache the failure', async () => {
    tatoeba(() => json({}, 500))
    assert.deepEqual(await fetchExamples('swim'), [])
    tatoeba(() => json({ data: [sentence(9, 'Fish swim in the river.', 'Peixes nadam no rio.')] }))
    assert.equal((await fetchExamples('swim')).length, 1)
  })

  it('caches answers for the session: the same word does not call again', async () => {
    tatoeba(() => json({ data: [sentence(1, 'The bridge is very old.', 'A ponte é muito velha.')] }))
    await fetchExamples('bridge')
    const n = calls.length
    await fetchExamples('bridge')
    assert.equal(calls.length, n)
  })

  it('uses only approved Portuguese translations, preferring direct ones', async () => {
    const s = sentence(1, 'I need a warm blanket tonight.')
    s.translations = [
      { id: 7, text: 'tradução não aprovada', lang: 'por', is_unapproved: true, is_direct: true },
      { id: 8, text: 'Preciso de um cobertor quente hoje.', lang: 'por', is_unapproved: false, is_direct: false },
    ]
    tatoeba(() => json({ data: [s] }))
    const [first] = await fetchExamples('blanket')
    assert.equal(first.translation, 'Preciso de um cobertor quente hoje.')
  })
})

// Early warning if the "unstable" API changes shape. Needs network and Tatoeba can take 10 s+, so it
// only runs when asked: LIVE_APIS=1 npm test
describe('fetchExamples against the real Tatoeba API', () => {
  it('"however" brings sentences in the expected shape', async (t) => {
    if (!process.env.LIVE_APIS) return t.skip('set LIVE_APIS=1 to call the real API')
    let list
    try {
      list = await fetchExamples('however', { exact: true })
    } catch {
      return t.skip('network unavailable')
    }
    if (!list.length) return t.skip('no answer from Tatoeba (offline or down)')
    for (const s of list) {
      assert.equal(typeof s.id, 'number')
      assert.match(s.text, /however/i)
      assert.match(s.link, /^https:\/\/tatoeba\.org\/en\/sentences\/show\/\d+$/)
    }
    assert.ok(list.some((s) => s.translation), 'at least one Portuguese translation')
  })
})
