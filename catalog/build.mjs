// npm run catalog [-- --sources <file>] [--transcripts <dir>] [--out <file>] [--skip-youtube]
// Generates public/catalog.json from the manual curation (spec 002, T5). Never requests TED.com.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { buildCatalog, MAX_CATALOG_BYTES, summarize } from './catalog.mjs'
import { readTranscripts, validateSources, verifyYoutube } from './sources.mjs'
import { buildLemmaMap, LEVEL_RULE } from './text.mjs'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const { values: args } = parseArgs({
  options: {
    sources: { type: 'string', default: here('./sources.json') },
    transcripts: { type: 'string', default: here('./transcripts') },
    out: { type: 'string', default: here('../public/catalog.json') },
    'skip-youtube': { type: 'boolean', default: false },
  },
})

function fail(title, errors) {
  console.error(`\n${title}`)
  for (const e of errors) console.error(`  - ${e}`)
  console.error('\nNada foi gravado. Rode "npm run catalog:check" para ver só a validação.')
  process.exit(1)
}

const { niches, talks, errors } = validateSources(JSON.parse(await readFile(args.sources, 'utf8')))
if (errors.length) fail('A lista curada tem problemas:', errors)
if (!talks.length) fail('A lista curada está vazia:', ['adicione talks em catalog/sources.json (veja catalog/HOW-TO.md)'])

const { texts, errors: transcriptErrors } = await readTranscripts(talks, args.transcripts)
if (transcriptErrors.length) fail('Transcrições com problema:', transcriptErrors)

if (!args['skip-youtube']) {
  const ytErrors = []
  for (const t of talks) {
    const yt = await verifyYoutube(t.youtubeId)
    if (!yt.ok) ytErrors.push(`${t.tedSlug}: ${yt.error}`)
  }
  if (ytErrors.length) fail('Vídeos do YouTube com problema:', ytErrors)
}

const lemmaMap = buildLemmaMap(
  await readFile(here('./ngsl/NGSL_12_lemmatized_for_research.csv'), 'utf8'),
  await readFile(here('./ngsl/SUP_lemmatized.csv'), 'utf8'),
)
const catalog = buildCatalog({
  niches,
  talks,
  texts,
  lemmaMap,
  rule: LEVEL_RULE,
  generatedAt: new Date().toLocaleDateString('sv'), // local YYYY-MM-DD
})

const json = `${JSON.stringify(catalog, null, 1)}\n`
await writeFile(args.out, json)

// ---------- report, to calibrate LEVEL_RULE in catalog/text.mjs ----------
const s = summarize(catalog.videos)
const pct = (x) => `${(x * 100).toFixed(1)}%`
const row = (label, st, fmt) =>
  `  ${label.padEnd(16)} min ${fmt(st.min)} · p33 ${fmt(st.p33)} · mediana ${fmt(st.median)} · p67 ${fmt(st.p67)} · máx ${fmt(st.max)}`

console.log(`\nCatálogo gravado em ${args.out} (${(json.length / 1024).toFixed(1)} KB, ${s.count} vídeos)`)
console.log('\nDistribuição')
console.log(row('palavras/min', s.wpm, (x) => x.toFixed(0)))
console.log(row('% pouco comuns', s.rare, pct))
console.log(`\nNíveis com a regra atual: fácil ${s.levels.easy} · médio ${s.levels.medium} · difícil ${s.levels.hard}`)
console.log(
  `Regra atual: fácil ≤ ${LEVEL_RULE.easy.maxWpm} ppm e ≤ ${pct(LEVEL_RULE.easy.maxRare)}; difícil > ${LEVEL_RULE.hard.minWpm} ppm ou > ${pct(LEVEL_RULE.hard.minRare)}`,
)
console.log(
  `Ponto de partida pelos tercis: fácil ≤ ${s.wpm.p33.toFixed(0)} ppm e ≤ ${pct(s.rare.p33)}; difícil > ${s.wpm.p67.toFixed(0)} ppm ou > ${pct(s.rare.p67)}`,
)
console.log('\nPor nicho')
for (const n of niches) console.log(`  ${n.label.padEnd(18)} ${s.perNiche[n.id] ?? 0}`)
if (json.length > MAX_CATALOG_BYTES) console.warn(`\nAtenção: o arquivo passou de ${MAX_CATALOG_BYTES / 1024} KB.`)
console.log('\nPara mudar os cortes, edite LEVEL_RULE em catalog/text.mjs e rode de novo.')
