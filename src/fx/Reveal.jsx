// Scroll reveal (spec 005, A4). Rewritten with motion/react from the ideas of
// Blur Fade — Dillion Verma, Magic UI, MIT — https://21st.dev/@dillionverma/components/blur-fade
// In View — Julien Thibeaut, Motion Primitives, MIT — https://21st.dev/@ibelick/components/in-view
import { motion, useReducedMotion } from 'motion/react'
import { revealVariants } from './variants.js'

export default function Reveal({ children, className, delay = 0 }) {
  const reduced = useReducedMotion()
  const variants = revealVariants(reduced, { delay })
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
