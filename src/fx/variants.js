// Motion variants shared by the effects. Pure, so the reduced-motion rule (R5.1) is tested.

export const EASE_OUT = [0.16, 1, 0.3, 1]

// Scroll reveal (A4): blur + small rise + fade. With less motion, only the fade remains.
// Word-by-word entrance (A2): the container staggers its children. Less motion: everything at once.
export function textVariants(reduced, { stagger = 0.06, delay = 0 } = {}) {
  if (reduced) {
    return {
      container: { hidden: {}, visible: {} },
      item: { hidden: { opacity: 1 }, visible: { opacity: 1 } },
    }
  }
  return {
    container: { hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } },
    item: {
      hidden: { opacity: 0, y: '0.3em', filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: EASE_OUT } },
    },
  }
}

// Splits a sentence into display words, keeping punctuation attached ("vendo," stays one word).
export function splitWords(text) {
  return text.trim().split(/\s+/).filter(Boolean)
}

// The delay lives in the variant because a variant's transition overrides the component's.
export function revealVariants(reduced, { y = 8, blur = 6, delay = 0 } = {}) {
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.2, delay } },
    }
  }
  return {
    hidden: { opacity: 0, y, filter: `blur(${blur}px)` },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE_OUT, delay } },
  }
}
