// Count-up number (spec 005, A8). Rewritten with motion/react from the idea of
// Number Ticker — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/number-ticker
// The final value is in accessible text from the start; the counting digits are decorative.
import { useEffect, useRef } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { formatNumber } from './number.js'

export default function NumberTicker({ value, duration = 1.4 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduced = useReducedMotion()
  const final = formatNumber(value)

  useEffect(() => {
    const el = ref.current
    if (!el || !inView || reduced || value === 0) return undefined
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = formatNumber(v)
      },
    })
    return () => controls.stop()
  }, [inView, reduced, value, duration])

  return (
    <span className="gw-fx-ticker">
      <span className="gw-visually-hidden">{final}</span>
      {/* sized by the final value so the counting digits never shift the layout */}
      <span className="gw-fx-ticker-digits" aria-hidden="true">
        <span className="gw-fx-ticker-sizer">{final}</span>
        <span ref={ref} className="gw-fx-ticker-live">
          {reduced || value === 0 ? final : formatNumber(0)}
        </span>
      </span>
    </span>
  )
}
