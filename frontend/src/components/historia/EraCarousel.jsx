import { useState } from 'react'
import { CarouselArrows, CarouselDots } from '../ui/Carousel.jsx'

// Carrusel de fotos por época de un patrimonio. Cada foto lleva su rango de
// años como etiqueta; las flechas y los puntos son botones (teclado y lectores).
export default function EraCarousel({ photos, name }) {
  const [index, setIndex] = useState(0)
  const count = photos.length
  const photo = photos[index]

  return (
    <div className="era-carousel" role="group" aria-roledescription="carrusel" aria-label={`Fotos de ${name} por época`}>
      <div className="era-carousel__stage">
        <img key={photo.src} src={photo.src} alt={photo.alt} />
        <span className="era-carousel__badge">{photo.label}</span>
        <CarouselArrows
          count={count}
          onPrev={() => setIndex((index - 1 + count) % count)}
          onNext={() => setIndex((index + 1) % count)}
        />
      </div>
      <p className="visually-hidden" aria-live="polite">
        Foto {index + 1} de {count}: {photo.label}
      </p>
      <CarouselDots count={count} index={index} onGo={setIndex} />
    </div>
  )
}
