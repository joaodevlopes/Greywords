// Landing screenshots of the real app (spec 005, T6): Revisão, Progresso and Palavras, light and dark.
// Usage, with the dev server running:  node scripts/capture.mjs [baseUrl]   (default http://localhost:5180)
// Writes public/landing/<screen>-<theme>.webp. Example data comes from src/dev/demoState.js and lives
// only in the throwaway headless profile; images are the landing's own SVG illustrations.
// No "Vídeos" capture until a real catalog exists (the sample catalog has made-up numbers).
import { mkdirSync } from 'node:fs'
import sharp from 'sharp'
import { buildDemoState } from '../src/dev/demoState.js'
import { launchEdge, sleep } from './edge.mjs'

const BASE = (process.argv[2] ?? 'http://localhost:5180').replace(/\/$/, '')
const OUT = new URL('../public/landing/', import.meta.url)
const VIEW = { width: 1200, height: 760, scale: 2 }
const OUTPUT_WIDTH = 1600
const SCREENS = [
  { id: 'review', tab: 'review' },
  { id: 'progress', tab: 'progress' },
  { id: 'words', tab: 'dictionary' },
]

mkdirSync(OUT, { recursive: true })
const edge = await launchEdge({ width: VIEW.width, height: VIEW.height })

try {
  await edge.send('Emulation.setDeviceMetricsOverride', {
    width: VIEW.width,
    height: VIEW.height,
    deviceScaleFactor: VIEW.scale,
    mobile: false,
  })
  await edge.send('Emulation.setScrollbarsHidden', { hidden: true })
  // Captures show the final state of every effect.
  await edge.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })

  // 1. Borrow the landing's illustrations (word strip) as data: URIs for the example words.
  await edge.send('Page.navigate', { url: `${BASE}/#/` })
  await sleep(2000)
  const svgs = await edge.evaluate(`
    const out = {}
    for (const card of document.querySelectorAll('.gw-fx-marquee-group:not(.gw-fx-marquee-copy) .gw-strip-card')) {
      const svg = card.querySelector('svg').cloneNode(true)
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      out[card.querySelector('figcaption').textContent.trim()] = svg.outerHTML
    }
    return out`)
  const images = Object.fromEntries(
    Object.entries(svgs).map(([word, svg]) => [word, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`]),
  )
  const state = buildDemoState({ images })

  for (const theme of ['light', 'dark']) {
    const seed = await edge.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `localStorage.setItem('greywords:v1', ${JSON.stringify(JSON.stringify(state))});
               localStorage.setItem('greywords:theme', '${theme}');`,
    })
    for (const screen of SCREENS) {
      await edge.send('Page.navigate', { url: `${BASE}/?capture=${screen.id}-${theme}#/app` })
      await sleep(1800)
      const clicked = await edge.evaluate(`
        // the app's SegmentedControl renders one radio input per tab, valued by the tab id
        const find = () => document.querySelector('.gw-app-nav input[type="radio"][value="${screen.tab}"]')
        for (let i = 0; i < 25 && !find(); i++) await new Promise((r) => setTimeout(r, 200))
        const target = find()
        if (!target) return false
        target.click()
        await new Promise((r) => setTimeout(r, 900))
        scrollTo(0, 0)
        return true`)
      if (!clicked) throw new Error(`tab not found: ${screen.tab}`)
      const shot = await edge.send('Page.captureScreenshot', { format: 'png' })
      const file = new URL(`${screen.id}-${theme}.webp`, OUT)
      const info = await sharp(Buffer.from(shot.data, 'base64'))
        .resize({ width: OUTPUT_WIDTH })
        .webp({ quality: 80 })
        .toFile(file.pathname.replace(/^\/([A-Za-z]:)/, '$1'))
      console.log(`${screen.id}-${theme}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
    }
    await edge.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seed.identifier })
  }
  if (edge.errors.length) console.log('page errors:', edge.errors)
} finally {
  edge.close()
}
