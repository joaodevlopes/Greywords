// Short entrance when the app switches tabs (spec 005, B2). Rewritten with motion/react from the idea of
// Transition Panel — Julien Thibeaut, Motion Primitives, MIT — https://21st.dev/@ibelick/components/transition-panel
// Render it with key={tab}: the new tab mounts at once (no exit wait, so the click is never delayed)
// and fades/rises 8px in 180ms. With less motion it is a plain container.
import { motion, useReducedMotion } from 'motion/react'
import { EASE_OUT } from './variants.js'

export default function TabTransition({ children }) {
  const reduced = useReducedMotion()
  if (reduced) return <div>{children}</div>
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
      {children}
    </motion.div>
  )
}
