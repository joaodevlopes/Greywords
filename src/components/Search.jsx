import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Button, EmptyState, IconButton, Notice, SearchField, Surface, Text } from 'beds'
import { fetchDefinition, fetchExamples, fetchImagesFor, fetchTranslation, orTimeout, trackImageUse } from '../api.js'
import { dictionaryExamples, examplesToSave, mergeExamples, togglePicked } from '../examples.js'
import { buildQueries, imageCredit, isAbstract, mergeRefined, refineSuggestions } from '../imageQuery.js'
import { newCard } from '../srs.js'
import SkeletonGrid from '../fx/Skeleton.jsx'
import Examples from './Examples.jsx'
import UnsplashCredit from './UnsplashCredit.jsx'
import WordInfo from './WordInfo.jsx'

const SUGGESTIONS = ['sun', 'whisper', 'river', 'climb', 'blanket', 'thunder', 'stubborn']
const MAX_PICK = 3
const IMAGE_COUNT = 12
const ABSTRACT_IMAGE_COUNT = 3 // spec 003, R5.1: few images, the definition leads
const DEF_WAIT_MS = 2000 // spec 003, D2: images wait this long for the definition, then go by the word alone
// spec 005, B3: a chosen image shrinks a little and its order number pops, both on a short spring
const PICK_SPRING = { type: 'spring', stiffness: 520, damping: 28 }

export default function Search({ words, hidden = {}, onHide, onSave, seed, onSeedUsed }) {
  const [query, setQuery] = useState('')
  const reduced = useReducedMotion()
  // images: null = loading; def / translation: undefined = loading, null = not found / failed
  const [result, setResult] = useState(null)
  const [picked, setPicked] = useState([])
  // true while the choice is the automatic "first 3"; refining replaces those instead of keeping them
  const [autoPicked, setAutoPicked] = useState(false)
  const [broken, setBroken] = useState(() => new Set())
  const [savedFlash, setSavedFlash] = useState(false)
  const [refineText, setRefineText] = useState('')
  const [pickedEx, setPickedEx] = useState([])
  // abstract words show the sentences in place of the grid until the user asks for images (spec 004, R3)
  const [showImages, setShowImages] = useState(false)
  const reqId = useRef(0)
  const refineId = useRef(0)
  const gridRef = useRef(null)
  const hintRef = useRef(null)
  // images the user hid for a word are dropped from every result (spec 003, R1.3)
  const notHidden = (word, list) => {
    const ids = new Set(hidden[word] ?? [])
    return list.filter((img) => !ids.has(img.id))
  }

  function run(raw) {
    const word = raw.trim().toLowerCase()
    if (!word) return
    setQuery(word)
    const id = ++reqId.current
    const existing = words[word]
    setSavedFlash(false)
    setRefineText('')
    refineId.current++
    setBroken(new Set())
    setPicked(existing ? existing.images.map((i) => i.id) : [])
    setAutoPicked(!existing)
    setPickedEx(existing?.examples?.map((s) => s.id) ?? [])
    setShowImages(false)
    // examples: null = loading (spec 004)
    setResult({
      word,
      images: null,
      imageError: false,
      limited: false,
      abstract: false,
      refinedBy: null,
      def: undefined,
      translation: undefined,
      examples: null,
    })

    const patch = (fields) => id === reqId.current && setResult((r) => ({ ...r, ...fields }))

    const defPromise = fetchDefinition(word).catch(() => null)
    defPromise.then((def) => patch({ def }))
    const defInTime = orTimeout(defPromise, DEF_WAIT_MS)

    // spec 004: sentences load on their own, so they never hold back the images (R1.4); grammar words
    // search the exact word (D2); with nothing from Tatoeba, the dictionary's examples (R1.5)
    defInTime
      .then((def) => fetchExamples(word, { exact: isAbstract(def, word) }))
      .then(async (found) => (found.length ? found : dictionaryExamples((await defPromise)?.meanings, word)))
      .catch(() => [])
      .then((found) => patch({ examples: mergeExamples(existing?.examples, found) }))

    // spec 003: images are searched once, with the meaning as context when the definition arrives in time
    defInTime
      .then((def) => {
        const abstract = Boolean(def) && isAbstract(def, word)
        patch({ abstract })
        return fetchImagesFor(buildQueries(word, def), abstract ? ABSTRACT_IMAGE_COUNT : IMAGE_COUNT)
      })
      .then(({ images, limited }) => {
        patch({ limited })
        return notHidden(word, images)
      })
      .catch(() => {
        patch({ imageError: true })
        return []
      })
      .then((found) => {
        if (id !== reqId.current) return
        let images = found
        if (existing) {
          const savedIds = new Set(existing.images.map((i) => i.id))
          images = [...existing.images, ...found.filter((i) => !savedIds.has(i.id))]
        } else {
          setPicked(found.slice(0, MAX_PICK).map((i) => i.id))
        }
        patch({ images })
      })
    fetchTranslation(word)
      .catch(() => null)
      .then((translation) => patch({ translation }))
  }

  // spec 003, R3: new images from one query (one request); the word, definition and translation stay,
  // and the images already chosen stay first in the grid
  function refine(raw) {
    const q = raw.trim().toLowerCase()
    if (!q || !result || result.images === null) return
    const word = result.word
    const id = ++refineId.current
    const current = result.images
    const keep = autoPicked ? [] : picked
    setResult((r) => ({ ...r, images: null, imageError: false, refinedBy: q, refineEmpty: false }))
    fetchImagesFor([q], IMAGE_COUNT)
      .then(({ images, limited }) => ({ found: notHidden(word, images), limited, error: false }))
      .catch(() => ({ found: [], limited: false, error: true }))
      .then(({ found, limited, error }) => {
        if (id !== refineId.current) return
        const images = mergeRefined(current, keep, found)
        if (!keep.length) setPicked(found.slice(0, MAX_PICK).map((i) => i.id))
        setResult((r) =>
          r && r.word === word
            ? { ...r, images, limited, imageError: error && !images.length, refineEmpty: !error && !found.length }
            : r,
        )
      })
  }

  // a word sent from another tab (video keywords, spec 002 R6.2) is searched right away
  useEffect(() => {
    if (!seed?.word) return
    run(seed.word)
    onSeedUsed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const loading = result && (result.images === null || result.def === undefined || result.translation === undefined)

  function hide(id, index) {
    const word = result.word
    setPicked((p) => p.filter((x) => x !== id))
    onHide?.(word, id)
    // keep keyboard focus in the grid: the tile that takes this place (or the last one)
    requestAnimationFrame(() => {
      const tiles = gridRef.current?.querySelectorAll('.gw-tile')
      if (tiles?.length) tiles[Math.min(index, tiles.length - 1)].focus()
    })
  }

  function togglePick(id) {
    setAutoPicked(false)
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id)
      return p.length < MAX_PICK ? [...p, id] : [...p.slice(1), id]
    })
  }

  function save() {
    const { word, images, def, translation, examples } = result
    const existing = words[word]
    const byId = new Map(images.map((i) => [i.id, i]))
    // an abstract word whose images were never shown keeps the images it had (none for a new word)
    const chosen = imagesShown
      ? picked
          .filter((id) => !broken.has(id))
          .map((id) => byId.get(id))
          .filter(Boolean)
      : (existing?.images ?? [])
    // spec 003, R1.6: tell Unsplash about each of its photos saved for the first time
    const alreadySaved = new Set(existing?.images.map((i) => i.id) ?? [])
    trackImageUse(chosen.filter((img) => !alreadySaved.has(img.id)))
    onSave({
      key: word,
      word,
      phonetic: def?.phonetic || '',
      audio: def?.audio || '',
      meanings: def?.meanings || [],
      translation,
      images: chosen,
      examples: examplesToSave(examples, pickedEx, existing?.examples),
      addedAt: existing?.addedAt || Date.now(),
      srs: existing?.srs || newCard(),
    })
    setSavedFlash(true)
  }

  const hiddenNow = new Set(result ? (hidden[result.word] ?? []) : [])
  const visible = result?.images?.filter((i) => !broken.has(i.id) && !hiddenNow.has(i.id)) || []
  const suggestions = result && result.def !== undefined ? refineSuggestions(result.word, result.def) : []
  const inDict = result && words[result.word]
  const imagesShown = !result?.abstract || showImages
  const examplesBlock = result && (
    <Examples
      key={`examples-${result.word}`}
      word={result.word}
      sentences={result.examples}
      picked={pickedEx}
      onTogglePick={(id) => setPickedEx((p) => togglePicked(p, id))}
    />
  )

  function revealImages() {
    setShowImages(true)
    // images of an abstract word are a last resort: none comes chosen, the user picks (spec 004, R3.2)
    if (autoPicked) setPicked([])
    // the button goes away: keep keyboard focus on the images that took its place
    requestAnimationFrame(() => hintRef.current?.focus())
  }

  return (
    <section className="gw-search" aria-label="Buscar palavra">
      <form
        className="gw-search-bar"
        onSubmit={(e) => {
          e.preventDefault()
          run(query)
        }}
      >
        <SearchField
          label="Palavra em inglês"
          value={query}
          onChange={setQuery}
          placeholder="Digite uma palavra em inglês…"
          autoComplete="off"
          spellCheck={false}
        />
        <Button label="Ver" type="submit" variant="primary" disabled={!query.trim()} busy={loading} />
      </form>

      {!result && (
        <div className="gw-search-empty">
          <EmptyState
            icon="Image"
            title="Veja antes de traduzir"
            description={`Busque uma palavra e escolha até ${MAX_PICK} imagens que mais lembram ela. Essas imagens viram a frente do seu flashcard. A tradução fica escondida até você pedir.`}
          />
          <div className="gw-chips" role="group" aria-label="Sugestões de palavras">
            {SUGGESTIONS.map((s) => (
              <Button key={s} label={s} variant="secondary" compact onClick={() => run(s)} />
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="gw-result">
          <div className="gw-result-images">
            {result.abstract && (
              <>
                <Notice
                  tone="info"
                  title="Aqui o que ensina é o contexto"
                  description={
                    showImages
                      ? `"${result.word}" quase não tem imagem: mostramos só ${ABSTRACT_IMAGE_COUNT}. As frases acima ensinam mais.`
                      : `"${result.word}" quase não tem imagem. Veja a palavra em uso nestas frases.`
                  }
                />
                {examplesBlock}
                {!showImages && (
                  <div className="gw-ex-more">
                    <Button label="Ver imagens mesmo assim" icon="Image" variant="secondary" onClick={revealImages} />
                  </div>
                )}
              </>
            )}
            {imagesShown && (
              <>
                <p className="gw-hint" ref={hintRef} tabIndex={-1}>
                  Escolha as imagens que mais lembram <strong>{result.word}</strong>{' '}
                  <span className="gw-count">
                    {picked.length}/{MAX_PICK}
                  </span>
                </p>
                {result.limited && (
                  <Notice
                    tone="warning"
                    title="O banco de fotos limitou as buscas por agora"
                    description="Algumas imagens podem faltar ou vir de outra fonte. Tente de novo mais tarde."
                  />
                )}
                {result.images === null ? (
                  <SkeletonGrid count={IMAGE_COUNT} label="Buscando imagens…" />
                ) : visible.length ? (
                  <div className="gw-grid" ref={gridRef}>
                    {visible.map((img, index) => {
                      const n = picked.indexOf(img.id)
                      return (
                        <div key={img.id} className="gw-tile-wrap">
                          <button
                            type="button"
                            className="gw-tile"
                            onClick={() => togglePick(img.id)}
                            title={imageCredit(img)}
                            aria-pressed={n >= 0}
                            aria-label={`${img.title}${n >= 0 ? `, escolhida em ${n + 1}º` : ''}`}
                          >
                            <motion.img
                              src={img.thumb}
                              alt=""
                              loading="lazy"
                              initial={false}
                              animate={{ scale: n >= 0 && !reduced ? 0.94 : 1 }}
                              transition={PICK_SPRING}
                              onError={() => setBroken((b) => new Set(b).add(img.id))}
                            />
                            {n >= 0 && (
                              // keyed by the order: when it changes (another image unchosen), the number pops again
                              <motion.span
                                key={n}
                                className="gw-tile-badge"
                                aria-hidden="true"
                                initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={PICK_SPRING}
                              >
                                {n + 1}
                              </motion.span>
                            )}
                          </button>
                          <span className="gw-tile-hide">
                            <IconButton label="Esconder esta imagem" icon="X" onClick={() => hide(img.id, index)} />
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : result.imageError ? (
                  <Notice
                    tone="error"
                    title="Não deu para buscar imagens"
                    description="Os bancos de imagens não responderam. Tente buscar de novo."
                  />
                ) : (
                  <Notice
                    tone="info"
                    title="Nenhuma imagem encontrada"
                    description="Palavras abstratas costumam não ter imagem. A definição ao lado ajuda."
                  />
                )}
                {result.refineEmpty && (
                  <Notice
                    tone="info"
                    title={`Nenhuma imagem nova para "${result.refinedBy}"`}
                    description="Tente outras palavras em inglês ou uma das sugestões."
                  />
                )}
                <div className="gw-refine">
                  <p className="gw-refine-title">
                    {result.refinedBy ? (
                      <>
                        Mostrando imagens de <strong>{result.refinedBy}</strong>. Refinar de novo:
                      </>
                    ) : (
                      'Imagens fora do tema? Refine a busca:'
                    )}
                  </p>
                  {suggestions.length > 0 && (
                    <div className="gw-refine-chips" role="group" aria-label="Sugestões para refinar as imagens">
                      {suggestions.map((s) => (
                        <Button
                          key={s}
                          label={s}
                          variant="secondary"
                          compact
                          onClick={() => refine(s)}
                          disabled={result.images === null}
                        />
                      ))}
                    </div>
                  )}
                  <form
                    className="gw-refine-form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      refine(refineText)
                    }}
                  >
                    <SearchField
                      label="Refinar imagens"
                      value={refineText}
                      onChange={setRefineText}
                      placeholder={`Em inglês, ex.: ${result.word} close up`}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <Button label="Refinar" type="submit" disabled={!refineText.trim() || result.images === null} />
                  </form>
                </div>
                {visible.some((img) => img.source === 'unsplash') ? (
                  <UnsplashCredit images={visible} />
                ) : (
                  <Text variant="caption" tone="secondary">
                    Imagens do Openverse e Wikimedia Commons, com licenças abertas. Passe o mouse para ver o autor.
                  </Text>
                )}
              </>
            )}
          </div>

          <aside className="gw-result-panel">
            <Surface role="panel">
              <div className="gw-panel-body">
                <WordInfo
                  key={result.word}
                  word={result.word}
                  phonetic={result.def?.phonetic}
                  audio={result.def?.audio}
                  meanings={result.def?.meanings}
                  loadingDef={result.def === undefined}
                  translation={result.translation}
                />
                <Button
                  label={savedFlash ? 'Salvo no dicionário' : inDict ? 'Atualizar no dicionário' : 'Salvar no dicionário'}
                  icon={savedFlash ? 'Check' : 'Bookmark'}
                  variant="primary"
                  onClick={save}
                  disabled={loading}
                />
                {!result.abstract && examplesBlock}
              </div>
            </Surface>
          </aside>
        </div>
      )}
    </section>
  )
}
