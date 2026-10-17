import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cloze, dictionaryExamples, exampleCredit, examplesToSave, findForm, fromDictionary, highlight, mergeExamples, pickExamples, togglePicked, wordForms } from './examples.js'

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

describe('togglePicked (spec 004, D3)', () => {
  it('adds up to 2, removes on a second click and drops the oldest past the limit', () => {
    assert.deepEqual(togglePicked([], 1), [1])
    assert.deepEqual(togglePicked([1], 2), [1, 2])
    assert.deepEqual(togglePicked([1, 2], 3), [2, 3])
    assert.deepEqual(togglePicked([1, 2], 1), [2])
    assert.deepEqual(togglePicked(undefined, 'a'), ['a'])
    assert.deepEqual(togglePicked(['a'], 'b', 1), ['b'])
  })
})

describe('exampleCredit (spec 004, R6.3)', () => {
  it('names Tatoeba and the author, or the dictionary', () => {
    assert.equal(exampleCredit(s(1, 'I like to cook.')), 'Tatoeba · u')
    assert.equal(exampleCredit(s(2, 'I like to cook.', null, { owner: null, license: 'CC0 1.0' })), 'Tatoeba')
    assert.equal(exampleCredit(fromDictionary([{ example: 'She cooks well.' }])[0]), 'Dicionário')
  })
})

describe('dictionaryExamples (spec 004, R1.5)', () => {
  it('prefers good dictionary examples and falls back to all of them', () => {
    const meanings = [{ example: 'Study.' }, { example: 'She studies biology at the university.' }]
    assert.deepEqual(dictionaryExamples(meanings, 'study').map((e) => e.text), ['She studies biology at the university.'])
    assert.deepEqual(dictionaryExamples([{ example: 'Study.' }], 'study').map((e) => e.text), ['Study.'])
    assert.deepEqual(dictionaryExamples(undefined, 'study'), [])
  })
})

describe('mergeExamples (spec 004, R2.1)', () => {
  it('keeps the saved ones first and skips repeats by id or text', () => {
    const saved = [s(1, 'I like to cook dinner.')]
    const found = [s(1, 'I like to cook dinner.'), s(2, 'i like to cook dinner.'), s(3, 'We cook every Sunday.')]
    assert.deepEqual(mergeExamples(saved, found).map((e) => e.id), [1, 3])
    assert.deepEqual(mergeExamples(undefined, found.slice(2)).map((e) => e.id), [3])
  })
})

describe('examplesToSave (spec 004, D3)', () => {
  const list = [s(1, 'One cook here now.', 'Um'), s(2, 'Two cooks here now.'), s(3, 'Three cooks here now.')]
  it('saves the chosen ones in order, at most 2, in the stored shape', () => {
    const saved = examplesToSave(list, [3, 1])
    assert.deepEqual(saved.map((e) => e.id), [3, 1])
    assert.deepEqual(Object.keys(saved[1]).sort(), ['id', 'license', 'link', 'owner', 'text', 'translation'])
    assert.equal(examplesToSave(list, [1, 2, 3]).length, 2)
  })
  it('saves the first one when nothing was chosen, nothing when there are none', () => {
    assert.deepEqual(examplesToSave(list, []).map((e) => e.id), [1])
    assert.deepEqual(examplesToSave([], []), [])
  })
  it('keeps what was saved while the list is still loading', () => {
    const before = [s(9, 'Saved cook sentence here.')]
    assert.deepEqual(examplesToSave(null, [], before), before)
    assert.deepEqual(examplesToSave(undefined, [], undefined), [])
  })
  it('keeps the dictionary source mark', () => {
    const dict = fromDictionary([{ example: 'She cooks very well indeed.' }])
    assert.equal(examplesToSave(dict, [])[0].source, 'dictionary')
  })
})
