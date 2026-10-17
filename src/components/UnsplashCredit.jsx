import { Fragment } from 'react'
import { UNSPLASH_HOME, unsplashCredits } from '../imageQuery.js'

// Visible credit for the Unsplash photos on screen, as the Unsplash API guidelines ask: each photographer
// linked to their Unsplash profile, and Unsplash linked (links carry utm_source=greywords).
// "Foto de Ana no Unsplash" / "Fotos de Ana, Bia e Caio no Unsplash". Renders nothing without Unsplash photos.
export default function UnsplashCredit({ images }) {
  const people = unsplashCredits(images)
  if (!people.length) return null
  return (
    <p className="gw-image-credit">
      {people.length > 1 ? 'Fotos de ' : 'Foto de '}
      {people.map((p, i) => (
        <Fragment key={p.link ?? p.name}>
          {i > 0 && (i === people.length - 1 ? ' e ' : ', ')}
          {p.link ? (
            <a href={p.link} target="_blank" rel="noreferrer">
              {p.name}
            </a>
          ) : (
            p.name
          )}
        </Fragment>
      ))}{' '}
      no{' '}
      <a href={UNSPLASH_HOME} target="_blank" rel="noreferrer">
        Unsplash
      </a>
    </p>
  )
}
