import { useEffect, useMemo, useRef, useState } from 'react'
import { SegmentedControl, ThemeToggle, Toaster, toast } from 'beds'
import Wordmark from './brand/Wordmark.jsx'
import Dictionary from './components/Dictionary.jsx'
import Progress from './components/Progress.jsx'
import Review from './components/Review.jsx'
import Search from './components/Search.jsx'
import Videos from './components/Videos.jsx'
import TabTransition from './fx/TabTransition.jsx'
import { celebrate } from './fx/celebrate.js'
import { dayKey, goalJustMet, mondayOf, weekSummary, withDay, withGoal, withoutDay } from './progress.js'
import { isDue } from './srs.js'
import { exportState, loadState, saveState } from './storage.js'

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('search')
  // a word sent from elsewhere (video keywords) to be searched on the Busca tab
  const [searchSeed, setSearchSeed] = useState(null)

  useEffect(() => saveState(state), [state])

  // spec 005, B5: celebrate once, at the moment studying reaches this week's goal
  const week = useMemo(() => weekSummary(state, mondayOf(dayKey())), [state])
  const lastWeek = useRef(week)
  useEffect(() => {
    if (goalJustMet(lastWeek.current, week)) {
      celebrate()
      toast({ id: 'goal-met', message: `Meta da semana cumprida: ${week.count} de ${week.goal} dias.`, tone: 'success' })
    }
    lastWeek.current = week
  }, [week])

  const { words } = state
  const dueCount = useMemo(() => Object.values(words).filter((w) => isDue(w.srs)).length, [words])

  // Saving and reviewing count today as studied (spec 001, R2.1)
  const upsertWord = (entry) =>
    setState((s) => ({
      ...s,
      words: { ...s.words, [entry.key]: entry },
      activityDays: withDay(s.activityDays),
    }))

  // spec 003, R1.3: an image hidden for a word never comes back in its searches
  const hideImage = (word, imageId) =>
    setState((s) => {
      const current = s.hiddenImages[word] ?? []
      if (current.includes(imageId)) return s
      return { ...s, hiddenImages: { ...s.hiddenImages, [word]: [...current, imageId] } }
    })

  const removeWord = (key) =>
    setState((s) => {
      const { [key]: _removed, ...rest } = s.words
      return { ...s, words: rest }
    })

  const recordReview = (key, srs, q) =>
    setState((s) => ({
      ...s,
      words: { ...s.words, [key]: { ...s.words[key], srs } },
      log: [...s.log, { t: Date.now(), word: key, q }],
      activityDays: withDay(s.activityDays),
    }))

  const setGoal = (days) => setState((s) => ({ ...s, goals: withGoal(s.goals, days) }))

  // Manual check-in for today only; undo removes just the manual mark (R2.2, R2.3)
  const toggleCheckin = () =>
    setState((s) => {
      const today = dayKey()
      const checkinDays = s.checkinDays.includes(today) ? withoutDay(s.checkinDays, today) : withDay(s.checkinDays, today)
      return { ...s, checkinDays }
    })

  // spec 002: video preferences and watched videos; watching counts the day as studied (R5.3)
  const setVideoPrefs = (videoNiches, userLevel) => setState((s) => ({ ...s, videoNiches, userLevel }))
  const setHideWatched = (hideWatched) => setState((s) => ({ ...s, hideWatched }))
  const toggleWatched = (id) =>
    setState((s) => {
      if (s.watchedVideos[id]) {
        const { [id]: _removed, ...rest } = s.watchedVideos
        return { ...s, watchedVideos: rest }
      }
      const today = dayKey()
      return { ...s, watchedVideos: { ...s.watchedVideos, [id]: today }, activityDays: withDay(s.activityDays, today) }
    })

  const openSearch = (word) => {
    setSearchSeed({ word, at: Date.now() })
    setTab('search')
  }

  // short labels so five sections fit on a phone (spec 002, T7)
  const tabs = [
    { id: 'search', label: 'Busca' },
    { id: 'dictionary', label: 'Palavras' },
    { id: 'review', label: dueCount > 0 ? `Revisão · ${dueCount}` : 'Revisão' },
    { id: 'videos', label: 'Vídeos' },
    { id: 'progress', label: 'Progresso' },
  ]

  return (
    <div className="gw-app">
      <Toaster label="Avisos" dismissLabel="Fechar aviso" />
      <header className="gw-app-header">
        <a className="gw-wordmark" href="#/" aria-label="Greywords, voltar para a página inicial">
          <Wordmark />
        </a>
        <nav className="gw-app-nav" aria-label="Seções do app">
          <SegmentedControl label="Seções do app" value={tab} options={tabs} onChange={setTab} />
        </nav>
        <ThemeToggle label="Tema" lightLabel="Claro" darkLabel="Escuro" />
      </header>

      <main className="gw-app-main">
        <TabTransition key={tab}>
          {tab === 'search' && <Search
              words={words}
              hidden={state.hiddenImages}
              onHide={hideImage}
              onSave={upsertWord}
              seed={searchSeed}
              onSeedUsed={() => setSearchSeed(null)}
            />}
          {tab === 'dictionary' && (
            <Dictionary
              words={words}
              onRemove={removeWord}
              onExport={() => exportState(state)}
              onGoSearch={() => setTab('search')}
              onGoReview={() => setTab('review')}
            />
          )}
          {tab === 'review' && <Review words={words} onGrade={recordReview} onGoSearch={() => setTab('search')} />}
          {tab === 'videos' && (
            <Videos
              state={state}
              onSavePrefs={setVideoPrefs}
              onToggleWatched={toggleWatched}
              onSetHideWatched={setHideWatched}
              onOpenSearch={openSearch}
            />
          )}
          {tab === 'progress' && <Progress state={state} onSetGoal={setGoal} onToggleCheckin={toggleCheckin} />}
        </TabTransition>
      </main>
    </div>
  )
}
