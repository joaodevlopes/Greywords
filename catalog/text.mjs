// Text analysis for the video catalog (spec 002). Pure functions, tested in text.test.mjs.
// "Common word" = any form listed in the NGSL (catalog/ngsl, CC BY-SA 4.0).

/** Initial level cut-offs; recalibrated with the real distribution in T5. */
export const LEVEL_RULE = {
  easy: { maxWpm: 140, maxRare: 0.06 },
  hard: { minWpm: 170, minRare: 0.12 },
}

export const KEYWORD_COUNT = 8
const KEYWORD_MIN_LENGTH = 4

// Contraction pieces the NGSL does not list ("don't" → "don" + "t"; "t" is already listed under "not").
const EXTRA_FORMS = { don: 'do', shan: 'shall' }

/**
 * Builds a form → lemma map from NGSL CSV texts. Lines starting with "##" are notes.
 * Each row is "lemma,form,form,…"; everything is lowercased.
 */
export function buildLemmaMap(...csvTexts) {
  const map = new Map(Object.entries(EXTRA_FORMS))
  for (const text of csvTexts) {
    for (const raw of text.replace(/^﻿/, '').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('##')) continue
      const forms = line.split(',').map((f) => f.trim().toLowerCase()).filter(Boolean)
      for (const form of forms) if (!map.has(form)) map.set(form, forms[0])
    }
  }
  return map
}

/** Removes stage directions such as "(Laughter)" or "(Applause)" and normalizes quotes. */
export function cleanTranscript(text) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/\((?:[^()]{1,40})\)/g, ' ')
    .replace(/\[(?:[^[\]]{1,40})\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Words of a cleaned transcript. Each spoken word becomes one entry; its contraction pieces
 * ("don't" → ["don", "t"]) are in `parts`. `proper` marks a capitalized word that does not
 * start a sentence (likely a name), except "I".
 */
export function tokenize(text) {
  const words = []
  let sentenceStart = true
  const re = /([A-Za-z]+(?:'[A-Za-z]+)*)|([.!?]+)/g
  for (const m of text.matchAll(re)) {
    if (m[2]) {
      sentenceStart = true
      continue
    }
    const surface = m[1]
    const lower = surface.toLowerCase()
    const capitalized = surface[0] !== surface[0].toLowerCase()
    words.push({
      word: lower,
      parts: lower.split("'").filter(Boolean),
      proper: capitalized && !sentenceStart && lower !== 'i',
    })
    sentenceStart = false
  }
  return words
}

/** Rough base form for words outside the NGSL (used only to group keywords). */
export function fallbackLemma(word) {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 4 && /(ss|sh|ch|x|z)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1)
  if (word.length > 5 && word.endsWith('ing')) return undouble(word.slice(0, -3))
  if (word.length > 4 && word.endsWith('ed')) return undouble(word.slice(0, -2))
  return word
}

function undouble(stem) {
  return /([b-df-hj-np-tv-z])\1$/.test(stem) ? stem.slice(0, -1) : stem
}

export function isCommon(part, lemmaMap) {
  return lemmaMap.has(part) || lemmaMap.has(fallbackLemma(part))
}

export function levelFor(wpm, rareRatio, rule = LEVEL_RULE) {
  if (wpm <= rule.easy.maxWpm && rareRatio <= rule.easy.maxRare) return 'easy'
  if (wpm > rule.hard.minWpm || rareRatio > rule.hard.minRare) return 'hard'
  return 'medium'
}

/**
 * Speed, share of uncommon words, level and keywords of one transcript.
 * - wpm counts spoken words (a contraction is one word) over the talk duration.
 * - rareRatio counts contraction pieces outside the NGSL; proper names are left out of both sides.
 */
export function analyzeTranscript(text, durationSec, lemmaMap, rule = LEVEL_RULE) {
  if (!(durationSec > 0)) throw new RangeError('durationSec must be a positive number')
  const words = tokenize(cleanTranscript(text))
  if (!words.length) throw new Error('transcript has no words')

  let pieces = 0
  let rare = 0
  const counts = new Map()
  for (const w of words) {
    if (w.proper) continue
    for (const part of w.parts) {
      pieces++
      if (isCommon(part, lemmaMap)) continue
      rare++
      if (part.length < KEYWORD_MIN_LENGTH) continue
      const lemma = fallbackLemma(part)
      counts.set(lemma, (counts.get(lemma) ?? 0) + 1)
    }
  }

  const wpm = Math.round(words.length / (durationSec / 60))
  const rareRatio = pieces ? Math.round((rare / pieces) * 1000) / 1000 : 0
  const keywords = [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, KEYWORD_COUNT)
    .map(([lemma]) => lemma)

  return { words: words.length, wpm, rareRatio, level: levelFor(wpm, rareRatio, rule), keywords }
}
