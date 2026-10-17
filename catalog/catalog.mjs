// Catalog assembly (spec 002, T5). Pure: sources + transcripts in, catalog object out.
// The output carries numbers and a few single keywords per talk — never transcript text.

import { analyzeTranscript, LEVEL_RULE } from './text.mjs'

export const MAX_CATALOG_BYTES = 200 * 1024

export function buildCatalog({ niches, talks, texts, lemmaMap, rule = LEVEL_RULE, generatedAt }) {
  const videos = talks.map((t) => {
    const a = analyzeTranscript(texts.get(t.tedSlug), t.durationSec, lemmaMap, rule)
    return {
      id: `ted:${t.tedSlug}`,
      niches: t.niches,
      title: t.title,
      speaker: t.speaker,
      durationSec: t.durationSec,
      youtubeId: t.youtubeId,
      tedUrl: `https://www.ted.com/talks/${t.tedSlug}`,
      thumb: `https://i.ytimg.com/vi/${t.youtubeId}/mqdefault.jpg`,
      wpm: a.wpm,
      rareRatio: a.rareRatio,
      level: a.level,
      keywords: a.keywords,
    }
  })
  return { generatedAt, levelRule: rule, niches, videos }
}

/** Value at quantile q (0–1) of a numeric list, linear interpolation. */
export function quantile(values, q) {
  const s = [...values].sort((a, b) => a - b)
  if (!s.length) return NaN
  const pos = (s.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return s[lo] + (s[hi] - s[lo]) * (pos - lo)
}

/**
 * Distribution of the two metrics and the level counts, to calibrate LEVEL_RULE.
 * Terciles are only a starting point: "easy" should mean slower AND fewer uncommon words.
 */
export function summarize(videos) {
  const wpm = videos.map((v) => v.wpm)
  const rare = videos.map((v) => v.rareRatio)
  const stats = (list) => ({
    min: Math.min(...list),
    p33: quantile(list, 1 / 3),
    median: quantile(list, 0.5),
    p67: quantile(list, 2 / 3),
    max: Math.max(...list),
  })
  const levels = { easy: 0, medium: 0, hard: 0 }
  for (const v of videos) levels[v.level]++
  const perNiche = {}
  for (const v of videos) for (const n of v.niches) perNiche[n] = (perNiche[n] ?? 0) + 1
  return { count: videos.length, wpm: stats(wpm), rare: stats(rare), levels, perNiche }
}
