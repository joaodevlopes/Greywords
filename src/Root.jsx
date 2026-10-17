import { useEffect, useState } from 'react'
import { DesignSystemProvider } from 'beds'
import App from './App.jsx'
import Landing from './landing/Landing.jsx'

export const BRAND_COLOR = '#e8590c'
const THEME_KEY = 'greywords:theme'
const LEGACY_THEME_KEY = 'lexi:theme'

function initialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage blocked: fall back to the OS preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Hash routing keeps the app working on any static host: "#/app" is the app, anything else the landing.
const routeFromHash = () => (window.location.hash.startsWith('#/app') ? 'app' : 'landing')

export default function Root() {
  const [theme, setTheme] = useState(initialTheme)
  const [route, setRoute] = useState(routeFromHash)

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // not persisted; theme still applies for this visit
    }
  }, [theme])

  useEffect(() => {
    document.title = route === 'app' ? 'Greywords — app' : 'Greywords — vocabulário em inglês pela imagem'
    if (route === 'app') window.scrollTo(0, 0)
  }, [route])

  return (
    <DesignSystemProvider theme={theme} brandColor={BRAND_COLOR} onThemeChange={setTheme}>
      {route === 'app' ? <App /> : <Landing />}
    </DesignSystemProvider>
  )
}
