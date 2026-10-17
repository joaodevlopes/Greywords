import { useEffect, useState } from 'react'

// True while the element is in (or near) the viewport and the tab is visible.
// Containers of CSS loops pass the result to data-fx-paused so loops stop off-screen (R5.3).
export function useOnScreen(ref, rootMargin = '120px') {
  const [intersecting, setIntersecting] = useState(true)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), { rootMargin })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return intersecting && visible
}
