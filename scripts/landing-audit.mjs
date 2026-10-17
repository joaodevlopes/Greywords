// Full landing audit (spec 005, T9): scroll + loop pause states, CLS, text contrast against the effective
// background, keyboard Tab walk and the Chromium accessibility tree. Run against a server (dev or preview):
//   node scripts/landing-audit.mjs http://localhost:4180 <light|dark> <desktop|mobile> [reduced]
import { launchEdge, sleep } from './edge.mjs'

const [base, theme, view, reducedFlag] = process.argv.slice(2)
const reduced = reducedFlag === 'reduced'
const edge = await launchEdge()
const out = { theme, view, reduced }
try {
  if (view === 'mobile') await edge.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true })
  else await edge.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 860, deviceScaleFactor: 1, mobile: false })
  if (reduced) await edge.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await edge.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('greywords:theme', '${theme}');
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map((s) => s.node && (s.node.className || s.node.nodeName)).join(',')]) } }).observe({ type: 'layout-shift', buffered: true });`,
  })
  await edge.send('Page.navigate', { url: `${base}/#/` })
  await sleep(2500)

  // 1. Scroll the whole page slowly (reveals, tickers), then check loop pause states at the bottom.
  out.scroll = await edge.evaluate(`
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await sleep(220) }
    await sleep(1500)
    const loops = [...document.querySelectorAll('.gw-fx-loop')].map((el) => {
      const r = el.getBoundingClientRect()
      const near = r.bottom > -150 && r.top < innerHeight + 150
      const st = getComputedStyle(el), sb = getComputedStyle(el, '::before')
      const anim = st.animationName !== 'none' ? st : sb
      return { near, name: anim.animationName, state: anim.animationPlayState }
    })
    const hidden = [...document.querySelectorAll('main section')].filter((s) => {
      const c = s.querySelector(':scope > div, :scope > ul, :scope > .gw-fx-marquee') ; return c && getComputedStyle(c).opacity !== '1'
    }).map((s) => s.id || s.className)
    const stuckTransforms = [...document.querySelectorAll('[style*="transform"]')].filter((e) => !/transform: none|translateX\\(0|transform: translate\\(-50%, -50%\\)/.test(e.getAttribute('style')) && !e.closest('.gw-fx-rotate') && !e.closest('.es-root .es-segmented-control')).map((e) => e.className + ' :: ' + e.getAttribute('style')).slice(0, 8)
    return {
      height: document.body.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth,
      offscreenRunning: loops.filter((l) => !l.near && l.name !== 'none' && l.state === 'running').length,
      offscreenTotal: loops.filter((l) => !l.near).length,
      loopsAnimated: loops.filter((l) => l.name !== 'none').length,
      sectionsNotVisible: hidden,
      tickers: [...document.querySelectorAll('.gw-fx-ticker-live')].map((e) => e.textContent),
      stuckTransforms,
      cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 6),
      brokenImages: [...document.querySelectorAll('img')].filter((i) => getComputedStyle(i).display !== 'none' && i.complete && !i.naturalWidth).map((i) => i.src),
    }`)

  // 2. Contrast of every visible text element against its effective background.
  out.contrast = await edge.evaluate(`
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const ctx = cv.getContext('2d', { willReadFrequently: true })
    const rgba = (c) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
    const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1) }
    const lum = ([r, g, b]) => [r, g, b].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
    const bgOf = (el) => {
      const stack = []
      for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break } }
      let bg = [255, 255, 255, 1]
      if (stack.length && stack[stack.length - 1][3] >= 1) bg = stack.pop()
      while (stack.length) bg = over(stack.pop(), bg)
      return bg
    }
    const fails = []; let checked = 0
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const seen = new Set()
    while (walker.nextNode()) {
      const t = walker.currentNode; const el = t.parentElement
      if (!t.textContent.trim() || seen.has(el) || el.closest('[aria-hidden="true"], .gw-visually-hidden, svg, .gw-fx-shot, .gw-fx-rotate-sizer, .gw-fx-ticker-sizer')) continue
      seen.add(el)
      const st = getComputedStyle(el); const r = el.getBoundingClientRect()
      if (st.visibility === 'hidden' || r.width === 0 || st.display === 'none') continue
      let hiddenAncestor = false; for (let n = el; n; n = n.parentElement) if (getComputedStyle(n).display === 'none') { hiddenAncestor = true; break }
      if (hiddenAncestor) continue
      const fg = over(rgba(st.color), bgOf(el)); const bg = bgOf(el)
      const size = parseFloat(st.fontSize); const bold = parseInt(st.fontWeight) >= 700
      const large = size >= 24 || (bold && size >= 18.66)
      const need = large ? 3 : 4.5
      const r2 = ratio(fg, bg); checked++
      if (r2 < need) fails.push([t.textContent.trim().slice(0, 40), el.className.toString().slice(0, 40), +r2.toFixed(2), need])
    }
    return { checked, fails: fails.slice(0, 15) }`)

  // 3. Keyboard: Tab through the page; every stop must show a focus indicator and not hide under the header.
  await edge.evaluate('scrollTo(0, 0); document.activeElement && document.activeElement.blur(); return 1')
  const stops = []
  for (let i = 0; i < 70; i++) {
    await edge.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await edge.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
    await sleep(120)
    stops.push(await edge.evaluate(`
      const el = document.activeElement; if (!el || el === document.body) return null
      const st = getComputedStyle(el); const r = el.getBoundingClientRect()
      const ring = (st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) > 0) || st.boxShadow !== 'none'
      const header = document.querySelector('.gw-landing-header').getBoundingClientRect()
      const underHeader = !el.closest('.gw-landing-header') && r.top < header.bottom - 2
      return { tag: el.tagName, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), ring, underHeader, inView: r.bottom > 0 && r.top < innerHeight }`))
  }
  const real = stops.filter(Boolean)
  out.keyboard = {
    stops: real.length,
    noRing: real.filter((s) => !s.ring).map((s) => s.tag + ' ' + s.text),
    underHeader: real.filter((s) => s.underHeader).map((s) => s.tag + ' ' + s.text),
    outOfView: real.filter((s) => !s.inView).map((s) => s.tag + ' ' + s.text),
    order: real.slice(0, 40).map((s) => s.text),
  }

  // 4. Accessibility tree (real Chromium): the h1 name and section headings.
  await edge.send('Accessibility.enable')
  const ax = await edge.send('Accessibility.getFullAXTree')
  const headings = ax.nodes.filter((n) => n.role?.value === 'heading').map((n) => {
    const level = n.properties?.find((p) => p.name === 'level')?.value?.value
    return `h${level} ${n.name?.value}`
  })
  out.a11y = { headings: headings.slice(0, 30) }
  if (edge.errors.length) out.errors = edge.errors
} finally {
  edge.close()
}
console.log(JSON.stringify(out, null, 2))
