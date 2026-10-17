import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import {
  analyzeTranscript,
  buildLemmaMap,
  cleanTranscript,
  fallbackLemma,
  isCommon,
  LEVEL_RULE,
  levelFor,
  tokenize,
} from './text.mjs'

// Small hand-made list in the NGSL format, so tests do not depend on the real file.
const MINI = [
  '## note line',
  'be,am,m,is,isn,s,are,re,aren,was,were,been,being',
  'do,does,did,doing,done,doesn,didn',
  'not,t',
  'go,goes,went,going,gone',
  'child,children',
  'have,haven,ve,has,had,d',
  'I,me,my',
  'the',
  'a,an',
  'teacher,teachers',
  'say,says,said,saying',
  'school,schools',
  'see,saw,seen,sees,seeing',
  'with',
].join('\r\n')
const map = buildLemmaMap('﻿' + MINI)

describe('buildLemmaMap', () => {
  it('maps every form to its lemma, lowercased, ignoring notes and BOM', () => {
    assert.equal(map.get('went'), 'go')
    assert.equal(map.get('children'), 'child')
    assert.equal(map.get('i'), 'i')
    assert.equal(map.has('## note line'), false)
  })

  it('knows "don" from "don\'t", which the NGSL does not list', () => {
    assert.equal(map.get('don'), 'do')
  })

  it('reads the real NGSL files', () => {
    const real = buildLemmaMap(
      readFileSync(new URL('./ngsl/NGSL_12_lemmatized_for_research.csv', import.meta.url), 'utf8'),
      readFileSync(new URL('./ngsl/SUP_lemmatized.csv', import.meta.url), 'utf8'),
    )
    assert.equal(real.get('went'), 'go')
    assert.equal(real.get('children'), 'child')
    assert.equal(real.get('isn'), 'be')
    assert.equal(real.get('t'), 'not')
    assert.equal(real.get('mondays'), 'monday')
    assert.ok(real.size > 9000)
  })
})

describe('cleanTranscript', () => {
  it('removes stage directions and normalizes curly apostrophes', () => {
    assert.equal(cleanTranscript('Good morning. (Laughter) It’s great. [Music] (Applause)'), "Good morning. It's great.")
  })
})

describe('tokenize', () => {
  it('splits contractions into pieces but keeps one spoken word', () => {
    const [w] = tokenize("don't")
    assert.deepEqual(w.parts, ['don', 't'])
  })

  it('ignores numbers and punctuation', () => {
    assert.deepEqual(
      tokenize('In 2006, 3 kids said: "no!"').map((w) => w.word),
      ['in', 'kids', 'said', 'no'],
    )
  })

  it('marks capitalized words mid-sentence as proper names, not sentence starts or "I"', () => {
    const words = tokenize('Then Gillian danced. Then I said Sarah was there.')
    const proper = words.filter((w) => w.proper).map((w) => w.word)
    assert.deepEqual(proper, ['gillian', 'sarah'])
  })
})

describe('fallbackLemma (words outside the NGSL)', () => {
  it('handles plural, -ed and -ing', () => {
    assert.equal(fallbackLemma('galaxies'), 'galaxy')
    assert.equal(fallbackLemma('boxes'), 'box')
    assert.equal(fallbackLemma('planets'), 'planet')
    assert.equal(fallbackLemma('orbiting'), 'orbit')
    assert.equal(fallbackLemma('stopped'), 'stop')
    assert.equal(fallbackLemma('virus'), 'virus')
  })

  it('counts an inflected common word as common', () => {
    assert.equal(isCommon('teachers', map), true)
    assert.equal(isCommon('galaxies', map), false)
  })
})

describe('levelFor (initial cut-offs)', () => {
  const { easy, hard } = LEVEL_RULE
  it('is easy at exactly 140 wpm and 6% uncommon', () => {
    assert.equal(levelFor(easy.maxWpm, easy.maxRare), 'easy')
  })

  it('is medium just above easy limits and at exactly 170 wpm / 12%', () => {
    assert.equal(levelFor(141, 0.05), 'medium')
    assert.equal(levelFor(130, 0.061), 'medium')
    assert.equal(levelFor(hard.minWpm, hard.minRare), 'medium')
  })

  it('is hard above 170 wpm or above 12% uncommon', () => {
    assert.equal(levelFor(171, 0.01), 'hard')
    assert.equal(levelFor(100, 0.121), 'hard')
  })
})

describe('analyzeTranscript', () => {
  const text =
    "The teacher said the children don't go. (Laughter) The galaxies are orbiting. Galaxies, galaxies! I saw Gillian with a teacher."
  // spoken words: 19 → 19 words in 60 s = 19 wpm
  const result = analyzeTranscript(text, 60, map)

  it('counts spoken words per minute', () => {
    assert.equal(result.words, 19)
    assert.equal(result.wpm, 19)
  })

  it('counts uncommon pieces, leaving proper names out', () => {
    // pieces: 19 words − 1 name ("Gillian", mid-sentence) + 1 extra piece from "don't" = 19; uncommon: galaxies ×3 + orbiting = 4
    assert.equal(result.rareRatio, Math.round((4 / 19) * 1000) / 1000)
    assert.equal(result.level, 'hard')
  })

  it('picks the most frequent uncommon lemmas as keywords', () => {
    assert.deepEqual(result.keywords, ['galaxy', 'orbit'])
  })

  it('rejects an empty transcript or a missing duration', () => {
    assert.throws(() => analyzeTranscript('(Applause)', 60, map), /no words/)
    assert.throws(() => analyzeTranscript('Hello there', 0, map), RangeError)
  })
})
