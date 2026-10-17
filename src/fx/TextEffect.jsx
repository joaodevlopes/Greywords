// Word-by-word entrance (spec 005, A2). Rewritten with motion/react from the idea of
// Text Effect — Julien Thibeaut, Motion Primitives, MIT — https://21st.dev/@ibelick/components/text-effect
// Renders only inline spans: the caller owns the heading element. Words keep real spaces between
// them, so screen readers read the sentence normally.
import { Fragment } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { splitWords, textVariants } from './variants.js'

// items: a string (split into words) or an array mixing words and React nodes (e.g. <WordRotate />).
// inherit: inside a <Reveal>, follow its hidden/visible state instead of animating on mount.
// (A second whileInView nested in Reveal's whileInView left both stuck at opacity 0.)
export default function TextEffect({ items, delay = 0, inherit = false }) {
  const reduced = useReducedMotion()
  const { container, item } = textVariants(reduced, { delay })
  const parts = typeof items === 'string' ? splitWords(items) : items

  return (
    <motion.span
      className="gw-fx-text"
      variants={container}
      initial={inherit ? undefined : 'hidden'}
      animate={inherit ? undefined : 'visible'}
    >
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <motion.span className="gw-fx-text-word" variants={item}>
            {part}
          </motion.span>
        </Fragment>
      ))}
    </motion.span>
  )
}
