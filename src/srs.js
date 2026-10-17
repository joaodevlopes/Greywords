// SM-2 spaced repetition (same family as Anki).
// Grades: 1 = errei, 3 = difícil, 4 = bom, 5 = fácil.

export const DAY = 86_400_000
export const MASTERED_DAYS = 21

export function startOfDay(t = Date.now()) {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function newCard() {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: startOfDay() }
}

export function grade(card, q, now = Date.now()) {
  let { ease, interval, reps, lapses } = card
  if (q < 3) {
    reps = 0
    interval = 0
    lapses += 1
  } else {
    // SM-2 steps, with Anki-style spread so hard/good/easy give different intervals
    if (reps === 0) interval = q === 5 ? 4 : 1
    else if (reps === 1) interval = q === 3 ? 4 : q === 4 ? 6 : 8
    else interval = Math.max(interval + 1, Math.round(interval * (q === 3 ? 1.2 : q === 5 ? ease * 1.3 : ease)))
    reps += 1
  }
  ease = Math.max(1.3, ease + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // interval 0 = see it again in this same session
  const due = interval === 0 ? now : startOfDay(now) + interval * DAY
  return { ease: Math.round(ease * 100) / 100, interval, reps, lapses, due }
}

export const isDue = (card, now = Date.now()) => card.due <= now

export function status(card) {
  if (card.reps === 0) return { id: 'new', label: 'Nova' }
  if (card.interval < MASTERED_DAYS) return { id: 'learning', label: 'Aprendendo' }
  return { id: 'mastered', label: 'Dominada' }
}

export function intervalLabel(days) {
  if (days === 0) return 'agora'
  if (days === 1) return '1 dia'
  if (days < 30) return `${days} dias`
  const months = Math.round(days / 30)
  return months === 1 ? '1 mês' : `${months} meses`
}

export function dueLabel(due) {
  const days = Math.round((startOfDay(due) - startOfDay()) / DAY)
  if (days <= 0) return 'hoje'
  if (days === 1) return 'amanhã'
  return `em ${intervalLabel(days)}`
}
