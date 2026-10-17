// Example sentences (spec 004): pure helpers to find the word in a sentence, choose the best examples,
// highlight the word and blank it out for review. Sentences come from Tatoeba (src/api.js, T2) or from
// the dictionary's own examples (fromDictionary). Shape: { id, text, translation, owner, license, link }.
import { toGerund } from './imageQuery.js'

const MIN_WORDS = 4
const MAX_WORDS = 12
const BLANK = '___'

const norm = (w) => String(w ?? '').trim().toLowerCase()

/**
 * Regular forms of a word: itself, plural / 3rd person (-s, -es, -ies), past (-d, -ed, -ied, doubled
 * consonant) and gerund. Irregular forms ("went") are not guessed: a sentence with only those is skipped.
 */
export function wordForms(word) {
  const w = norm(word)
  if (!w) return []
  const forms = new Set([w, `${w}s`, toGerund(w)])
  if (/(s|x|z|ch|sh|o)$/.test(w)) forms.add(`${w}es`)
  if (/[^aeiou]y$/.test(w)) {
    forms.add(`${w.slice(0, -1)}ies`)
    forms.add(`${w.slice(0, -1)}ied`)
  }
  if (w.endsWith('e')) forms.add(`${w}d`)
  else forms.add(`${w}ed`)
  // one-syllable consonant-vowel-consonant doubles the last letter (stop → stopped), like toGerund
  if (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(w)) forms.add(`${w}${w.at(-1)}ed`)
  return [...forms]
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** First form of the word in the text, as a whole word, ignoring case: { index, length, form } or null. */
export function findForm(text, word) {
  const forms = wordForms(word).sort((a, b) => b.length - a.length)
  if (!forms.length || !text) return null
  const re = new RegExp(`(?<![A-Za-z])(${forms.map(escape).join('|')})(?![A-Za-z])`, 'i')
  const m = re.exec(text)
  return m ? { index: m.index, length: m[0].length, form: m[0] } : null
}

const wordCount = (text) => text.trim().split(/\s+/).filter(Boolean).length

/**
 * Up to `max` examples (D1): approved, containing a form of the word, 4 to 12 words long, no repeats;
 * the ones with a Portuguese translation first, then the shortest.
 */
export function pickExamples(sentences, word, max = 5) {
  const seen = new Set()
  const ok = []
  for (const s of sentences ?? []) {
    const text = s?.text?.trim()
    if (!text || s.approved === false) continue
    const key = text.toLowerCase().replace(/\s+/g, ' ')
    if (seen.has(key)) continue
    const words = wordCount(text)
    if (words < MIN_WORDS || words > MAX_WORDS || !findForm(text, word)) continue
    seen.add(key)
    ok.push({ ...s, text, words })
  }
  ok.sort((a, b) => Number(Boolean(b.translation)) - Number(Boolean(a.translation)) || a.words - b.words || a.text.length - b.text.length)
  return ok.slice(0, max).map(({ words, approved, ...rest }) => rest)
}

/** Splits the sentence around the word, to highlight it without innerHTML: { before, match, after }. */
export function highlight(text, word) {
  const f = findForm(text, word)
  if (!f) return { before: text ?? '', match: '', after: '' }
  return { before: text.slice(0, f.index), match: text.slice(f.index, f.index + f.length), after: text.slice(f.index + f.length) }
}

/** The sentence with the word replaced by a blank, for the front of the review card (R4.1). */
export function cloze(text, word) {
  const { before, match, after } = highlight(text, word)
  return match ? `${before}${BLANK}${after}` : text
}

/** The dictionary's own examples in the same shape (no translation, no author), as a fallback (R1.5). */
export function fromDictionary(meanings) {
  const seen = new Set()
  const list = []
  for (const m of meanings ?? []) {
    const text = m?.example?.trim()
    if (!text || seen.has(text.toLowerCase())) continue
    seen.add(text.toLowerCase())
    list.push({ id: `dict:${list.length + 1}`, text, translation: null, owner: null, license: null, link: null, source: 'dictionary' })
  }
  return list
}

/**
 * Choose / unchoose a sentence (D3, at most `max`, 2 by default). Choosing one more than `max` drops the
 * oldest choice, like the image picker.
 */
export function togglePicked(picked, id, max = 2) {
  const list = picked ?? []
  if (list.includes(id)) return list.filter((x) => x !== id)
  return list.length < max ? [...list, id] : [...list.slice(list.length - max + 1), id]
}

/** Short credit shown under each sentence (R6.3): "Tatoeba · autor", "Tatoeba" (CC0) or "Dicionário". */
export function exampleCredit(sentence) {
  if (sentence?.source === 'dictionary') return 'Dicionário'
  return sentence?.owner ? `Tatoeba · ${sentence.owner}` : 'Tatoeba'
}
