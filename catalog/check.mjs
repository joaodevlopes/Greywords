// npm run catalog:check [sources.json] [transcripts dir]
// Validates the manual curation before generating the catalog. Exit code 1 when something is wrong.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { readTranscripts, validateSources, verifyYoutube } from './sources.mjs'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const sourcesPath = process.argv[2] ?? here('./sources.json')
const transcriptsDir = process.argv[3] ?? here('./transcripts')

const data = JSON.parse(await readFile(sourcesPath, 'utf8'))
const { niches, talks, errors } = validateSources(data)

const { errors: transcriptErrors } = await readTranscripts(talks, transcriptsDir)
errors.push(...transcriptErrors)

for (const t of talks) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(t.youtubeId ?? '')) continue
  const yt = await verifyYoutube(t.youtubeId)
  if (!yt.ok) errors.push(`${t.tedSlug}: ${yt.error}`)
}

console.log(`${talks.length} talks em ${niches.length} nichos`)
for (const n of niches) {
  const count = talks.filter((t) => t.niches?.includes(n.id)).length
  console.log(`  ${n.label.padEnd(18)} ${count}`)
}

if (errors.length) {
  console.log(`\n${errors.length} problema(s):`)
  for (const e of errors) console.log(`  - ${e}`)
  process.exitCode = 1
} else {
  console.log('\nTudo certo.')
}
