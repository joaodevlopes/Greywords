import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, Notice, SegmentedControl, Select, Skeleton, Switch, Text } from 'beds'
import { filterVideos, LEVEL_LABEL, LEVELS, sortVideos, USER_LEVELS } from '../videos.js'
import VideoCard from './VideoCard.jsx'
import VideoDialog from './VideoDialog.jsx'
import VideoSetup from './VideoSetup.jsx'

// Vídeos tab (spec 002). The catalog is a static file generated offline (`npm run catalog`).
async function loadCatalog() {
  const res = await fetch(`${import.meta.env.BASE_URL}catalog.json`, { cache: 'no-cache' })
  const isJson = (res.headers.get('content-type') ?? '').includes('json')
  if (res.ok && isJson) return res.json()
  // While public/catalog.json does not exist yet, development uses a labeled sample (never in the build).
  if (import.meta.env.DEV) return (await import('../dev/catalog.sample.json')).default
  // No file yet (404, or a host's HTML fallback page): the catalog has not been generated. Network errors still throw.
  if (res.status === 404 || (res.ok && !isJson)) return null
  throw new Error(`catalog.json indisponível (HTTP ${res.status})`)
}

const LEVEL_FILTERS = [{ id: 'all', label: 'Todos' }, ...LEVELS.map((id) => ({ id, label: LEVEL_LABEL[id] }))]

export default function Videos({ state, onSavePrefs, onToggleWatched, onSetHideWatched, onOpenSearch }) {
  const [catalog, setCatalog] = useState({ status: 'loading' })
  const [editing, setEditing] = useState(false)
  const [niche, setNiche] = useState('all')
  const [level, setLevel] = useState('all')
  const [openId, setOpenId] = useState(null)

  const load = useCallback(() => {
    setCatalog({ status: 'loading' })
    loadCatalog()
      .then((data) => setCatalog(data ? { status: 'ready', data } : { status: 'missing' }))
      .catch((error) => setCatalog({ status: 'error', error }))
  }, [])

  useEffect(load, [load])

  const { videoNiches, userLevel, watchedVideos, hideWatched } = state
  const data = catalog.data

  const shown = useMemo(() => {
    if (!data) return []
    const filtered = filterVideos(data.videos, { niches: videoNiches, niche, level, hideWatched, watched: watchedVideos })
    return sortVideos(filtered, userLevel)
  }, [data, videoNiches, niche, level, hideWatched, watchedVideos, userLevel])

  if (catalog.status === 'loading') {
    return (
      <section className="gw-videos" aria-label="Vídeos" aria-busy="true">
        <div className="gw-video-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} purpose="card" />
          ))}
        </div>
      </section>
    )
  }

  if (catalog.status === 'missing') {
    return (
      <section className="gw-videos" aria-label="Vídeos">
        <EmptyState
          icon="CalendarDays"
          title="Vídeos em preparação"
          description="O catálogo de vídeos ainda está sendo montado, talk por talk. Enquanto isso, as outras abas funcionam normalmente."
        />
      </section>
    )
  }

  if (catalog.status === 'error') {
    return (
      <section className="gw-videos" aria-label="Vídeos">
        <Notice tone="error" title="Não deu para carregar os vídeos" description="Confira a conexão e tente de novo." />
        <div>
          <Button label="Tentar de novo" variant="primary" onClick={load} />
        </div>
      </section>
    )
  }

  const nicheLabel = (id) => data.niches.find((n) => n.id === id)?.label ?? id
  const myNiches = videoNiches.filter((id) => data.niches.some((n) => n.id === id))
  const open = openId && data.videos.find((v) => v.id === openId)
  const filtersOn = niche !== 'all' || level !== 'all' || hideWatched

  return (
    <section className="gw-videos" aria-label="Vídeos">
      {data.sample && (
        <Notice
          tone="info"
          title="Catálogo de exemplo (modo de desenvolvimento)"
          description="Títulos e vídeos reais do canal TED; duração, nível e palavras-chave são fictícios. Some quando o catálogo real for gerado com npm run catalog."
        />
      )}

      {editing || myNiches.length === 0 ? (
        <VideoSetup
          niches={data.niches}
          initialNiches={myNiches}
          initialLevel={userLevel}
          onSave={(niches, lvl) => {
            onSavePrefs(niches, lvl)
            setNiche('all')
            setEditing(false)
          }}
          onCancel={myNiches.length ? () => setEditing(false) : undefined}
        />
      ) : (
        <>
          <div className="gw-videos-head">
            <Text tone="secondary">
              {USER_LEVELS.find((l) => l.id === userLevel)?.label ?? 'Nível não definido'} ·{' '}
              {myNiches.map(nicheLabel).join(', ')}
            </Text>
            <Button label="Ajustar" variant="ghost" compact icon="Settings2" onClick={() => setEditing(true)} />
          </div>

          <div className="gw-videos-toolbar">
            <Select
              label="Nicho"
              value={niche}
              options={[{ id: 'all', label: 'Todos os meus nichos' }, ...myNiches.map((id) => ({ id, label: nicheLabel(id) }))]}
              onChange={setNiche}
              variant="filter"
            />
            <SegmentedControl label="Nível" value={level} options={LEVEL_FILTERS} onChange={setLevel} />
            <Switch label="Esconder assistidos" checked={hideWatched} onChange={onSetHideWatched} />
          </div>

          {shown.length ? (
            <ul className="gw-video-grid" role="list">
              {shown.map((v) => (
                <li key={v.id}>
                  <VideoCard video={v} watched={Boolean(watchedVideos[v.id])} onOpen={() => setOpenId(v.id)} />
                </li>
              ))}
            </ul>
          ) : filtersOn ? (
            <EmptyState
              icon="Search"
              title="Nenhum vídeo com esses filtros"
              description="Tente outro nível ou todos os seus nichos."
              action={{
                label: 'Mostrar todos',
                onClick: () => {
                  setNiche('all')
                  setLevel('all')
                  onSetHideWatched(false)
                },
              }}
            />
          ) : (
            <EmptyState
              icon="Inbox"
              title="Ainda não há vídeos nos seus nichos"
              description="O catálogo cresce aos poucos. Enquanto isso, inclua outros nichos."
              action={{ label: 'Ajustar nichos', onClick: () => setEditing(true) }}
            />
          )}

          <Text variant="caption" tone="secondary">
            Talks: TED (ted.com), licença CC BY–NC–ND 4.0. Nível estimado pela transcrição. Catálogo de {data.generatedAt}.
          </Text>
        </>
      )}

      {open && (
        <VideoDialog
          video={open}
          watched={Boolean(watchedVideos[open.id])}
          words={state.words}
          onToggleWatched={() => onToggleWatched(open.id)}
          onOpenSearch={(word) => {
            setOpenId(null)
            onOpenSearch(word)
          }}
          onClose={() => setOpenId(null)}
        />
      )}
    </section>
  )
}
