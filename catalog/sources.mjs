// Local catalog sources (spec 002, T3). Manual curation only: nothing here ever requests TED.com
// (TED.com Terms of Use §6.4 forbid automated access). The only network call is YouTube's public oEmbed.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cleanTranscript, tokenize } from './text.mjs'

export const ALLOWED_CHANNELS = ['TED']
export const MIN_TRANSCRIPT_WORDS = 100
const OEMBED = 'https://www.youtube.com/oembed?format=json&url='

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0

/** Checks the shape of sources.json. Returns the talks plus a list of readable errors. */
export function validateSources(data) {
  const errors = []
  const nicheIds = new Set()
  if (!Array.isArray(data?.niches) || !data.niches.length) errors.push('"niches" precisa ser uma lista com pelo menos um nicho')
  for (const n of data?.niches ?? []) {
    if (!nonEmpty(n?.id) || !nonEmpty(n?.label)) errors.push(`nicho inválido: ${JSON.stringify(n)} (precisa de "id" e "label")`)
    else if (nicheIds.has(n.id)) errors.push(`nicho repetido: "${n.id}"`)
    else nicheIds.add(n.id)
  }
  if (!Array.isArray(data?.talks)) errors.push('"talks" precisa ser uma lista')

  const slugs = new Set()
  for (const [i, t] of (data?.talks ?? []).entries()) {
    const where = `talk ${i + 1}${nonEmpty(t?.tedSlug) ? ` (${t.tedSlug})` : ''}`
    if (!nonEmpty(t?.tedSlug) || !/^[a-z0-9_]+$/.test(t.tedSlug)) errors.push(`${where}: "tedSlug" deve ser o final do link do TED, ex.: sir_ken_robinson_do_schools_kill_creativity`)
    else if (slugs.has(t.tedSlug)) errors.push(`${where}: repetido`)
    else slugs.add(t.tedSlug)
    if (!nonEmpty(t?.title)) errors.push(`${where}: falta "title"`)
    if (!nonEmpty(t?.speaker)) errors.push(`${where}: falta "speaker"`)
    if (!Number.isInteger(t?.durationSec) || t.durationSec <= 0) errors.push(`${where}: "durationSec" deve ser a duração em segundos (número inteiro), ex.: 1151 para 19:11`)
    if (!nonEmpty(t?.youtubeId) || !/^[A-Za-z0-9_-]{11}$/.test(t.youtubeId)) errors.push(`${where}: "youtubeId" deve ter 11 caracteres, ex.: iG9CE55wbtY (o que vem depois de "v=" no link do YouTube)`)
    if (!Array.isArray(t?.niches) || !t.niches.length) errors.push(`${where}: "niches" precisa ter pelo menos um nicho`)
    else for (const id of t.niches) if (!nicheIds.has(id)) errors.push(`${where}: nicho desconhecido "${id}"`)
  }
  return { niches: data?.niches ?? [], talks: data?.talks ?? [], errors }
}

export const transcriptPath = (dir, slug) => join(dir, `${slug}.txt`)

/** Reads catalog/transcripts/<slug>.txt for each talk. Missing or too-short files become errors. */
export async function readTranscripts(talks, dir, read = readFile) {
  const texts = new Map()
  const errors = []
  for (const t of talks) {
    const path = transcriptPath(dir, t.tedSlug)
    let text
    try {
      text = await read(path, 'utf8')
    } catch {
      errors.push(`${t.tedSlug}: transcrição faltando em ${path}`)
      continue
    }
    const words = tokenize(cleanTranscript(text)).length
    if (words < MIN_TRANSCRIPT_WORDS) errors.push(`${t.tedSlug}: transcrição muito curta (${words} palavras) — colou o texto inteiro?`)
    else texts.set(t.tedSlug, text)
  }
  return { texts, errors }
}

/** Confirms through YouTube's public oEmbed that the video exists and belongs to an allowed channel. */
export async function verifyYoutube(youtubeId, fetchImpl = fetch) {
  const url = OEMBED + encodeURIComponent(`https://www.youtube.com/watch?v=${youtubeId}`)
  let res
  try {
    res = await fetchImpl(url, { signal: AbortSignal.timeout(10000) })
  } catch {
    return { ok: false, error: 'sem resposta do YouTube (verifique a internet)' }
  }
  if (!res.ok) return { ok: false, error: `vídeo não encontrado ou sem permissão para incorporar (HTTP ${res.status})` }
  const { author_name: author } = await res.json()
  return ALLOWED_CHANNELS.includes(author)
    ? { ok: true, author }
    : { ok: false, author, error: `o vídeo é do canal "${author}", não do canal oficial do TED` }
}
