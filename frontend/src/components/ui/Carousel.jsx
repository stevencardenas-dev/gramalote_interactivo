import Icon from './Icon.jsx'

// Flechas sobre el contenedor (position: relative) y puntos debajo.
export function CarouselArrows({ count, onPrev, onNext }) {
  if (count < 2) return null
  return (
    <>
      <button
        className="carousel-arrow carousel-arrow--left"
        type="button"
        aria-label="Anterior"
        onClick={onPrev}
      >
        <Icon name="chevron" />
      </button>
      <button
        className="carousel-arrow carousel-arrow--right"
        type="button"
        aria-label="Siguiente"
        onClick={onNext}
      >
        <Icon name="chevron" />
      </button>
    </>
  )
}

export function CarouselDots({ count, index, onGo, overlay = false }) {
  if (count < 2) return null
  return (
    <div className={`carousel-dots${overlay ? ' carousel-dots--overlay' : ''}`}>
      {Array.from({ length: count }, (_, position) => (
        <button
          key={position}
          type="button"
          className={position === index ? 'is-active' : undefined}
          aria-label={`Ir a la imagen ${position + 1}`}
          aria-current={position === index ? 'true' : undefined}
          onClick={() => onGo(position)}
        />
      ))}
    </div>
  )
}
