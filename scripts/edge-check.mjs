// Headless Edge check for the landing/app (spec 005). The Claude Browser pane freezes animations
// while hidden, so effects are verified here. Usage (with the dev server running):
//   node scripts/edge-check.mjs <url> <script.js> [reduced|mobile|hover]
//   SHOT=out.png node scripts/edge-check.mjs ...   (also saves a screenshot)
// <script.js> is the body of an async function evaluated in the page; its return value is printed.
import { readFileSync, writeFileSync } from 'node:fs'
import { launchEdge, sleep } from './edge.mjs'

const [url, scriptPath, mode] = process.argv.slice(2)
if (!url || !scriptPath) {
  console.error('usage: node scripts/edge-check.mjs <url> <script.js> [reduced|mobile|hover]')
  process.exit(1)
}

const edge = await launchEdge()
try {
  if (mode === 'reduced') await edge.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  if (mode === 'mobile') await edge.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true })
  await edge.send('Page.navigate', { url })
  await sleep(2500)

  if (mode === 'hover') {
    const [x, y] = await edge.evaluate(`
      const li = document.querySelector('.gw-benefits li')
      li.scrollIntoView({ block: 'center' })
      await new Promise((r) => setTimeout(r, 1500))
      const r = li.getBoundingClientRect()
      return [r.x + 60, r.y + 40]`)
    await edge.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, pointerType: 'mouse' })
    await sleep(500)
  }

  console.log(JSON.stringify(await edge.evaluate(readFileSync(scriptPath, 'utf8')), null, 2))
  if (process.env.SHOT) {
    const shot = await edge.send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(process.env.SHOT, Buffer.from(shot.data, 'base64'))
  }
  if (edge.errors.length) console.log('ERRORS:', edge.errors)
} finally {
  edge.close()
}
