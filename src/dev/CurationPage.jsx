import { useEffect, useState } from 'react'
import { Badge, Button, Notice, ProgressBar, TextAreaField, TextField, TextLink, ThemeToggle } from 'beds'
import { durationFromTranscript, formatDuration, parseDuration, tedSearchUrl, tedTalkUrl } from '../../catalog/curation.mjs'

// Dev-only page (#/dev/curadoria, `npm run dev`) for the video curation (spec 002, T4). The user opens each
// talk on TED.com in their own browser, copies the transcript by hand and pastes it here; the dev server
// saves it to catalog/transcripts/ (outside git) and the duration to catalog/sources.json (vite.config.js).
// Nothing on this page requests TED.com: the links only open it for the user.
export default function CurationPage() {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const load = () =>
    fetch('/api/curation/talks')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setLoadError(e.message))

  useEffect(() => {
    load()
  }, [])

  const done = data?.talks.filter((t) => t.words > 0 && t.durationSec > 0).length ?? 0
  const total = data?.talks.length ?? 0

  return (
    <main className="gw-dev-preview gw-cur">
      <header className="gw-dev-preview-head">
        <h1>Curadoria dos vídeos</h1>
        <ThemeToggle label="Tema" lightLabel="Claro" darkLabel="Escuro" />
      </header>
      <ol className="gw-cur-steps">
        <li>Clique em "Abrir no TED". Se a página não existir, use "Procurar no TED" e abra o talk certo.</li>
        <li>Confira se o endereço da página é o mesmo do campo "Link do TED". Se não for, cole o endereço certo.</li>
        <li>Na página do TED, abra a transcrição ("Read transcript"), selecione o texto em inglês inteiro, copie e cole aqui.</li>
        <li>Confira a duração (aparece perto do título no TED) e clique em "Salvar". Pode parar e continuar depois.</li>
      </ol>
      {loadError && (
        <Notice
          tone="error"
          title="Não deu para ler o sources.json"
          description={`${loadError}. O servidor de desenvolvimento está rodando?`}
        />
      )}
      {data && (
        <>
          <ProgressBar label={`${done} de ${total} talks salvos`} value={done} max={total} tone="brand" />
          {data.niches.map((n) => (
            <section key={n.id} className="gw-cur-niche" aria-labelledby={`cur-${n.id}`}>
              <h2 id={`cur-${n.id}`}>{n.label}</h2>
              {data.talks
                .filter((t) => t.niches.includes(n.id))
                .map((t) => (
                  <TalkCard key={t.youtubeId} talk={t} onSaved={load} />
                ))}
            </section>
          ))}
          {done === total && total > 0 && (
            <Notice
              tone="success"
              title="Todos os talks salvos"
              description="Avise no chat: o próximo passo é gerar o catálogo (npm run catalog) e calibrar os níveis."
            />
          )}
        </>
      )}
    </main>
  )
}

function TalkCard({ talk, onSaved }) {
  const [tedUrl, setTedUrl] = useState(tedTalkUrl(talk.tedSlug))
  const [text, setText] = useState('')
  const [duration, setDuration] = useState(formatDuration(talk.durationSec))
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const saved = talk.words > 0 && talk.durationSec > 0

  function onText(value) {
    setText(value)
    // the transcript's last timestamp is a first guess for the duration (a little short)
    if (!duration) {
      const guess = durationFromTranscript(value)
      if (guess) setDuration(formatDuration(guess))
    }
  }

  async function save() {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch('/api/curation/transcript', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: talk.tedSlug, tedUrl, durationSec: parseDuration(duration), text }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setResult({ tone: 'success', title: `Salvo: ${body.words} palavras` })
      setText('')
      onSaved()
    } catch (e) {
      setResult({ tone: 'error', title: 'Não salvou', description: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="gw-cur-talk" data-saved={saved ? 'true' : undefined}>
      <header className="gw-cur-talk-head">
        <div>
          <h3>{talk.title}</h3>
          <p>{talk.speaker}</p>
        </div>
        <Badge label={saved ? `Salvo · ${talk.words} palavras` : 'Falta'} tone={saved ? 'success' : 'warning'} purpose="status" />
      </header>
      <p className="gw-cur-links">
        <TextLink href={tedTalkUrl(talk.tedSlug)} external>
          Abrir no TED
        </TextLink>
        <TextLink href={tedSearchUrl(`${talk.speaker} ${talk.title}`)} external>
          Procurar no TED
        </TextLink>
        <TextLink href={`https://www.youtube.com/watch?v=${talk.youtubeId}`} external>
          Vídeo no YouTube
        </TextLink>
      </p>
      <div className="gw-cur-fields">
        <TextField label="Link do TED" value={tedUrl} onChange={setTedUrl} autoComplete="off" spellCheck={false} />
        <TextField
          label="Duração"
          description="Minutos:segundos, ex.: 19:11"
          value={duration}
          onChange={setDuration}
          autoComplete="off"
        />
      </div>
      <TextAreaField
        label={saved ? 'Colar de novo (substitui a transcrição salva)' : 'Transcrição em inglês'}
        value={text}
        onChange={onText}
        placeholder="Cole aqui o texto inteiro da transcrição"
        spellCheck={false}
      />
      <div className="gw-cur-actions">
        <Button label="Salvar" variant="primary" onClick={save} busy={busy} disabled={!text.trim()} />
      </div>
      {result && <Notice tone={result.tone} title={result.title} description={result.description} />}
    </article>
  )
}
