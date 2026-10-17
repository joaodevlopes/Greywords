import { Badge } from 'beds'
import { formatDuration, LEVEL_LABEL } from '../videos.js'

export default function VideoCard({ video, watched, onOpen }) {
  return (
    <button type="button" className="gw-video-card" onClick={onOpen}>
      <span className="gw-video-thumb">
        <img src={video.thumb} alt="" loading="lazy" />
        <span className="gw-video-duration">{formatDuration(video.durationSec)}</span>
      </span>
      <span className="gw-video-body">
        <span className="gw-video-title">{video.title}</span>
        <span className="gw-video-speaker">{video.speaker}</span>
        <span className="gw-video-badges">
          <Badge label={LEVEL_LABEL[video.level]} purpose="tag" />
          {watched && <Badge label="Assistido" tone="success" purpose="status" />}
        </span>
      </span>
    </button>
  )
}
