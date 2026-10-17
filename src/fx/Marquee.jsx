// Infinite horizontal strip (spec 005, A7). CSS rewrite of the idea of
// Marquee — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/marquee
// The first copy is the real list; the second only fills the loop and is hidden from assistive tech.
// A visible pause button covers WCAG 2.2.2 (moving content can be stopped); hover also pauses.
import { useRef, useState } from 'react'
import { IconButton } from 'beds'
import { useOnScreen } from './useOnScreen.js'

export default function Marquee({ items, label, renderItem, duration = 40 }) {
  const ref = useRef(null)
  const onScreen = useOnScreen(ref)
  const [stopped, setStopped] = useState(false)
  const paused = stopped || !onScreen

  return (
    <div
      ref={ref}
      className="gw-fx-marquee"
      data-fx-paused={paused ? 'true' : undefined}
      style={{ '--gw-marquee-duration': `${duration}s` }}
    >
      <div className="gw-fx-marquee-viewport">
        <ul className="gw-fx-marquee-group gw-fx-loop" aria-label={label}>
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
        <ul className="gw-fx-marquee-group gw-fx-marquee-copy gw-fx-loop" aria-hidden="true">
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      </div>
      <span className="gw-fx-marquee-toggle">
        <IconButton
          label={stopped ? 'Continuar animação' : 'Pausar animação'}
          icon={stopped ? 'Play' : 'Pause'}
          onClick={() => setStopped((s) => !s)}
        />
      </span>
    </div>
  )
}
