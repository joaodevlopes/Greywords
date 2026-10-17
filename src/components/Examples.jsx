import { useId, useState } from 'react'
import { Button, IconButton, IconToggleButton } from 'beds'
import { exampleCredit, highlight } from '../examples.js'
import { speak } from '../speak.js'

// Example sentences (spec 004): used in the search, in the dictionary detail and in the review.
// sentences: [{ id, text, translation, owner, license, link, source? }] (see src/examples.js).
// With onTogglePick it is in "choose" mode (D3): `picked` holds the chosen ids, at most `maxPick`.
export default function Examples({ word, sentences, picked = [], onTogglePick, maxPick = 2, title = 'Exemplos' }) {
  const [shown, setShown] = useState(() => new Set())
  const baseId = useId()
  const titleId = `${baseId}-title`
  const choosing = typeof onTogglePick === 'function'
  const fromTatoeba = sentences.some((s) => s.source !== 'dictionary')

  const toggleShown = (id) =>
    setShown((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section className="gw-ex" aria-labelledby={titleId}>
      <h3 id={titleId} className="gw-ex-title">
        {title}
      </h3>
      {choosing && (
        <p className="gw-ex-hint" aria-live="polite">
          {picked.length
            ? `${picked.length} de ${maxPick} escolhida${picked.length > 1 ? 's' : ''} para salvar.`
            : `Escolha até ${maxPick} frases para salvar com a palavra (sem escolha, vai a primeira).`}
        </p>
      )}
      <ol className="gw-ex-list">
        {sentences.map((s, i) => {
          const { before, match, after } = highlight(s.text, word)
          const n = picked.indexOf(s.id)
          const open = shown.has(s.id)
          const transId = `${baseId}-tr-${i}`
          return (
            <li key={s.id} className="gw-ex-item" data-picked={n >= 0 ? 'true' : undefined}>
              <p className="gw-ex-text" lang="en">
                {before}
                {match && <mark className="gw-ex-mark">{match}</mark>}
                {after}
              </p>
              {s.translation && open && (
                <p id={transId} className="gw-ex-translation" lang="pt-BR">
                  {s.translation}
                </p>
              )}
              <div className="gw-ex-actions">
                {s.translation && (
                  <Button
                    label={open ? 'Esconder tradução' : 'Ver tradução'}
                    variant="ghost"
                    compact
                    aria-expanded={open}
                    aria-controls={open ? transId : undefined}
                    onClick={() => toggleShown(s.id)}
                  />
                )}
                <IconButton label={`Ouvir a frase ${i + 1}`} icon="Play" onClick={() => speak(s.text)} />
                {choosing && (
                  <IconToggleButton
                    label={`Escolher a frase ${i + 1} para salvar`}
                    icon="Bookmark"
                    pressed={n >= 0}
                    onPressedChange={() => onTogglePick(s.id)}
                  />
                )}
                <span className="gw-ex-credit">
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer">
                      {exampleCredit(s)}
                      <span className="gw-visually-hidden"> (abre em nova aba)</span>
                    </a>
                  ) : (
                    exampleCredit(s)
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      {fromTatoeba && (
        <p className="gw-ex-license">
          Frases:{' '}
          <a href="https://tatoeba.org" target="_blank" rel="noreferrer">
            Tatoeba
          </a>
          , CC BY 2.0 FR / CC0.
        </p>
      )}
    </section>
  )
}
