// Image relevance benchmark (spec 003, R4).
// node bench/images/run.mjs [antes|class|definition|both|depois|unsplash]
// Fetches the first 9 images per word with the chosen strategy and writes bench/images/out/<variant>.html,
// a rating page without titles. "depois" runs class, definition and both and also writes out/depois.html:
// one blind page with every distinct image per word, rated once, scored for each variant (T7).
// Results are cached in bench/images/cache/ (both folders are git-ignored).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { fetchDefinition, fetchImages, fetchImagesFor } from '../../src/api.js'
import { buildQueries, isAbstract } from '../../src/imageQuery.js'
import { handle } from '../../server/images.js'

const PER_WORD = 9
const WAIT_MS = 3500 // Openverse without a key: 20 requests/min, 200/day per IP
const here = (p) => fileURLToPath(new URL(p, import.meta.url))
const arg = process.argv[2] ?? 'antes'
const AFTER = ['class', 'definition', 'both']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const groups = JSON.parse(await readFile(here('./words.json'), 'utf8'))
const words = Object.entries(groups).flatMap(([group, list]) => list.map((word) => ({ word, group })))
await mkdir(here('./cache'), { recursive: true })
await mkdir(here('./out'), { recursive: true })

// HTTP cache shared by every variant: the same image query (e.g. the word alone) is fetched once.
// Only real Openverse calls are spaced out (20 requests/min without a key); 429 and errors are not cached.
const httpPath = here('./cache/http.json')
const http = await readFile(httpPath, 'utf8').then(JSON.parse, () => ({}))
const realFetch = globalThis.fetch
let lastOpenverse = 0
let realCalls = 0
globalThis.fetch = async (url, opts) => {
  const key = String(url)
  if (http[key]) return new Response(http[key], { status: 200, headers: { 'content-type': 'application/json' } })
  if (key.includes('api.openverse.org')) {
    const wait = lastOpenverse + WAIT_MS - Date.now()
    if (wait > 0) await sleep(wait)
    lastOpenverse = Date.now()
    realCalls++
  }
  const res = await realFetch(url, opts)
  if (res.ok && /openverse|wikimedia/.test(key)) {
    http[key] = await res.clone().text()
    await writeFile(httpPath, JSON.stringify(http))
  }
  return res
}

// Definitions are fetched once per word and reused by the three "after" variants.
const defsPath = here('./cache/defs.json')
const defs = await readFile(defsPath, 'utf8').then(JSON.parse, () => ({}))
async function definitionOf(word) {
  if (!(word in defs)) {
    defs[word] = await fetchDefinition(word).catch(() => null)
    await writeFile(defsPath, JSON.stringify(defs, null, 1))
  }
  return defs[word]
}

// "antes" reproduces the app before spec 003: bare word, any category, topped up with Wikimedia.
// The others reproduce the app after T3/T4 with each query variant. Every variant gets 9 images so all
// are scored on the same count (the app itself shows only 3 for abstract words).
const after = (variant) => async (word) => {
  const def = await definitionOf(word)
  const queries = buildQueries(word, def, variant)
  const { images } = await fetchImagesFor(queries, PER_WORD)
  return { images, queries, abstract: Boolean(def) && isAbstract(def, word) }
}
// "unsplash" is the app after T8a: the image intermediary (server/images.js), the word alone, 9 photos.
// It needs UNSPLASH_ACCESS_KEY in .env.local (KEY=value or KEY="value"); 20 words = 20 Unsplash calls.
async function unsplashKey() {
  const env = await readFile(here('../../.env.local'), 'utf8').catch(() => '')
  const value = env.match(/^UNSPLASH_ACCESS_KEY=(.+)$/m)?.[1]?.trim()
  return value?.replace(/^(["'])(.*)\1$/, (_, quote, inner) => inner)
}
const unsplash = async (word) => {
  const r = await handle('/search', new URLSearchParams({ q: word, n: String(PER_WORD) }), { key: await unsplashKey() })
  if (r.status !== 200) throw new Error(r.body.error ?? `HTTP ${r.status}`)
  if (r.body.limited) throw new Error('Unsplash no limite (429)')
  return { images: r.body.images, queries: [word] }
}

const STRATEGIES = {
  unsplash,
  antes: async (word) => ({ images: await fetchImages(word), queries: [word] }),
  class: after('class'),
  definition: after('definition'),
  both: after('both'),
}

const toRun = arg === 'depois' ? AFTER : [arg]
if (!toRun.every((v) => STRATEGIES[v])) {
  console.error(`Variante "${arg}" não existe. Disponíveis: ${Object.keys(STRATEGIES).join(', ')}, depois`)
  process.exit(1)
}

const caches = {}
for (const variant of toRun) {
  // cache/unsplash.json belongs to bench/images/stock.mjs (another shape), hence a different name
  const cachePath = here(`./cache/${variant === 'unsplash' ? 'unsplash-app' : variant}.json`)
  const cache = await readFile(cachePath, 'utf8').then(JSON.parse, () => ({}))
  for (const [i, { word }] of words.entries()) {
    if (cache[word]) continue
    try {
      const { images, queries } = await STRATEGIES[variant](word)
      cache[word] = { queries, images: images.slice(0, PER_WORD).map(({ id, thumb, link }) => ({ id, thumb, link })) }
      console.log(`[${variant}] ${String(i + 1).padStart(2)}/${words.length} ${word}: ${cache[word].images.length} imagens · ${queries.join(' | ')}`)
    } catch (e) {
      console.log(`[${variant}] ${String(i + 1).padStart(2)}/${words.length} ${word}: falhou (${e.message}) — rode de novo depois`)
    }
    await writeFile(cachePath, JSON.stringify(cache, null, 1))
  }
  caches[variant] = cache
  const outPath = here(`./out/${variant}.html`)
  await writeFile(outPath, page(variant, words, cache))
  const missing = words.filter(({ word }) => !cache[word]).map(({ word }) => word)
  console.log(`Página: ${outPath}${missing.length ? ` · sem resultado: ${missing.join(', ')}` : ''}`)
}

if (arg === 'depois') {
  const outPath = here('./out/depois.html')
  await writeFile(outPath, blindPage(words, caches))
  console.log(`\nPágina única para marcar (as 3 variantes, às cegas): ${outPath}`)
}
console.log(`Chamadas reais ao Openverse nesta rodada: ${realCalls}`)

// a function, so the pages can use it before this point in the file
function style() {
  return `
  :root { color-scheme: light dark; --bg:#fff; --fg:#222; --muted:#666; --line:#ddd; --ok:#1f9d55; --bad:#d64545; }
  @media (prefers-color-scheme: dark) { :root { --bg:#191919; --fg:#e6e6e6; --muted:#9a9a9a; --line:#333; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 16px 16px 140px; }
  h1 { font-size: 20px; margin: 8px 0 4px; }
  .help { color: var(--muted); margin: 0 0 24px; }
  section { margin: 0 0 28px; }
  section h2 { display: flex; justify-content: space-between; align-items: baseline; font-size: 17px; margin: 0 0 8px; }
  section h2 small { color: var(--muted); font-weight: 400; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tile { position: relative; aspect-ratio: 1; border-radius: 10px; overflow: hidden; background: var(--line); }
  .tile button.pick { all: unset; position: absolute; inset: 0; cursor: pointer; }
  .tile button.pick:focus-visible { outline: 3px solid #e8590c; outline-offset: -3px; }
  .tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .tile.ok { outline: 4px solid var(--ok); outline-offset: -4px; }
  .tile.ok::after { content: "✓"; position: absolute; top: 6px; left: 8px; color: #fff; background: var(--ok); border-radius: 50%; width: 24px; height: 24px; display: grid; place-items: center; font-weight: 700; pointer-events: none; }
  .tile.bad { outline: 4px solid var(--bad); outline-offset: -4px; }
  .tile.bad img { filter: blur(6px); }
  .tile button.flag { position: absolute; right: 6px; bottom: 6px; border: 0; border-radius: 6px; padding: 2px 6px; background: rgba(0,0,0,.65); color: #fff; font-size: 12px; cursor: pointer; }
  .empty { aspect-ratio: 1; border-radius: 10px; border: 1px dashed var(--line); display: grid; place-items: center; color: var(--muted); font-size: 12px; }
  footer { position: fixed; left: 0; right: 0; bottom: 0; background: var(--bg); border-top: 1px solid var(--line); padding: 12px 16px; }
  footer div { max-width: 760px; margin: 0 auto; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
  footer button { border: 0; border-radius: 999px; padding: 10px 18px; background: #e8590c; color: #000; font-weight: 600; cursor: pointer; }
  textarea { width: 100%; margin-top: 8px; display: none; }
`
}

function page(variant, words, cache) {
  const data = words.map(({ word, group }) => ({ word, group, images: cache[word]?.images ?? [] }))
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Medição de imagens: ${variant}</title>
<style>${style()}</style>
</head>
<body>
<main>
  <h1>Medição de imagens — variante "${variant}"</h1>
  <p class="help">Toque nas imagens <strong>certeiras</strong>: alguém que não leu o título reconheceria a palavra nelas.
  Não marque as erradas: o que não for certeira já conta como errada. O botão <strong>Imprópria</strong> é só para nudez, violência ou algo ofensivo. No fim, toque em "Copiar resultado" e cole na conversa.</p>
  <div id="list"></div>
</main>
<footer><div><span id="total"></span><button id="copy" type="button">Copiar resultado</button></div><textarea id="out" rows="6" readonly></textarea></footer>
<script>
const VARIANT = ${JSON.stringify(variant)};
const PER_WORD = ${PER_WORD};
const DATA = ${JSON.stringify(data)};
const state = Object.fromEntries(DATA.map(d => [d.word, { ok: new Set(), bad: new Set() }]));
const list = document.getElementById('list');

for (const d of DATA) {
  const s = document.createElement('section');
  s.innerHTML = '<h2><span>' + d.word + '</span><small data-count></small></h2><div class="grid"></div>';
  const grid = s.querySelector('.grid');
  for (let i = 0; i < PER_WORD; i++) {
    const img = d.images[i];
    if (!img) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'sem imagem'; grid.append(e); continue; }
    const t = document.createElement('div');
    t.className = 'tile';
    t.innerHTML = '<img alt="" loading="lazy" referrerpolicy="no-referrer"><button class="pick" type="button" aria-pressed="false" aria-label="Imagem ' + (i + 1) + ' de ' + d.word + '"></button><button class="flag" type="button" title="Imprópria: nudez, violência">Imprópria</button>';
    t.querySelector('img').src = img.thumb;
    t.querySelector('.pick').onclick = () => toggle(d.word, i, 'ok', t);
    t.querySelector('.flag').onclick = () => toggle(d.word, i, 'bad', t);
    grid.append(t);
  }
  list.append(s);
  d.section = s;
}

function toggle(word, i, kind, tile) {
  const set = state[word][kind];
  set.has(i) ? set.delete(i) : set.add(i);
  tile.classList.toggle(kind, set.has(i));
  tile.querySelector('.pick').setAttribute('aria-pressed', String(state[word].ok.has(i)));
  render();
}

function result() {
  const words = {};
  let hits = 0, improper = 0;
  for (const d of DATA) {
    const s = state[d.word];
    words[d.word] = { group: d.group, hits: s.ok.size, of: PER_WORD, improper: [...s.bad].sort((a, b) => a - b) };
    hits += s.ok.size; improper += s.bad.size;
  }
  return { variant: VARIANT, ratedAt: new Date().toLocaleDateString('sv-SE'), hits, of: DATA.length * PER_WORD, improper, words };
}

function render() {
  for (const d of DATA) d.section.querySelector('[data-count]').textContent = state[d.word].ok.size + '/' + PER_WORD + ' certeiras';
  const r = result();
  document.getElementById('total').textContent = 'Total: ' + r.hits + '/' + r.of + ' certeiras (' + Math.round(100 * r.hits / r.of) + '%) · impróprias: ' + r.improper;
}

document.getElementById('copy').onclick = async () => {
  const text = JSON.stringify(result());
  const out = document.getElementById('out');
  out.value = text;
  try { await navigator.clipboard.writeText(text); document.getElementById('copy').textContent = 'Copiado!'; }
  catch { out.style.display = 'block'; out.select(); }
};
render();
</script>
</body>
</html>
`
}

// One page for the three "after" variants: every distinct image per word, in a stable shuffled order,
// with no hint of which variant brought it. Each variant's score is computed from the same marks.
function blindPage(words, caches) {
  const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const data = words.map(({ word, group }) => {
    const seen = new Map()
    const variants = {}
    for (const v of AFTER) {
      variants[v] = (caches[v][word]?.images ?? []).map((img) => {
        if (!seen.has(img.id)) seen.set(img.id, img)
        return img.id
      })
    }
    // deterministic shuffle (by id hash) so the order does not reveal the variant
    const images = [...seen.values()].sort((a, b) => hash(a.id) - hash(b.id)).map(({ id, thumb }) => ({ id, thumb }))
    return { word, group, images, variants }
  })
  const total = data.reduce((n, d) => n + d.images.length, 0)
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Medição de imagens: depois</title>
<style>${style()}</style>
</head>
<body>
<main>
  <h1>Medição de imagens — depois (3 variantes juntas)</h1>
  <p class="help">${total} imagens, sem repetição: cada uma aparece uma vez, mesmo que mais de uma variante tenha trazido. A página não diz de qual variante veio cada imagem.
  Toque nas <strong>certeiras</strong> (alguém que não leu o título reconheceria a palavra). O que não for marcado conta como errada. <strong>Imprópria</strong> é só para nudez, violência ou algo ofensivo. No fim, "Copiar resultado" e cole na conversa.</p>
  <div id="list"></div>
</main>
<footer><div><span id="total"></span><button id="copy" type="button">Copiar resultado</button></div><textarea id="out" rows="6" readonly></textarea></footer>
<script>
const PER_WORD = ${PER_WORD};
const VARIANTS = ${JSON.stringify(AFTER)};
const DATA = ${JSON.stringify(data)};
const TOTAL = ${total};
const ok = new Set(), bad = new Set();
const list = document.getElementById('list');
for (const d of DATA) {
  const s = document.createElement('section');
  s.innerHTML = '<h2><span>' + d.word + '</span><small data-count></small></h2><div class="grid"></div>';
  const grid = s.querySelector('.grid');
  d.images.forEach((img, i) => {
    const t = document.createElement('div');
    t.className = 'tile';
    t.innerHTML = '<img alt="" loading="lazy" referrerpolicy="no-referrer"><button class="pick" type="button" aria-pressed="false" aria-label="Imagem ' + (i + 1) + ' de ' + d.word + '"></button><button class="flag" type="button">Imprópria</button>';
    t.querySelector('img').src = img.thumb;
    t.querySelector('.pick').onclick = () => toggle(ok, img.id, 'ok', t);
    t.querySelector('.flag').onclick = () => toggle(bad, img.id, 'bad', t);
    grid.append(t);
  });
  list.append(s);
  d.section = s;
}
function toggle(set, id, cls, tile) {
  set.has(id) ? set.delete(id) : set.add(id);
  tile.classList.toggle(cls, set.has(id));
  tile.querySelector('.pick').setAttribute('aria-pressed', String(ok.has(id)));
  render();
}
function result() {
  const out = { ratedAt: new Date().toLocaleDateString('sv-SE'), perWord: PER_WORD, variants: {}, words: {} };
  for (const v of VARIANTS) out.variants[v] = { hits: 0, of: DATA.length * PER_WORD, improper: 0 };
  for (const d of DATA) {
    const w = { group: d.group, marked: d.images.filter((i) => ok.has(i.id)).length, of: d.images.length };
    for (const v of VARIANTS) {
      const ids = d.variants[v];
      const hits = ids.filter((id) => ok.has(id)).length;
      const improper = ids.filter((id) => bad.has(id)).length;
      w[v] = hits;
      out.variants[v].hits += hits;
      out.variants[v].improper += improper;
    }
    w.improper = d.images.filter((i) => bad.has(i.id)).map((i) => i.id);
    out.words[d.word] = w;
  }
  return out;
}
function render() {
  for (const d of DATA) d.section.querySelector('[data-count]').textContent = d.images.filter((i) => ok.has(i.id)).length + '/' + d.images.length + ' marcadas';
  document.getElementById('total').textContent = 'Marcadas: ' + ok.size + ' de ' + TOTAL + ' · impróprias: ' + bad.size;
}
document.getElementById('copy').onclick = async () => {
  const text = JSON.stringify(result());
  const out = document.getElementById('out');
  out.value = text;
  try { await navigator.clipboard.writeText(text); document.getElementById('copy').textContent = 'Copiado!'; }
  catch { out.style.display = 'block'; out.select(); }
};
render();
</script>
</body>
</html>
`
}
