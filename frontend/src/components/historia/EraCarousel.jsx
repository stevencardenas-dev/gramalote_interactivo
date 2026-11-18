import { useState } from 'react'
import { CarouselArrows, CarouselDots } from '../ui/Carousel.jsx'
import PhotoNote, { PhotoBadge } from './PhotoNote.jsx'

// Carrusel de fotos de un patrimonio. Cada foto lleva su pie de foto (o, en
// filas viejas, su época) como etiqueta; flechas y puntos son botones.
export default function EraCarousel({ photos, name }) {
  const [index, setIndex] = useState(0)
  const count = photos.length
  const photo = photos[index]
  const badge = photo.caption || photo.label

  return (
    <div className="era-carousel" role="group" aria-roledescription="carrusel" aria-label={`Fotos de ${name}`}>
      <div className="era-carousel__stage">
        <img key={photo.src} src={photo.src} alt={photo.alt} />
        <PhotoBadge text={badge} />
        <CarouselArrows
          count={count}
          onPrev={() => setIndex((index - 1 + count) % count)}
          onNext={() => setIndex((index + 1) % count)}
        />
      </div>
      <p className="visually-hidden" aria-live="polite">
        Foto {index + 1} de {count}{badge ? `: ${badge}` : ''}
      </p>
      <PhotoNote credit={photo.credit} />
      <CarouselDots count={count} index={index} onGo={setIndex} />
    </div>
  )
}
