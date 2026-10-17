import { useMemo, useState } from 'react'
import { Badge, Button, Dialog, EmptyState, SearchField, Select, Text } from 'beds'
import { UNSPLASH_HOME, imageCredit } from '../imageQuery.js'
import { dueLabel, isDue, status } from '../srs.js'
import WordInfo from './WordInfo.jsx'

const SORTS = [
  { id: 'recent', label: 'Mais recentes', fn: (a, b) => b.addedAt - a.addedAt },
  { id: 'due', label: 'Próxima revisão', fn: (a, b) => a.srs.due - b.srs.due },
  { id: 'alpha', label: 'A–Z', fn: (a, b) => a.word.localeCompare(b.word) },
]

const STATUS_TONE = { new: 'info', learning: 'warning', mastered: 'success' }

export default function Dictionary({ words, onRemove, onExport, onGoSearch, onGoReview }) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('recent')
  const [openKey, setOpenKey] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const list = useMemo(() => Object.values(words), [words])

  // Metrics live in the Progresso tab (spec 001, R4.1); the due-words prompt stays here (R4.2)
  const dueCount = useMemo(() => list.filter((w) => isDue(w.srs)).length, [list])

  const sortFn = SORTS.find((s) => s.id === sort).fn
  const shown = list.filter((w) => w.word.includes(filter.trim().toLowerCase())).sort(sortFn)
  const open = openKey && words[openKey]

  function close() {
    setOpenKey(null)
    setConfirming(false)
  }

  if (!list.length) {
    return (
      <EmptyState
        icon="Bookmark"
        title="Seu dicionário está vazio"
        description="Cada palavra que você salvar na busca aparece aqui, com as imagens que você escolheu."
        action={{ label: 'Buscar primeira palavra', onClick: onGoSearch }}
      />
    )
  }

  return (
    <section className="gw-dictionary" aria-label="Dicionário">
      {dueCount > 0 && (
        <div className="gw-due-cta">
          <Text>
            {dueCount} palavra{dueCount > 1 ? 's' : ''} esperando revisão.
          </Text>
          <Button label="Revisar agora" icon="ArrowRight" variant="primary" compact onClick={onGoReview} />
        </div>
      )}

      <div className="gw-toolbar">
        <div className="gw-toolbar-search">
          <SearchField label="Filtrar palavras" value={filter} onChange={setFilter} placeholder="Filtrar…" spellCheck={false} />
        </div>
        <Select
          label="Ordenar por"
          value={sort}
          options={SORTS.map(({ id, label }) => ({ id, label }))}
          onChange={setSort}
          variant="filter"
        />
        <Button label="Exportar JSON" icon="FileText" variant="secondary" onClick={onExport} />
      </div>

      {shown.length ? (
        <ul className="gw-cards" role="list">
          {shown.map((w) => {
            const st = status(w.srs)
            return (
              <li key={w.key}>
                <button type="button" className="gw-card" onClick={() => setOpenKey(w.key)}>
                  <span className="gw-card-img">
                    {w.images[0] ? <img src={w.images[0].thumb} alt="" loading="lazy" /> : <span aria-hidden="true">{w.word[0]}</span>}
                  </span>
                  <span className="gw-card-body">
                    <span className="gw-card-word">{w.word}</span>
                    <Badge label={st.label} tone={STATUS_TONE[st.id]} purpose="status" />
                    <span className="gw-card-due">Revisão {dueLabel(w.srs.due)}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <Text tone="secondary">Nenhuma palavra com “{filter}”.</Text>
      )}

      {open && (
        <Dialog
          open
          onOpenChange={(o) => !o && close()}
          title={open.word}
          description={open.phonetic || undefined}
          actions={
            confirming ? (
              <>
                <Button label="Cancelar" variant="secondary" onClick={() => setConfirming(false)} />
                <Button
                  label="Remover de vez"
                  variant="destructive"
                  onClick={() => {
                    onRemove(open.key)
                    close()
                  }}
                />
              </>
            ) : (
              <>
                <Button label="Remover palavra" variant="ghost" onClick={() => setConfirming(true)} />
                <Button label="Fechar" variant="primary" onClick={close} />
              </>
            )
          }
        >
          <div className="gw-detail">
            {open.images.length > 0 && (
              <div className="gw-detail-imgs">
                {open.images.map((img) => (
                  <a key={img.id} href={img.link} target="_blank" rel="noreferrer" title={imageCredit(img)}>
                    <img src={img.thumb} alt={img.title} />
                  </a>
                ))}
              </div>
            )}
            {open.images.some((img) => img.source === 'unsplash') && (
              <p className="gw-image-credit">
                {open.images
                  .filter((img) => img.source === 'unsplash')
                  .map((img, i) => (
                    <span key={img.id}>
                      {i > 0 && ' · '}
                      Foto de{' '}
                      <a href={img.creditLink} target="_blank" rel="noreferrer">
                        {img.credit}
                      </a>
                    </span>
                  ))}{' '}
                no{' '}
                <a href={UNSPLASH_HOME} target="_blank" rel="noreferrer">
                  Unsplash
                </a>
              </p>
            )}
            <WordInfo
              word={open.word}
              audio={open.audio}
              meanings={open.meanings}
              translation={open.translation}
              showTitle={false}
            />
            <dl className="gw-facts">
              <div>
                <dt>Adicionada</dt>
                <dd>{new Date(open.addedAt).toLocaleDateString('pt-BR')}</dd>
              </div>
              <div>
                <dt>Próxima revisão</dt>
                <dd>{dueLabel(open.srs.due)}</dd>
              </div>
              <div>
                <dt>Acertos seguidos</dt>
                <dd>{open.srs.reps}</dd>
              </div>
              <div>
                <dt>Erros</dt>
                <dd>{open.srs.lapses}</dd>
              </div>
            </dl>
            {confirming && (
              <Text tone="secondary">
                Remover “{open.word}” tira a palavra e as imagens escolhidas do dicionário. Não dá para desfazer.
              </Text>
            )}
          </div>
        </Dialog>
      )}
    </section>
  )
}
