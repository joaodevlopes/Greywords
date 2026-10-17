import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readTranscripts, validateSources, verifyYoutube } from './sources.mjs'

const NICHES = [
  { id: 'science', label: 'Ciência' },
  { id: 'tech', label: 'Tecnologia' },
]
const talk = (over = {}) => ({
  tedSlug: 'example_speaker_example_title',
  title: 'An example talk',
  speaker: 'Example Speaker',
  durationSec: 600,
  youtubeId: 'abcdefghijk',
  niches: ['science'],
  ...over,
})
// Synthetic text (not a real transcript): enough words to pass the minimum.
const longText = 'We look at the stars and we ask new questions every night. '.repeat(12)

describe('validateSources', () => {
  it('accepts two complete talks', () => {
    const r = validateSources({ niches: NICHES, talks: [talk(), talk({ tedSlug: 'second_talk', niches: ['tech', 'science'] })] })
    assert.deepEqual(r.errors, [])
    assert.equal(r.talks.length, 2)
  })

  it('explains every missing or malformed field', () => {
    const { errors } = validateSources({
      niches: NICHES,
      talks: [{ tedSlug: 'Bad Slug!', durationSec: '19:11', youtubeId: 'short', niches: ['cooking'] }],
    })
    const text = errors.join('\n')
    for (const bit of ['"tedSlug"', 'falta "title"', 'falta "speaker"', '"durationSec"', '"youtubeId"', 'nicho desconhecido "cooking"']) {
      assert.ok(text.includes(bit), `expected an error mentioning ${bit}`)
    }
  })

  it('flags duplicated talks and niches', () => {
    const { errors } = validateSources({ niches: [...NICHES, NICHES[0]], talks: [talk(), talk()] })
    assert.ok(errors.some((e) => e.includes('nicho repetido')))
    assert.ok(errors.some((e) => e.includes('repetido') && e.includes('talk 2')))
  })

  it('requires the top-level lists', () => {
    assert.ok(validateSources({}).errors.length >= 2)
  })
})

describe('readTranscripts', () => {
  const files = { 'dir/ok_talk.txt': longText, 'dir/short_talk.txt': '(Applause) Thank you.' }
  const read = async (path) => {
    const key = path.replace(/\\/g, '/')
    if (!(key in files)) throw new Error('ENOENT')
    return files[key]
  }

  it('reads present files and reports missing or too-short ones', async () => {
    const talks = [talk({ tedSlug: 'ok_talk' }), talk({ tedSlug: 'short_talk' }), talk({ tedSlug: 'missing_talk' })]
    const { texts, errors } = await readTranscripts(talks, 'dir', read)
    assert.deepEqual([...texts.keys()], ['ok_talk'])
    assert.ok(errors.some((e) => e.startsWith('short_talk') && e.includes('muito curta')))
    assert.ok(errors.some((e) => e.startsWith('missing_talk') && e.includes('faltando')))
  })
})

describe('verifyYoutube', () => {
  const fakeFetch = (status, body, calls) => async (url) => {
    calls?.push(url)
    return { ok: status === 200, status, json: async () => body }
  }

  it('accepts a video from the official TED channel, asking only YouTube', async () => {
    const calls = []
    const r = await verifyYoutube('iG9CE55wbtY', fakeFetch(200, { author_name: 'TED' }, calls))
    assert.deepEqual(r, { ok: true, author: 'TED' })
    assert.equal(calls.length, 1)
    assert.equal(new URL(calls[0]).hostname, 'www.youtube.com')
    assert.ok(!calls[0].includes('ted.com/'))
  })

  it('rejects other channels (TEDx, TED-Ed, anyone else)', async () => {
    const r = await verifyYoutube('abcdefghijk', fakeFetch(200, { author_name: 'TEDx Talks' }))
    assert.equal(r.ok, false)
    assert.match(r.error, /TEDx Talks/)
  })

  it('reports missing videos and network failures', async () => {
    assert.match((await verifyYoutube('abcdefghijk', fakeFetch(404, {}))).error, /HTTP 404/)
    const down = async () => {
      throw new Error('offline')
    }
    assert.match((await verifyYoutube('abcdefghijk', down)).error, /sem resposta/)
  })
})
