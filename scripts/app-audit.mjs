// App audit (spec 005, T10): per tab, text contrast against the effective background, tab transition
// state right after the click and later, metric values, overflow and header position. With example data.
//   node scripts/app-audit.mjs http://localhost:5180 <light|dark> [reduced|mobile]
import { launchEdge, sleep } from './edge.mjs'
import { buildDemoState } from '../src/dev/demoState.js'

const [base, theme, mode] = process.argv.slice(2)
const state = buildDemoState({ images: {} })
const edge = await launchEdge()
const out = { theme, mode: mode ?? 'desktop' }
try {
  if (mode === 'mobile') await edge.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true })
  else await edge.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 860, deviceScaleFactor: 1, mobile: false })
  if (mode === 'reduced') await edge.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await edge.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('greywords:v1', ${JSON.stringify(JSON.stringify(state))}); localStorage.setItem('greywords:theme', '${theme}');`,
  })
  await edge.send('Page.navigate', { url: `${base}/#/app` })
  await sleep(2000)
  const contrastFn = `
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const ctx = cv.getContext('2d', { willReadFrequently: true })
    const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    const over = (t, u) => { const a = t[3]; return [0, 1, 2].map((i) => t[i] * a + u[i] * (1 - a)).concat(1) }
    const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
    const bgOf = (el) => { const st = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) { st.push(c); if (c[3] >= 1) break } } let bg = [255, 255, 255, 1]; if (st.length && st[st.length - 1][3] >= 1) bg = st.pop(); while (st.length) bg = over(st.pop(), bg); return bg }
    const fails = []; let checked = 0; const seen = new Set()
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (w.nextNode()) { const t = w.currentNode, el = t.parentElement
      if (!t.textContent.trim() || seen.has(el) || el.closest('[aria-hidden="true"], .gw-visually-hidden, svg, input, [disabled]')) continue
      seen.add(el); const st = getComputedStyle(el); const r = el.getBoundingClientRect()
      if (st.visibility === 'hidden' || !r.width || parseFloat(st.opacity) < 0.5) continue
      let hid = false, dim = false; for (let n = el; n; n = n.parentElement) { const s2 = getComputedStyle(n); if (s2.display === 'none') { hid = true; break } if (parseFloat(s2.opacity) < 1) dim = true }
      if (hid || dim) continue
      const bg = bgOf(el), fg = over(rgba(st.color), bg); const size = parseFloat(st.fontSize), bold = parseInt(st.fontWeight) >= 700
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5; const r2 = ratio(fg, bg); checked++
      if (r2 < need) fails.push([t.textContent.trim().slice(0, 30), el.className.toString().slice(0, 50), +r2.toFixed(2)]) }
    return { checked, fails: fails.slice(0, 10) }`
  out.tabs = {}
  for (const tab of ['search', 'dictionary', 'review', 'videos', 'progress']) {
    out.tabs[tab] = await edge.evaluate(`
      const input = document.querySelector('.gw-app-nav input[value="${tab}"]'); input.click()
      const panel = () => document.querySelector('.gw-app-main > div')
      const t0 = performance.now(); await new Promise((r) => requestAnimationFrame(() => r()))
      const early = { opacity: getComputedStyle(panel()).opacity, ms: Math.round(performance.now() - t0) }
      await new Promise((r) => setTimeout(r, 120))
      const metricsEarly = [...document.querySelectorAll('.gw-metrics, .gw-week-foot')].length ? document.querySelector('.gw-app-main').innerText.match(/Palavras\\n(\\d+)/)?.[1] : null
      await new Promise((r) => setTimeout(r, 1500))
      const late = getComputedStyle(panel()).opacity
      const c = await (async () => { ${contrastFn} })()
      return { early, late, metricsEarly, metricsLate: document.querySelector('.gw-app-main').innerText.match(/Palavras\\n(\\d+)/)?.[1] ?? null, contrast: c, overflowX: document.documentElement.scrollWidth > innerWidth, headerPos: getComputedStyle(document.querySelector('.gw-app-header')).position }`)
  }
  if (edge.errors.length) out.errors = edge.errors
} finally {
  edge.close()
}
console.log(JSON.stringify(out, null, 1))
