import { useMemo } from 'react'
import { Metric } from 'beds'
import CountingMetric from '../fx/CountingMetric.jsx'
import { DAY, isDue, status } from '../srs.js'

// Counts up when the Progresso tab opens (spec 005, B6).
const formatPct = (v) => `${Math.round(v)}%`

// Word and review numbers (moved from the Dicionário to the Progresso tab in spec 001, R4.1).
export default function WordMetrics({ words, log }) {
  const stats = useMemo(() => {
    const list = Object.values(words)
    const since = Date.now() - 30 * DAY
    const recent = log.filter((r) => r.t >= since)
    const counts = { new: 0, learning: 0, mastered: 0 }
    for (const w of list) counts[status(w.srs).id] += 1
    return {
      total: list.length,
      due: list.filter((w) => isDue(w.srs)).length,
      ...counts,
      retention: recent.length ? Math.round((recent.filter((r) => r.q >= 3).length / recent.length) * 100) : null,
      reviews: recent.length,
    }
  }, [words, log])

  return (
    <div className="gw-metrics">
      <CountingMetric label="Palavras" value={stats.total} />
      <CountingMetric label="Para revisar hoje" value={stats.due} />
      <CountingMetric label="Aprendendo" value={stats.learning} />
      <CountingMetric label="Dominadas" value={stats.mastered} description="Intervalo de 21 dias ou mais" />
      {stats.retention === null ? (
        <Metric label="Acerto em 30 dias" value="—" description="Nenhuma revisão ainda" />
      ) : (
        <CountingMetric
          label="Acerto em 30 dias"
          value={stats.retention}
          format={formatPct}
          description={`${stats.reviews} revisões`}
        />
      )}
    </div>
  )
}
