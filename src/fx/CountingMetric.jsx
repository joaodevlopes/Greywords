// BEDS Metric that counts up when it first appears (spec 005, B6).
// The BEDS Metric animates only when numericValue *changes* (live metrics), so this mounts it at 0
// and moves to the real value on the next frame; the counting itself is BEDS's own animation.
// With less motion it starts at the real value.
import { useEffect, useState } from 'react'
import { Metric } from 'beds'
import { useReducedMotion } from 'motion/react'
import { formatNumber } from './number.js'

export default function CountingMetric({ label, value, format = formatNumber, description }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(reduced ? value : 0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value))
    return () => cancelAnimationFrame(id)
  }, [value])

  return <Metric label={label} value={format(shown)} numericValue={shown} formatValue={format} description={description} />
}
