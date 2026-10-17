import { useState } from 'react'
import { ThemeToggle } from 'beds'
import Examples from '../components/Examples.jsx'
import { togglePicked } from '../examples.js'

// Dev-only page (#/dev/examples, `npm run dev`): the Examples component with sample sentences (spec 004, T3).
// Sentences, authors and ids are made up for the preview; the links do not point at these sentences.
const TATOEBA = 'https://tatoeba.org/en/sentences/show/'
const HOWEVER = [
  { id: 1, text: 'However, my shoulder hurts.', translation: 'No entanto, meu ombro dói.', owner: 'ana', license: 'CC BY 2.0 FR', link: `${TATOEBA}1` },
  { id: 2, text: 'I wanted to go; however, it was raining all day.', translation: 'Eu queria ir; porém, choveu o dia todo.', owner: 'carlos', license: 'CC BY 2.0 FR', link: `${TATOEBA}2` },
  { id: 3, text: 'The plan is simple. However, nobody likes it.', translation: null, owner: null, license: 'CC0 1.0', link: `${TATOEBA}3` },
]
const STUDY = [
  { id: 'dict:1', text: 'She studies biology at the university.', translation: null, owner: null, license: null, link: null, source: 'dictionary' },
  { id: 'dict:2', text: 'They were studying late every night.', translation: null, owner: null, license: null, link: null, source: 'dictionary' },
]

export default function ExamplesPreview() {
  const [picked, setPicked] = useState([])
  return (
    <main className="gw-dev-preview">
      <header className="gw-dev-preview-head">
        <h1>Prévia: frases de exemplo (spec 004, T3)</h1>
        <ThemeToggle label="Tema" lightLabel="Claro" darkLabel="Escuro" />
      </header>
      <section>
        <h2>Modo de escolha (busca): "however"</h2>
        <Examples word="however" sentences={HOWEVER} picked={picked} onTogglePick={(id) => setPicked((p) => togglePicked(p, id))} />
      </section>
      <section>
        <h2>Só leitura, exemplos do dicionário (reserva): "study"</h2>
        <Examples word="study" sentences={STUDY} />
      </section>
    </main>
  )
}
