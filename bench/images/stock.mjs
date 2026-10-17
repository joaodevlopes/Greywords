// Side-by-side check of a stock photo API vs Openverse on the 20 benchmark words (spec 003, 2026-10-17).
// Needs UNSPLASH_ACCESS_KEY (or PEXELS_API_KEY) in .env.local (git-ignored). Usage: node bench/images/stock.mjs
// Writes bench/images/out/stock.html: per word, 9 stock photos (the word alone) above the 9 Openverse
// images the app shows today (variant "both", from bench/images/cache/both.json).
// Unsplash demo apps get 50 requests/hour: the 20 words fit, and responses are cached on disk.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PER_WORD = 9
const here = (p) => fileURLToPath(new URL(p, import.meta.url))

const env = await readFile(here('../../.env.local'), 'utf8').catch(() => '')
// accepts KEY=value and KEY="value" (quotes are common in .env files)
const read = (name) => {
  const value = env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim()
  return value?.replace(/^(["'])(.*)\1$/, (_, quote, inner) => inner)
}
const PROVIDERS = {
  unsplash: {
    label: 'Unsplash',
    key: read('UNSPLASH_ACCESS_KEY'),
    url: (q) => `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${PER_WORD}`,
    auth: (k) => `Client-ID ${k}`,
    list: (d) => (d.results ?? []).map((p) => ({ id: `us:${p.id}`, thumb: p.urls.small, alt: p.alt_description, credit: p.user?.name })),
  },
  pexels: {
    label: 'Pexels',
    key: read('PEXELS_API_KEY'),
    url: (q) => `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${PER_WORD}`,
    auth: (k) => k,
    list: (d) => (d.photos ?? []).map((p) => ({ id: `px:${p.id}`, thumb: p.src.medium, alt: p.alt, credit: p.photographer })),
  },
}
const name = Object.keys(PROVIDERS).find((n) => PROVIDERS[n].key)
if (!name) {
  console.error('Falta UNSPLASH_ACCESS_KEY (ou PEXELS_API_KEY) no arquivo .env.local, na raiz do projeto.')
  process.exit(1)
}
const P = PROVIDERS[name]

const groups = JSON.parse(await readFile(here('./words.json'), 'utf8'))
const words = Object.values(groups).flat()
const openverse = await readFile(here('./cache/both.json'), 'utf8').then(JSON.parse, () => ({}))
await mkdir(here('./cache'), { recursive: true })
await mkdir(here('./out'), { recursive: true })
const cachePath = here(`./cache/${name}.json`)
const cache = await readFile(cachePath, 'utf8').then(JSON.parse, () => ({}))

let calls = 0
for (const word of words) {
  if (cache[word]) continue
  const r = await fetch(P.url(word), { headers: { Authorization: P.auth(P.key) }, signal: AbortSignal.timeout(8000) })
  calls++
  if (r.status === 401 || r.status === 403) {
    console.error(`${word}: HTTP ${r.status} — chave não aceita; confira a Access Key no .env.local`)
    process.exit(1)
  }
  if (!r.ok) {
    console.log(`${word}: HTTP ${r.status}`)
    continue
  }
  cache[word] = P.list(await r.json())
  console.log(`${word}: ${cache[word].length} fotos`)
  await writeFile(cachePath, JSON.stringify(cache, null, 1))
}

const row = (label, images) =>
  `<p class="src">${label}</p><div class="grid">${images
    .slice(0, PER_WORD)
    .map((i) => `<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${i.thumb}">`)
    .join('')}</div>`
const sections = words
  .map((w) => `<section><h2>${w}</h2>${row(P.label, cache[w] ?? [])}${row('Openverse (hoje)', openverse[w]?.images ?? [])}</section>`)
  .join('\n')
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${P.label} x Openverse</title>
<style>
  :root { color-scheme: light dark; } body { margin: 0; font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 16px; } h2 { margin: 28px 0 4px; font-size: 18px; }
  .src { margin: 8px 0 4px; font-size: 13px; opacity: .7; }
  .grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px; }
  .grid img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; background: #8883; }
  @media (max-width: 700px) { .grid { grid-template-columns: repeat(3, 1fr); } }
</style></head><body><main>
<h1>${P.label} × Openverse — 20 palavras</h1>
<p>Em cima, ${P.label} (só a palavra). Embaixo, o que o app mostra hoje (Openverse, variante "both").</p>
${sections}
</main></body></html>`
const out = here('./out/stock.html')
await writeFile(out, html)
console.log(`\nChamadas ao ${P.label}: ${calls}\nPágina: ${out}`)
