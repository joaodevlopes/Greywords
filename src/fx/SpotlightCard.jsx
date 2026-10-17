// List card with a glow that follows the mouse (spec 005, A5). CSS rewrite of the idea of
// Magic Card — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/magic-card
// The pointer only updates two CSS variables; the glow itself is a radial-gradient in fx.css.
// Mouse only: touch and pen never show it.

function track(e) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  el.style.setProperty('--gw-x', `${e.clientX - r.left}px`)
  el.style.setProperty('--gw-y', `${e.clientY - r.top}px`)
}

export default function SpotlightCard({ children, className = '' }) {
  return (
    <li className={`gw-fx-spot ${className}`.trim()} onPointerMove={track}>
      {children}
    </li>
  )
}
