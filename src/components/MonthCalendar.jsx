import { useState } from 'react'
import { Button, IconButton } from 'beds'
import { addDays, mondayOf, monthGrid, parseDay, studiedDays, weekSummary } from '../progress.js'

// Month grid of studied days (spec 001, R3). BEDS has no month calendar, so this is app-owned (gw-cal-*).

const WEEKDAYS = [
  ['Seg', 'segunda-feira'],
  ['Ter', 'terça-feira'],
  ['Qua', 'quarta-feira'],
  ['Qui', 'quinta-feira'],
  ['Sex', 'sexta-feira'],
  ['Sáb', 'sábado'],
  ['Dom', 'domingo'],
]

const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const dayTitle = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long' })

export default function MonthCalendar({ state, today }) {
  const now = parseDay(today)
  const current = { year: now.getFullYear(), month: now.getMonth() }
  const [view, setView] = useState(current)

  const isCurrent = view.year === current.year && view.month === current.month
  const shift = (delta) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const studied = studiedDays(state)
  const thisMonday = mondayOf(today)
  const weeks = monthGrid(view.year, view.month)

  return (
    <div className="gw-cal">
      <div className="gw-cal-nav">
        <IconButton label="Mês anterior" icon="ArrowLeft" onClick={() => shift(-1)} />
        <h2 className="gw-cal-title" aria-live="polite">
          {monthTitle.format(new Date(view.year, view.month, 1))}
        </h2>
        <IconButton label="Próximo mês" icon="ArrowRight" onClick={() => shift(1)} disabled={isCurrent} />
        <span className="gw-cal-today-btn">
          {!isCurrent && <Button label="Hoje" variant="ghost" compact onClick={() => setView(current)} />}
        </span>
      </div>

      <table className="gw-cal-table">
        <caption className="gw-visually-hidden">
          Dias estudados em {monthTitle.format(new Date(view.year, view.month, 1))}
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map(([short, full]) => (
              <th key={short} scope="col" abbr={full}>
                {short}
              </th>
            ))}
            <th scope="col" className="gw-cal-week-col">
              Semana
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => {
            const summary = weekSummary(state, week.monday, studied)
            const future = week.monday > thisMonday
            return (
              <tr key={week.monday}>
                {week.days.map((key, i) => {
                  // days of the neighbouring month are shown dimmed so the week total matches what is visible
                  const k = key ?? addDays(week.monday, i)
                  return <DayCell key={k} dayKeyValue={k} studied={studied.has(k)} today={today} outside={!key} />
                })}
                <td className="gw-cal-week-col">{future ? null : <WeekResult summary={summary} />}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function DayCell({ dayKeyValue, studied, today, outside }) {
  const date = parseDay(dayKeyValue)
  const isToday = dayKeyValue === today
  const isFuture = dayKeyValue > today
  const label = [dayTitle.format(date), studied ? 'estudado' : isFuture ? null : 'sem estudo', isToday ? 'hoje' : null]
    .filter(Boolean)
    .join(', ')
  const cls = ['gw-cal-day', studied && 'is-studied', isToday && 'is-today', isFuture && 'is-future', outside && 'is-outside'].filter(Boolean).join(' ')
  return (
    <td>
      <span className={cls} aria-label={label} role="img">
        {date.getDate()}
      </span>
    </td>
  )
}

function WeekResult({ summary }) {
  const { count, goal, met } = summary
  if (goal === null) {
    return (
      <span className="gw-cal-week" aria-label={`${count} ${count === 1 ? 'dia estudado' : 'dias estudados'}, sem meta`}>
        {count}
      </span>
    )
  }
  return (
    <span
      className={`gw-cal-week ${met ? 'is-met' : ''}`}
      aria-label={`${count} de ${goal} dias${met ? ', meta cumprida' : ''}`}
    >
      {count}/{goal}
      {met && <span aria-hidden="true"> ✓</span>}
    </span>
  )
}
