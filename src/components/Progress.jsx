import { useState } from 'react'
import { Badge, Button, Dialog, Notice, ProgressBar, SegmentedControl, Surface, Text } from 'beds'
import MonthCalendar from './MonthCalendar.jsx'
import CountingMetric from '../fx/CountingMetric.jsx'
import WordMetrics from './WordMetrics.jsx'
import { currentStreak, dayKey, MAX_GOAL, MIN_GOAL, mondayOf, weekSummary } from '../progress.js'

// Progresso tab (spec 001): goal, current week, today, calendar, word metrics.

const GOAL_OPTIONS = Array.from({ length: MAX_GOAL - MIN_GOAL + 1 }, (_, i) => {
  const n = String(MIN_GOAL + i)
  return { id: n, label: n }
})
const DEFAULT_GOAL = 4

function GoalPicker({ value, onChange }) {
  return <SegmentedControl label="Dias por semana" value={value} options={GOAL_OPTIONS} onChange={onChange} />
}

export default function Progress({ state, onSetGoal, onToggleCheckin }) {
  const today = dayKey()
  const hasGoal = state.goals.length > 0
  const week = weekSummary(state, mondayOf(today))
  const streak = currentStreak(state, today)

  return (
    <section className="gw-progress" aria-label="Progresso">
      {hasGoal ? (
        <WeekBlock week={week} streak={streak} onSetGoal={onSetGoal} />
      ) : (
        <GoalQuestion onSetGoal={onSetGoal} />
      )}
      <TodayBlock
        countsByActivity={state.activityDays.includes(today)}
        checkedIn={state.checkinDays.includes(today)}
        onToggleCheckin={onToggleCheckin}
      />
      <Surface role="panel">
        <MonthCalendar state={state} today={today} />
      </Surface>
      <div className="gw-progress-block">
        <h2 className="gw-progress-title">Suas palavras</h2>
        <WordMetrics words={state.words} log={state.log} />
      </div>
    </section>
  )
}

// R1.1, R1.2 — asked while there is no goal
function GoalQuestion({ onSetGoal }) {
  const [draft, setDraft] = useState(String(DEFAULT_GOAL))
  return (
    <Surface role="panel">
      <div className="gw-progress-block">
        <h2 className="gw-progress-title">Quantos dias por semana você quer estudar?</h2>
        <Text tone="secondary">
          Conta qualquer dia em que você revisar, salvar uma palavra ou marcar que estudou. Dá para mudar depois.
        </Text>
        <GoalPicker value={draft} onChange={setDraft} />
        <div>
          <Button label="Definir meta" variant="primary" onClick={() => onSetGoal(Number(draft))} />
        </div>
      </div>
    </Surface>
  )
}

// R1.3–R1.6, R3.6 — progress of the current week, never a scolding message
function WeekBlock({ week, streak, onSetGoal }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(week.goal))

  function openEditor() {
    setDraft(String(week.goal))
    setEditing(true)
  }

  return (
    <Surface role="panel">
      <div className="gw-progress-block">
        <div className="gw-week-head">
          <h2 className="gw-progress-title">Esta semana</h2>
          {week.met && <Badge label="Meta cumprida" tone="success" purpose="status" />}
        </div>
        <ProgressBar
          label={`${week.count} de ${week.goal} ${week.goal === 1 ? 'dia' : 'dias'}`}
          value={Math.min(week.count, week.goal)}
          max={week.goal}
          tone="brand"
        />
        <div className="gw-week-foot">
          <CountingMetric
            label="Semanas seguidas"
            value={streak}
            description={streak === 1 ? 'semana com a meta cumprida' : 'semanas com a meta cumprida'}
          />
          <Button label="Mudar meta" variant="ghost" compact icon="Settings2" onClick={openEditor} />
        </div>
      </div>

      {editing && (
        <Dialog
          open
          onOpenChange={(o) => !o && setEditing(false)}
          title="Mudar meta semanal"
          description="Vale a partir desta semana. As semanas anteriores continuam com a meta que tinham."
          actions={
            <>
              <Button label="Cancelar" variant="secondary" onClick={() => setEditing(false)} />
              <Button
                label="Salvar meta"
                variant="primary"
                onClick={() => {
                  onSetGoal(Number(draft))
                  setEditing(false)
                }}
              />
            </>
          }
        >
          <GoalPicker value={draft} onChange={setDraft} />
        </Dialog>
      )}
    </Surface>
  )
}

// R2.2–R2.4 — manual check-in for today, or a note when app activity already counts
function TodayBlock({ countsByActivity, checkedIn, onToggleCheckin }) {
  if (countsByActivity) {
    return <Notice tone="success" title="Hoje já conta" description="Você revisou ou salvou palavras hoje." />
  }
  return (
    <Surface role="subtle">
      <div className="gw-today">
        {checkedIn ? (
          <>
            <Text>Check-in de hoje feito.</Text>
            <Button label="Desfazer" variant="ghost" compact onClick={onToggleCheckin} />
          </>
        ) : (
          <>
            <Text tone="secondary">Estudou inglês fora do app hoje? Vídeo, série, aula: vale.</Text>
            <Button label="Estudei hoje" variant="primary" icon="Check" onClick={onToggleCheckin} />
          </>
        )}
      </div>
    </Surface>
  )
}
