import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'beds/styles.css'
import '@fontsource-variable/fraunces/wght.css'
import './brand/palette.css'
import Root from './Root.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
