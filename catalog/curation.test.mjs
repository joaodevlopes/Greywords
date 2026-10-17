import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyCuration, durationFromTranscript, formatDuration, parseDuration, slugFromTedUrl, tedSearchUrl } from './curation.mjs'

const words = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')
const data = {
  niches: [{ id: 'tech', label: 'Tecnologia' }],
  talks: [
    { tedSlug: 'a_talk', title: 'A', speaker: 'X', youtubeId: 'aaaaaaaaaaa', niches: ['tech'] },
    { tedSlug: 'b_talk', title: 'B', speaker: 'Y', youtubeId: 'bbbbbbbbbbb', niches: ['tech'] },
  ],
}

describe('curation helpers (spec 002, T4)', () => {
  it('reads the slug from a pasted TED link, with or without /transcript and query', () => {
    assert.equal(slugFromTedUrl('https://www.ted.com/talks/pico_iyer_where_is_home'), 'pico_iyer_where_is_home')
    assert.equal(slugFromTedUrl(' https://www.ted.com/talks/pico_iyer_where_is_home/transcript?language=en '), 'pico_iyer_where_is_home')
    assert.equal(slugFromTedUrl('https://www.youtube.com/watch?v=x'), null)
    assert.equal(tedSearchUrl("We're not ready"), 'https://www.ted.com/search?q=We\'re%20not%20ready')
  })

  it('suggests the duration from the last timestamp of the transcript', () => {
    assert.equal(durationFromTranscript('00:12\nHello there.\n03:45\nMore words.\n18:59\nThank you.'), 1139)
    assert.equal(durationFromTranscript('0:05 hi 1:02:03 bye'), 3723)
    assert.equal(durationFromTranscript('no timestamps, only 3 numbers and 12:5'), null)
  })

  it('parses and formats durations', () => {
    assert.equal(parseDuration('19:11'), 1151)
    assert.equal(parseDuration('1:02:03'), 3723)
    assert.equal(parseDuration('1151'), 1151)
    assert.equal(parseDuration('19:75'), null)
    assert.equal(parseDuration(''), null)
    assert.equal(formatDuration(1151), '19:11')
    assert.equal(formatDuration(undefined), '')
  })

  it('saves the duration and fixes the slug from the TED link, without touching the other talks', () => {
    const r = applyCuration(data, { slug: 'a_talk', tedUrl: 'https://www.ted.com/talks/a_real_talk', durationSec: 600, text: words(150) })
    assert.equal(r.slug, 'a_real_talk')
    assert.equal(r.renamedFrom, 'a_talk')
    assert.deepEqual(r.data.talks[0], { ...data.talks[0], tedSlug: 'a_real_talk', durationSec: 600 })
    assert.equal(r.data.talks[1], data.talks[1])
    assert.equal(data.talks[0].tedSlug, 'a_talk') // not mutated
  })

  it('refuses unknown talks, bad links, repeated slugs, missing duration and short transcripts', () => {
    const ok = { slug: 'a_talk', durationSec: 600, text: words(150) }
    assert.match(applyCuration(data, { ...ok, slug: 'nope' }).error, /desconhecido/)
    assert.match(applyCuration(data, { ...ok, tedUrl: 'https://example.com' }).error, /link do TED/)
    assert.match(applyCuration(data, { ...ok, tedUrl: 'https://www.ted.com/talks/b_talk' }).error, /já usa/)
    assert.match(applyCuration(data, { ...ok, durationSec: 0 }).error, /duração/)
    assert.match(applyCuration(data, { ...ok, text: words(20) }).error, /curta/)
    assert.equal(applyCuration(data, ok).renamedFrom, null)
  })
})
