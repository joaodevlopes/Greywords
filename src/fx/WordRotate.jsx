// Rotating word (spec 005, A3). Rewritten with motion/react from the idea of
// Word Rotate — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/word-rotate
// All words share one grid cell, so the slot is as wide as the longest word and nothing shifts.
// Decorative: callers keep the full sentence in accessible text and hide this with aria-hidden.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from './variants.js'

export default function WordRotate({ words, interval = 2200, paused = false }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced || paused || words.length < 2) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval)
    return () => clearInterval(id)
  }, [reduced, paused, words.length, interval])

  return (
    <span className="gw-fx-rotate">
      {words.map((w) => (
        <span key={w} className="gw-fx-rotate-sizer">
          {w}
        </span>
      ))}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={words[index]}
          className="gw-fx-rotate-word"
          initial={{ opacity: 0, y: '-0.35em' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '0.35em' }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
