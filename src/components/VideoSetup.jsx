import { useState } from 'react'
import { Button, Checkbox, SegmentedControl, Surface, Text } from 'beds'
import { USER_LEVELS } from '../videos.js'

// First-time (and "Ajustar") setup: niches and the user's own level (spec 002, R1, R4).
export default function VideoSetup({ niches, initialNiches, initialLevel, onSave, onCancel }) {
  const [picked, setPicked] = useState(() => new Set(initialNiches))
  const [level, setLevel] = useState(initialLevel ?? 'intermediate')

  const toggle = (id, on) =>
    setPicked((p) => {
      const next = new Set(p)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  return (
    <Surface role="panel">
      <div className="gw-progress-block">
        <h2 className="gw-progress-title">Do que você gosta?</h2>
        <Text tone="secondary">Escolha os assuntos. A lista mostra só vídeos desses nichos, com legenda em inglês.</Text>
        <fieldset className="gw-video-niches">
          <legend className="gw-visually-hidden">Nichos</legend>
          {niches.map((n) => (
            <Checkbox key={n.id} label={n.label} checked={picked.has(n.id)} onChange={(on) => toggle(n.id, on)} />
          ))}
        </fieldset>
        <div className="gw-progress-block">
          <Text variant="label">Seu nível de inglês</Text>
          <SegmentedControl
            label="Seu nível de inglês"
            value={level}
            options={USER_LEVELS.map(({ id, label }) => ({ id, label }))}
            onChange={setLevel}
          />
        </div>
        <div className="gw-video-setup-actions">
          <Button
            label="Ver vídeos"
            variant="primary"
            disabled={picked.size === 0}
            onClick={() => onSave([...picked], level)}
          />
          {onCancel && <Button label="Cancelar" variant="ghost" onClick={onCancel} />}
          {picked.size === 0 && <Text tone="secondary">Escolha pelo menos um nicho.</Text>}
        </div>
      </div>
    </Surface>
  )
}
