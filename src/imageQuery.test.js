import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildQueries,
  definitionWords,
  imageCredit,
  isAbstract,
  mainClass,
  mergeRefined,
  primaryPos,
  refineSuggestions,
  toGerund,
} from './imageQuery.js'

// Definitions shaped like src/api.js returns them (texts from dictionaryapi.dev / Wiktionary style).
const def = (...meanings) => ({ phonetic: '', audio: '', meanings: meanings.map(([pos, definition]) => ({ pos, definition, example: '' })) })
const SUN = def(['noun', 'The star that is closest to the Earth.'], ['verb', 'To expose to the heat of the sun.'])
const STUDY_VERB = def(['verb', 'To review materials already learned in order to make sure one does not forget them.'])
const STUDY_NOUN_FIRST = def(['noun', 'Mental effort to acquire knowledge or learning.'], ['verb', 'To acquire knowledge on a subject.'])
const STUBBORN = def(['adjective', 'Refusing to move or to change one’s opinion; obstinate.'])
const STUBBORN_EMPTY = def(['adjective', 'Very much so.'])
const WHISPER = def(['noun', 'The act of speaking in a quiet voice.'], ['verb', 'To talk softly.'])
const HOWEVER = def(['adverb', 'Nevertheless; yet; in spite of that.'])
const ALTHOUGH = def(['conjunction', 'Despite the fact that.'])

describe('toGerund', () => {
  it('handles regular and spelling-change verbs', () => {
    const cases = { study: 'studying', make: 'making', run: 'running', die: 'dying', see: 'seeing', visit: 'visiting' }
    for (const [verb, gerund] of Object.entries(cases)) assert.equal(toGerund(verb), gerund, verb)
  })

  it('doubles only one-syllable consonant-vowel-consonant verbs', () => {
    assert.equal(toGerund('swim'), 'swimming')
    assert.equal(toGerund('cook'), 'cooking')
    assert.equal(toGerund('climb'), 'climbing')
    assert.equal(toGerund('whisper'), 'whispering')
    assert.equal(toGerund('fix'), 'fixing')
    assert.equal(toGerund('be'), 'being')
  })
})

describe('definitionWords', () => {
  it('prefers the nouns after an article: sun → star, earth', () => {
    assert.deepEqual(definitionWords(SUN, 'sun'), ['star', 'earth'])
  })

  it('skips grammar words, -ly words and the word itself', () => {
    assert.deepEqual(definitionWords(STUDY_VERB, 'study'), ['review', 'materials'])
    assert.deepEqual(definitionWords(STUDY_NOUN_FIRST, 'study'), ['mental', 'effort'])
  })

  it('returns nothing without a definition', () => {
    assert.deepEqual(definitionWords(null, 'sun'), [])
  })
})

describe('primaryPos / mainClass / isAbstract', () => {
  it('uses the first meaning; a noun describing an action counts as a verb', () => {
    assert.equal(primaryPos(STUDY_NOUN_FIRST), 'noun')
    assert.equal(mainClass(STUDY_NOUN_FIRST), 'noun')
    assert.equal(mainClass(SUN), 'noun') // a minor verb sense listed second does not count
    assert.equal(mainClass(WHISPER), 'verb')
    assert.equal(mainClass(STUDY_VERB), 'verb')
    assert.equal(mainClass(STUBBORN), 'adjective')
    assert.equal(mainClass(def(['noun', 'A large stream of water.'])), 'noun')
  })

  it('flags linking adverbs and grammar classes as abstract', () => {
    assert.equal(isAbstract(HOWEVER, 'however'), true)
    assert.equal(isAbstract(ALTHOUGH, 'although'), true)
    assert.equal(isAbstract(null, 'therefore'), true)
    assert.equal(isAbstract(SUN, 'sun'), false)
  })
})

describe('buildQueries', () => {
  it('builds the three variants for a verb', () => {
    assert.deepEqual(buildQueries('study', STUDY_VERB, 'class'), ['person studying', 'study'])
    assert.deepEqual(buildQueries('study', STUDY_VERB, 'definition'), ['study review materials', 'study'])
    assert.deepEqual(buildQueries('study', STUDY_VERB, 'both'), ['person studying review', 'study'])
  })

  it('turns an action noun into the action: whisper → person whispering', () => {
    assert.deepEqual(buildQueries('whisper', WHISPER, 'class'), ['person whispering', 'whisper'])
  })

  it('never turns a noun with a minor verb sense into an action', () => {
    assert.deepEqual(buildQueries('sun', SUN, 'both'), ['sun star', 'sun'])
  })

  it('uses the definition for nouns and adjectives', () => {
    const river = def(['noun', 'A large stream of water.'])
    assert.deepEqual(buildQueries('river', river, 'both'), ['river large', 'river'])
    assert.deepEqual(buildQueries('river', river, 'class'), ['river'])
    assert.deepEqual(buildQueries('stubborn', STUBBORN, 'both'), ['stubborn refusing', 'stubborn'])
    assert.deepEqual(buildQueries('stubborn', STUBBORN_EMPTY, 'both'), ['stubborn person', 'stubborn'])
    assert.deepEqual(buildQueries('stubborn', STUBBORN, 'class'), ['stubborn person', 'stubborn'])
  })

  it('falls back to the bare word for abstract words or no definition', () => {
    assert.deepEqual(buildQueries('however', HOWEVER), ['however'])
    assert.deepEqual(buildQueries('Sun', null), ['sun'])
  })

  it('rejects unknown variants', () => {
    assert.throws(() => buildQueries('sun', SUN, 'magic'), RangeError)
  })
})

describe('refineSuggestions', () => {
  it('offers 2 to 4 distinct suggestions, never the bare word', () => {
    const study = refineSuggestions('study', STUDY_VERB)
    assert.deepEqual(study.slice(0, 2), ['person studying', 'people studying'])
    assert.ok(study.length >= 2 && study.length <= 4)
    assert.ok(!study.includes('study'))
    const river = refineSuggestions('river', def(['noun', 'A large stream of water.']))
    assert.ok(river.length >= 2 && new Set(river).size === river.length)
  })
})

describe('mergeRefined (spec 003, R3.2–R3.3)', () => {
  const img = (id) => ({ id })
  it('keeps the chosen images first, in chosen order, then the new ones without repeats', () => {
    const current = [img('a'), img('b'), img('c'), img('d')]
    const merged = mergeRefined(current, ['c', 'a'], [img('x'), img('a'), img('y')])
    assert.deepEqual(merged.map((i) => i.id), ['c', 'a', 'x', 'y'])
  })
  it('returns just the new results when nothing is chosen', () => {
    assert.deepEqual(mergeRefined([img('a')], [], [img('x')]).map((i) => i.id), ['x'])
  })
})

describe('inflection-only senses (Wiktionary lists them first)', () => {
  const tired = def(['verb', 'simple past and past participle of tire'], ['adjective', 'In need of some rest or sleep.'])
  it('do not decide the class: "tired" is an adjective, not "person tireding"', () => {
    assert.equal(primaryPos(tired), 'adjective')
    assert.equal(mainClass(tired), 'adjective')
    assert.ok(!buildQueries('tired', tired, 'class').some((q) => q.includes('tireding')))
  })
  it('do not give context words', () => {
    assert.ok(!definitionWords(tired, 'tired').includes('past'))
  })
  it('still count when they are all there is', () => {
    assert.equal(primaryPos(def(['verb', 'simple past of go'])), 'verb')
  })
})

describe('imageCredit (spec 003, R1.6)', () => {
  it('names the photographer and Unsplash for Unsplash photos', () => {
    assert.equal(imageCredit({ source: 'unsplash', credit: 'Ana Lima', title: 'desk' }), 'Foto de Ana Lima no Unsplash')
  })
  it('keeps title and author for the other sources', () => {
    assert.equal(imageCredit({ source: 'openverse', title: 'River', credit: 'Bob' }), 'River — Bob')
    assert.equal(imageCredit({ title: 'Old image' }), 'Old image')
  })
})
