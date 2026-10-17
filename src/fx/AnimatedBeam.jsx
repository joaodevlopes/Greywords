// Hub diagram with light beams flowing into the centre (spec 005, A12). Rewritten from the idea of
// Animated Beam — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/animated-beam
// Nodes sit at percentage coordinates of one shared box; the SVG uses the same coordinates (viewBox
// 0 0 100 h). The box keeps a fixed 100:h aspect ratio, so the stretch is uniform and the lines always
// meet the nodes without measuring. (No vector-effect: it breaks pathLength-based dashes.)
// The node list is real, readable HTML; the lines are decorative. Narrow screens get a plain list.
import { useRef } from 'react'
import { useOnScreen } from './useOnScreen.js'

const H = 56 // viewBox height for a 100-wide box (aspect 100:56)

function curve({ x, y }, c) {
  const mx = x + (c.x - x) / 2
  return `M ${x} ${y} C ${mx} ${y}, ${mx} ${c.y}, ${c.x} ${c.y}`
}

export default function AnimatedBeam({ nodes, center, label }) {
  const ref = useRef(null)
  const onScreen = useOnScreen(ref)
  const c = { x: 50, y: H / 2 }

  return (
    <div ref={ref} className="gw-fx-hub" data-fx-paused={onScreen ? undefined : 'true'}>
      <svg className="gw-fx-hub-lines" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {nodes.map((n, i) => (
          <g key={n.id}>
            <path className="gw-fx-hub-line" d={curve(n, c)} />
            <path
              className="gw-fx-hub-light gw-fx-loop"
              d={curve(n, c)}
              pathLength="100"
              style={{ animationDelay: `${-i * 0.55}s` }}
            />
          </g>
        ))}
      </svg>
      <div className="gw-fx-hub-center" style={{ left: '50%', top: '50%' }}>
        {center}
      </div>
      <ul className="gw-fx-hub-nodes" aria-label={label}>
        {nodes.map((n) => (
          <li key={n.id} className="gw-fx-hub-node" style={{ left: `${n.x}%`, top: `${(n.y / H) * 100}%` }}>
            <strong>{n.label}</strong>
            <span>{n.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
