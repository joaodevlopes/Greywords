// Short confetti burst (spec 005, B5), from the idea of
// Confetti — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/confetti
// which wraps canvas-confetti (ISC). Colours come from the palette; with less motion the library
// draws nothing (disableForReducedMotion) and only the message on screen remains.
import confetti from 'canvas-confetti'

let last = 0

function paletteColors() {
  const css = getComputedStyle(document.documentElement)
  const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback
  return [read('--gw-brand', '#e8590c'), read('--gw-terracotta', '#9c3d1b'), read('--gw-cta-bg', '#b4430a'), '#ffd23f', '#fff1c9']
}

export function celebrate() {
  const now = Date.now()
  // two events at once (last review that also meets the goal) give one burst
  if (now - last < 1500) return
  last = now
  const colors = paletteColors()
  const base = { particleCount: 60, spread: 65, startVelocity: 42, ticks: 140, scalar: 0.9, colors, disableForReducedMotion: true }
  confetti({ ...base, angle: 60, origin: { x: 0, y: 0.75 } })
  confetti({ ...base, angle: 120, origin: { x: 1, y: 0.75 } })
}
