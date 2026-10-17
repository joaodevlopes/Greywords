// B1 (spec 005): the review card turns over when the answer is revealed (R4.1).
// Inspired by the Flip Card of Animate UI (Elliot Sutton, MIT, https://21st.dev/@skyleen77/components/flip-card),
// rewritten as a half turn: the front turns to 90°, the content swaps, and the back comes from -90° to 0°.
// Only one face exists at a time, so faces of different heights never fight over the layout.
//
// `side` is where the card should be ('front' | 'back'); children(shown) draws the face being shown.
// Going to the back waits for the first half of the turn; going to the front (the next card) is
// immediate. The caller's state changes at once, so answers given mid-turn still count (R4.7).
// With less motion the swap is direct. onShown(side) runs once the face is on screen (to move focus).
import { useEffect, useRef, useState } from 'react'
import { motion, useAnimate, useReducedMotion } from 'motion/react'

const OUT = { duration: 0.14, ease: 'easeIn' }
const IN = { duration: 0.18, ease: 'easeOut' }

export default function FlipSwap({ side, className, onShown, children }) {
  const reduced = useReducedMotion()
  const [back, setBack] = useState(side === 'back')
  const [scope, animate] = useAnimate()
  const run = useRef(0)
  const shown = side === 'back' && back ? 'back' : 'front'

  useEffect(() => {
    const id = ++run.current
    if (side === 'front') {
      setBack(false)
      if (scope.current) animate(scope.current, { rotateY: 0 }, { duration: 0 })
      return
    }
    if (reduced) {
      setBack(true)
      return
    }
    ;(async () => {
      await animate(scope.current, { rotateY: 90 }, OUT)
      if (id !== run.current) return
      setBack(true)
      await animate(scope.current, { rotateY: [-90, 0] }, IN)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side])

  useEffect(() => {
    onShown?.(shown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown])

  return (
    <div className="gw-flip">
      <motion.div ref={scope} className={className} data-side={shown}>
        {children(shown)}
      </motion.div>
    </div>
  )
}
