import { useState } from 'react'
import { Badge, Button, IconButton, LoadingIndicator, Text } from 'beds'
import { speak } from '../speak.js'

export default function WordInfo({ word, phonetic, audio, meanings, translation, loadingDef, showTitle = true }) {
  const [showTr, setShowTr] = useState(false)

  return (
    <div className="gw-word">
      {showTitle ? (
        <div className="gw-word-head">
          <h2 className="gw-word-title">{word}</h2>
          <IconButton label={`Ouvir a pronúncia de ${word}`} icon="Play" onClick={() => speak(word, audio)} />
        </div>
      ) : (
        <div>
          <Button label="Ouvir pronúncia" icon="Play" variant="secondary" compact onClick={() => speak(word, audio)} />
        </div>
      )}
      {phonetic && <p className="gw-phonetic">{phonetic}</p>}

      {loadingDef ? (
        <LoadingIndicator label="Buscando definição" />
      ) : meanings?.length ? (
        <ol className="gw-meanings">
          {meanings.map((m, i) => (
            <li key={i}>
              <Badge label={m.pos} purpose="tag" />
              <Text>{m.definition}</Text>
              {m.example && <p className="gw-example">“{m.example}”</p>}
            </li>
          ))}
        </ol>
      ) : (
        <Text tone="secondary">Sem definição no dicionário (pode ser expressão ou gíria).</Text>
      )}

      {translation === undefined ? null : translation?.main ? (
        <div className="gw-translation">
          {showTr ? (
            <>
              <Text variant="overline" tone="secondary">
                Tradução
              </Text>
              <p className="gw-translation-main">{translation.main}</p>
              {translation.alts?.length > 0 && <Text tone="secondary">{translation.alts.join(' · ')}</Text>}
            </>
          ) : (
            <Button label="Ver tradução" variant="ghost" compact icon="Globe" onClick={() => setShowTr(true)} />
          )}
        </div>
      ) : (
        <div className="gw-translation">
          <Text tone="secondary">Tradução indisponível agora.</Text>
        </div>
      )}
    </div>
  )
}
