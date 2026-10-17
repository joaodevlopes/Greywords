import { useEffect, useRef, useState } from 'react'
import { Badge, Button, EmptyState, IconButton, ProgressBar, Surface, Text, TextField } from 'beds'
import { dueLabel, grade, intervalLabel, isDue } from '../srs.js'
import { exampleCredit, highlight, reviewSentence } from '../examples.js'
import { celebrate } from '../fx/celebrate.js'
import FlipSwap from '../fx/FlipSwap.jsx'
import { isAbstract } from '../imageQuery.js'
import { speak } from '../speak.js'
import WordInfo from './WordInfo.jsx'

const GRADES = [
  { q: 1, label: 'Errei', key: '1' },
  { q: 3, label: 'Difícil', key: '2' },
  { q: 4, label: 'Bom', key: '3' },
  { q: 5, label: 'Fácil', key: '4' },
]

const normalize = (s) => s.trim().toLowerCase().replace(/\s+/g, ' ')

// Hide the answer inside a definition used as a hint.
const mask = (text, word) => text.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '____')

export default function Review({ words, onGrade, onGoSearch }) {
  const [queue, setQueue] = useState(() =>
    Object.values(words)
      .filter((w) => isDue(w.srs))
      .sort((a, b) => a.srs.due - b.srs.due)
      .map((w) => w.key),
  )
  const [revealed, setRevealed] = useState(false)
  const [guess, setGuess] = useState('')
  const [hint, setHint] = useState(false)
  const [session, setSession] = useState({ done: 0, again: 0 })
  const guessRef = useRef(null)
  const answerRef = useRef(null)

  const live = queue.filter((k) => words[k])
  const card = live.length ? words[live[0]] : null

  // spec 005, B5: the session ends (last card answered) -> one short celebration
  const finishedNow = !card && session.done > 0
  const wasFinished = useRef(finishedNow)
  useEffect(() => {
    if (finishedNow && !wasFinished.current) celebrate()
    wasFinished.current = finishedNow
  }, [finishedNow])

  useEffect(() => {
    // preventScroll: the images stay in view; the field is still ready for typing
    if (card && !revealed) guessRef.current?.focus({ preventScroll: true })
  }, [card?.key, revealed, session])

  function reveal() {
    if (!card || revealed) return
    setRevealed(true)
    speak(card.word, card.audio)
  }

  // once the back is on screen, focus moves to the answer (the field it replaced is gone)
  function onFaceShown(face) {
    if (face === 'back') answerRef.current?.focus({ preventScroll: true })
  }

  function answer(q) {
    if (!card || !revealed) return
    onGrade(card.key, grade(card.srs, q), q)
    setQueue((qs) => {
      const rest = qs.filter((k) => k !== card.key)
      return q < 3 ? [...rest, card.key] : rest
    })
    setSession((s) => (q < 3 ? { ...s, again: s.again + 1 } : { ...s, done: s.done + 1 }))
    setRevealed(false)
    setGuess('')
    setHint(false)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' && !revealed) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter') && e.target.tagName !== 'BUTTON') {
        e.preventDefault()
        reveal()
      } else if (revealed) {
        const g = GRADES.find((x) => x.key === e.key)
        if (g) {
          // the next card focuses its guess field: without this, the digit lands in it
          e.preventDefault()
          answer(g.q)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!card) {
    const upcoming = Object.values(words).sort((a, b) => a.srs.due - b.srs.due)[0]
    const finished = session.done > 0
    const plural = session.done > 1 ? 's' : ''
    return (
      <EmptyState
        icon={finished ? 'CheckCircle2' : 'CalendarDays'}
        title={finished ? 'Sessão concluída' : 'Nada para revisar agora'}
        description={[
          finished &&
            `${session.done} palavra${plural} revisada${plural}${session.again ? `, ${session.again} erro${session.again > 1 ? 's' : ''} no caminho` : ''}.`,
          upcoming
            ? `Próxima revisão: ${dueLabel(upcoming.srs.due)} (${upcoming.word}).`
            : 'Salve palavras na busca para começar a revisar.',
        ]
          .filter(Boolean)
          .join(' ')}
        action={{ label: 'Aprender palavra nova', onClick: onGoSearch }}
      />
    )
  }

  const correct = revealed && guess && normalize(guess) === normalize(card.word)
  const firstDef = card.meanings[0]
  // spec 004, D4: abstract words and words without images are reviewed by completing a saved sentence
  const sentence = reviewSentence(card, isAbstract(card, card.word))
  const parts = sentence && highlight(sentence.text, card.word)
  const maskedDef = firstDef && (
    <>
      <em>{firstDef.pos}</em> — {mask(firstDef.definition, card.word)}
    </>
  )
  // the hint: the sentence's translation when there is one (R4.2), otherwise the definition
  let hintText = null
  if (sentence?.translation) hintText = <span lang="pt-BR">{sentence.translation}</span>
  else if (sentence || card.images.length > 0) hintText = maskedDef
  const total = session.done + live.length

  return (
    <section className="gw-review" aria-label="Revisão">
      <div className="gw-review-progress">
        <ProgressBar label={`${session.done} de ${total} revisadas`} value={session.done} max={total} tone="brand" />
      </div>

      <Surface role="panel">
        {/* spec 005, B1: the card turns over on reveal; "revealed" changes at once, so grades work mid-turn */}
        <FlipSwap side={revealed ? 'back' : 'front'} className="gw-flash" onShown={onFaceShown}>
          {(face) => {
            const back = face === 'back'
            return (
              <>
                {sentence ? (
                  <div className="gw-flash-sentence">
                    <p className="gw-flash-cloze" lang="en">
                      {parts.before}
                      {back ? (
                        <mark className="gw-ex-mark">{parts.match}</mark>
                      ) : (
                        <span className="gw-flash-blank">
                          <span aria-hidden="true">_____</span>
                          <span className="gw-visually-hidden">lacuna</span>
                        </span>
                      )}
                      {parts.after}
                    </p>
                    {back && (
                      <div className="gw-flash-sentence-meta">
                        <IconButton label="Ouvir a frase" icon="Play" onClick={() => speak(sentence.text)} />
                        <span className="gw-ex-credit">
                          {sentence.link ? (
                            <a href={sentence.link} target="_blank" rel="noreferrer">
                              {exampleCredit(sentence)}
                              <span className="gw-visually-hidden"> (abre em nova aba)</span>
                            </a>
                          ) : (
                            exampleCredit(sentence)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : card.images.length > 0 ? (
                  <div className={`gw-flash-imgs n${card.images.length}`}>
                    {card.images.map((img) => (
                      <img key={img.id} src={img.thumb} alt="" />
                    ))}
                  </div>
                ) : (
                  firstDef && <p className="gw-flash-def">{mask(firstDef.definition, card.word)}</p>
                )}

                {!back && (
                  <>
                    {hintText && (
                      <div>
                        {hint ? (
                          <Text tone="secondary">{hintText}</Text>
                        ) : (
                          <Button label="Mostrar dica" variant="ghost" compact icon="CircleHelp" onClick={() => setHint(true)} />
                        )}
                      </div>
                    )}
                    <form
                      className="gw-guess"
                      onSubmit={(e) => {
                        e.preventDefault()
                        reveal()
                      }}
                    >
                      <TextField
                        ref={guessRef}
                        label="Qual é a palavra?"
                        description="Opcional. Escrever ajuda a lembrar."
                        value={guess}
                        onChange={setGuess}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <Button label="Mostrar resposta" type="submit" variant="primary" />
                    </form>
                    <Text variant="caption" tone="secondary">
                      Enter mostra a resposta.
                    </Text>
                  </>
                )}

                {back && (
                  <div
                    ref={answerRef}
                    className="gw-flash-answer"
                    tabIndex={-1}
                    role="group"
                    aria-label={`Resposta: ${card.word}`}
                  >
                    {guess && (
                      <Badge
                        label={correct ? 'Acertou' : `Você escreveu “${guess}”`}
                        tone={correct ? 'success' : 'error'}
                        purpose="status"
                      />
                    )}
                    <WordInfo
                      word={card.word}
                      phonetic={card.phonetic}
                      audio={card.audio}
                      meanings={card.meanings.slice(0, 2)}
                      translation={card.translation}
                    />
                    <div className="gw-grades" role="group" aria-label="Como foi lembrar essa palavra?">
                      {GRADES.map((g) => {
                        const next = intervalLabel(grade(card.srs, g.q).interval)
                        return (
                          <div key={g.q} className="gw-grade">
                            <Button label={g.label} variant={g.q === 4 ? 'primary' : 'secondary'} onClick={() => answer(g.q)} />
                            <span className="gw-grade-next">
                              {next} · tecla {g.key}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )
          }}
        </FlipSwap>
      </Surface>
    </section>
  )
}
