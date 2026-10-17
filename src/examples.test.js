import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cloze, findForm, fromDictionary, highlight, pickExamples, wordForms } from './examples.js'

const s = (id, text, translation = null, extra = {}) => ({ id, text, translation, owner: 'u', license: 'CC BY 2.0 FR', link: `https://tatoeba.org/en/sentences/show/${id}`, ...extra })

describe('wordForms (spec 004, R1.1)', () => {
  it('covers plural / 3rd person, past and gerund of regular words', () => {
    const study = wordForms('study')
    for (const f of ['study', 'studies', 'studied', 'studying']) assert.ok(study.includes(f), f)
    const cook = wordForms('cook')
    for (const f of ['cook', 'cooks', 'cooked', 'cooking']) assert.ok(cook.includes(f), f)
    assert.ok(!cook.includes('cookked'))
    const box = wordForms('box')
    for (const f of ['box', 'boxes', 'boxed']) assert.ok(box.includes(f), f)
    assert.ok(wordForms('stop').includes('stopped'))
    assert.ok(wordForms('use').includes('used'))
    assert.ok(wordForms('go').includes('goes'))
  })

  it('does not guess irregular forms', () => {
    assert.ok(!wordForms('go').includes('went'))
  })
})

describe('findForm', () => {
  it('finds the first form as a whole word, ignoring case', () => {
    assert.deepEqual(findForm('However, my shoulder hurts.', 'however'), { index: 0, length: 7, form: 'However' })
    assert.equal(findForm('She studied all night.', 'study').form, 'studied')
  })

  it('does not match inside other words', () => {
    assert.equal(findForm('The student left early.', 'stud'), null)
    assert.equal(findForm('Sunday was sunny.', 'sun'), null)
  })

  it('returns null when there is no form', () => {
    assert.equal(findForm('They went home.', 'go'), null)
    assert.equal(findForm('', 'go'), null)
  })
})

describe('pickExamples (D1)', () => {
  it('keeps approved sentences with the word, 4 to 12 words long, without repeats', () => {
    const picked = pickExamples(
      [
        s(1, 'Study.'), // too short
        s(2, 'We study together every single evening after a very long day at work.'), // 13 words: too long
        s(3, 'They went home after school.'), // no form of "study"
        s(4, 'I study English at night.'),
        s(5, 'I study English at night.'), // repeated
        s(6, 'She studied hard for the test.', null, { approved: false }), // not approved
        s(7, 'He is studying for his exams.'),
      ],
      'study',
    )
    assert.deepEqual(picked.map((p) => p.id), [4, 7])
  })

  it('puts sentences with a Portuguese translation first, then the shortest', () => {
    const picked = pickExamples(
      [
        s(1, 'Students study in the library every day.'),
        s(2, 'I study at home now.'),
        s(3, 'They study together on most Sunday afternoons.', 'Eles estudam juntos na maioria das tardes de domingo.'),
        s(4, 'We study a lot.', 'Nós estudamos muito.'),
      ],
      'study',
    )
    assert.deepEqual(picked.map((p) => p.id), [4, 3, 2, 1])
  })

  it('returns at most max examples and keeps the sentence fields', () => {
    const many = Array.from({ length: 9 }, (_, i) => s(i, `I study word number ${i}.`))
    const picked = pickExamples(many, 'study', 5)
    assert.equal(picked.length, 5)
    assert.deepEqual(Object.keys(picked[0]).sort(), ['id', 'license', 'link', 'owner', 'text', 'translation'])
  })
})

describe('highlight and cloze (R4.1)', () => {
  it('splits the sentence around the word', () => {
    assert.deepEqual(highlight('However, my shoulder hurts.', 'however'), { before: '', match: 'However', after: ', my shoulder hurts.' })
    assert.deepEqual(highlight('Nothing here.', 'however'), { before: 'Nothing here.', match: '', after: '' })
  })

  it('replaces the word with a blank', () => {
    assert.equal(cloze('However, my shoulder hurts.', 'however'), '___, my shoulder hurts.')
    assert.equal(cloze('She studied all night.', 'study'), 'She ___ all night.')
    assert.equal(cloze('Nothing here.', 'however'), 'Nothing here.')
  })
})

describe('fromDictionary (R1.5)', () => {
  it('turns dictionary examples into the same shape, without translation or author', () => {
    const list = fromDictionary([
      { pos: 'adverb', definition: 'Nevertheless.', example: 'The party, however, was a disaster.' },
      { pos: 'adverb', definition: 'In contrast.', example: '' },
      { pos: 'conjunction', definition: 'But.', example: 'The party, however, was a disaster.' },
    ])
    assert.deepEqual(list, [
      { id: 'dict:1', text: 'The party, however, was a disaster.', translation: null, owner: null, license: null, link: null, source: 'dictionary' },
    ])
  })
})
