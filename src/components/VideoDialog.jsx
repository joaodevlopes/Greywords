import { Button, Dialog, Text, TextLink } from 'beds'
import { formatDuration, LEVEL_LABEL, newKeywords } from '../videos.js'

// One video: player, why it has this level, keywords to learn, watched (spec 002, R3.3–R3.4, R5, R6).
export default function VideoDialog({ video, watched, words, onToggleWatched, onOpenSearch, onClose }) {
  const keywords = newKeywords(video.keywords, words)
  const percent = Math.round(video.rareRatio * 100)

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={video.title}
      description={`${video.speaker} · ${formatDuration(video.durationSec)}`}
      actions={
        watched ? (
          <>
            <Button label="Desfazer assistido" variant="ghost" onClick={onToggleWatched} />
            <Button label="Fechar" variant="primary" onClick={onClose} />
          </>
        ) : (
          <>
            <Button label="Fechar" variant="secondary" onClick={onClose} />
            <Button label="Marquei como assistido" variant="primary" icon="Check" onClick={onToggleWatched} />
          </>
        )
      }
    >
      <div className="gw-video-detail">
        {/* mounted only while the dialog is open: closing it stops the video */}
        <div className="gw-video-player">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
            title={`${video.title} — ${video.speaker}`}
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        <Text>
          Nível <strong>{LEVEL_LABEL[video.level]}</strong>: {video.wpm} palavras por minuto · {percent}% de palavras pouco
          comuns.
        </Text>
        <Text variant="caption" tone="secondary">
          Estimativa calculada pela transcrição (velocidade da fala e palavras fora da lista NGSL das mais comuns do inglês).
          Não é uma certificação de nível.
        </Text>

        <div className="gw-video-keywords">
          <Text variant="label">Palavras para aprender</Text>
          {keywords.length ? (
            <div className="gw-chips-left" role="group" aria-label="Palavras do vídeo">
              {keywords.map((k) => (
                <Button key={k} label={k} variant="secondary" compact onClick={() => onOpenSearch(k)} />
              ))}
            </div>
          ) : (
            <Text tone="secondary">Você já tem todas as palavras-chave deste vídeo no dicionário.</Text>
          )}
        </div>

        <div className="gw-video-links">
          <TextLink href={video.tedUrl} external>
            Ver no TED
          </TextLink>
          <TextLink href={`https://www.youtube.com/watch?v=${video.youtubeId}`} external>
            Abrir no YouTube
          </TextLink>
          <Text variant="caption" tone="secondary">
            Talk: TED (ted.com), licença CC BY–NC–ND 4.0.
          </Text>
        </div>
      </div>
    </Dialog>
  )
}
