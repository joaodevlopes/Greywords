import { useState } from 'react'
import { Badge, Icon, Tabs } from 'beds'
import BorderBeam from '../fx/BorderBeam.jsx'
import { grade, intervalLabel, newCard } from '../srs.js'
import { DEMO_TILES } from './Scenes.jsx'

const picked = DEMO_TILES.filter((t) => t.pick).sort((a, b) => a.pick - b.pick)

// Interval previews come from the real scheduler, so the demo never shows a made-up number.
const fresh = newCard()
const GRADES = [
  ['Errei', 1],
  ['Difícil', 3],
  ['Bom', 4],
  ['Fácil', 5],
].map(([label, q]) => ({ label, next: intervalLabel(grade(fresh, q).interval) }))

function SearchStep() {
  return (
    <div className="gw-demo-step">
      <div className="gw-demo-field" aria-hidden="true">
        <Icon name="Search" purpose="action" />
        <span>sun</span>
      </div>
      <ul className="gw-demo-grid" role="list">
        {DEMO_TILES.map(({ id, label, Scene, pick }) => (
          <li key={id} className={`gw-demo-tile ${pick ? 'is-picked' : ''}`}>
            <Scene />
            {pick > 0 && (
              <span className="gw-demo-badge" aria-hidden="true">
                {pick}
              </span>
            )}
            <span className="gw-visually-hidden">
              {label}
              {pick ? `, escolhida em ${pick}º` : ''}
            </span>
          </li>
        ))}
      </ul>
      <p className="gw-demo-caption">
        Você escolhe as 3 imagens que mais lembram a palavra. A lua e a luminária ficam de fora.
      </p>
    </div>
  )
}

function FrontStep() {
  return (
    <div className="gw-demo-step">
      <ul className="gw-demo-front" role="list">
        {picked.map(({ id, label, Scene }) => (
          <li key={id}>
            <Scene />
            <span className="gw-visually-hidden">{label}</span>
          </li>
        ))}
      </ul>
      <div className="gw-demo-field is-guess" aria-hidden="true">
        <span>Qual é a palavra?</span>
      </div>
      <p className="gw-demo-caption">Na revisão, as suas imagens aparecem primeiro. Nada de português na frente do cartão.</p>
    </div>
  )
}

function AnswerStep() {
  return (
    <div className="gw-demo-step">
      <div className="gw-demo-answer">
        <p className="gw-demo-word">
          sun <span>/sʌn/</span>
        </p>
        <Badge label="noun" purpose="tag" />
        <p className="gw-demo-def">The star that is closest to the Earth.</p>
      </div>
      <ul className="gw-demo-grades" role="list">
        {GRADES.map((g) => (
          <li key={g.label}>
            <span className="gw-demo-grade">{g.label}</span>
            <span className="gw-demo-next">{g.next}</span>
          </li>
        ))}
      </ul>
      <p className="gw-demo-caption">
        Sua nota decide quando a palavra volta. Errou? Ela reaparece na mesma sessão.
      </p>
    </div>
  )
}

export default function ProductDemo() {
  const [tab, setTab] = useState('search')
  return (
    <figure className="gw-demo" aria-labelledby="gw-demo-title">
      <div className="gw-demo-top">
        <h2 id="gw-demo-title">
          <Icon name="Image" purpose="action" />
          Como fica uma palavra no Greywords
        </h2>
        <span>Exemplo ilustrativo</span>
      </div>
      <div className="gw-demo-body">
        <Tabs
          label="Etapas do exemplo"
          variant="settings"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'search', label: '1. Buscar', content: <SearchStep /> },
            { id: 'front', label: '2. Revisar', content: <FrontStep /> },
            { id: 'answer', label: '3. Responder', content: <AnswerStep /> },
          ]}
        />
      </div>
      <BorderBeam />
    </figure>
  )
}
