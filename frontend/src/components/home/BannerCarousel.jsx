import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CarouselArrows, CarouselDots } from '../ui/Carousel.jsx'
import { intervalSeconds, visibleSlides } from '../../lib/carousel.js'
import { resolveLink } from '../../lib/pageContent.js'

// Carrusel de eventos de Inicio (Páginas › Carrusel en el panel). Cada
// diapositiva es un banner completo (8:3) con el texto ya dibujado.
//
// Accesibilidad: avanza solo cada N segundos pero se detiene al pasar el
// ratón o el foco y con el botón de pausa; con «reducir movimiento» empieza
// pausado. Las diapositivas ocultas no reciben foco (inert).

// Los banners del diseño tienen una copia de 1280 px para pantallas pequeñas.
function srcSetOf(url) {
  if (!/^\/img\/carrusel\/[a-z0-9-]+\.webp$/.test(url ?? '')) return undefined
  return `${url.replace(/\.webp$/, '-1280.webp')} 1280w, ${url} 2560w`
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function SlideImage({ slide, artMobile, eager }) {
  return (
    <picture>
      {artMobile && slide.imageMobile ? <source media="(max-width: 640px)" srcSet={slide.imageMobile} /> : null}
      <img
        src={slide.image}
        srcSet={srcSetOf(slide.image)}
        sizes="(min-width: 1440px) 1281px, calc(100vw - 40px)"
        alt={slide.alt || slide.title || ''}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
      />
    </picture>
  )
}

function SlideBody({ slide, artMobile, eager, preview, swallowClick }) {
  const link = resolveLink(slide.link)
  const image = <SlideImage slide={slide} artMobile={artMobile} eager={eager} />
  const cta = slide.cta?.trim() && link.available ? (
    <span className="banner-carousel__cta">
      {slide.cta.trim()}
      <span aria-hidden="true"> →</span>
    </span>
  ) : null

  if (!link.available || preview) {
    return (
      <div className="banner-carousel__media">
        {image}
        {cta}
      </div>
    )
  }
  if (link.external) {
    return (
      <a className="banner-carousel__media" href={link.to} target="_blank" rel="noopener noreferrer" onClickCapture={swallowClick}>
        {image}
        {cta}
        <span className="visually-hidden"> (se abre en otra pestaña)</span>
      </a>
    )
  }
  return (
    <Link className="banner-carousel__media" to={link.to} onClickCapture={swallowClick}>
      {image}
      {cta}
    </Link>
  )
}

export default function BannerCarousel({ content, preview = false }) {
  const slides = useMemo(() => visibleSlides(content?.slides), [content])
  const count = slides.length
  const [index, setIndex] = useState(0)
  const current = count > 0 ? Math.min(index, count - 1) : 0
  const [paused, setPaused] = useState(reducedMotion)
  const [hold, setHold] = useState(false)
  const drag = useRef(null)
  const moved = useRef(false)

  const autoplay = content?.autoplay !== false && count > 1
  const playing = autoplay && !paused && !hold
  const delay = intervalSeconds(content?.interval) * 1000

  useEffect(() => {
    if (!playing) return undefined
    const timer = window.setTimeout(() => setIndex((current + 1) % count), delay)
    return () => window.clearTimeout(timer)
  }, [playing, current, count, delay])

  if (!content?.enabled || count === 0) return null

  const go = (position) => setIndex(((position % count) + count) % count)
  // Fotos de celular solo si todas las visibles la tienen (mismo alto para todas).
  const artMobile = slides.every((slide) => slide.imageMobile)

  // Deslizar con el dedo (el desplazamiento vertical sigue funcionando: touch-action).
  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse' || count < 2) return
    drag.current = { x: event.clientX, y: event.clientY }
    moved.current = false
  }
  const onPointerUp = (event) => {
    const start = drag.current
    drag.current = null
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      moved.current = true
      go(current + (dx < 0 ? 1 : -1))
    }
  }
  const swallowClick = (event) => {
    if (moved.current) {
      event.preventDefault()
      moved.current = false
    }
  }

  return (
    <section
      className={`banner-carousel${artMobile ? ' banner-carousel--art-mobile' : ''}${preview ? ' banner-carousel--preview' : ''}`}
      aria-roledescription="carrusel"
      aria-label={content.label || 'Eventos en Gramalote'}
    >
      <div className={preview ? undefined : 'container'}>
        <div
          className="banner-carousel__frame"
          onMouseEnter={() => setHold(true)}
          onMouseLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHold(false)
          }}
        >
          <div
            className="banner-carousel__viewport"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              drag.current = null
            }}
          >
            <div
              className="banner-carousel__track"
              style={{ transform: `translateX(-${current * 100}%)` }}
              aria-live={playing ? 'off' : 'polite'}
            >
              {slides.map((slide, position) => (
                <div
                  key={slide.id}
                  className="banner-carousel__slide"
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${position + 1} de ${count}: ${slide.title || 'Evento'}`}
                  aria-hidden={position !== current}
                  inert={position !== current}
                >
                  <SlideBody
                    slide={slide}
                    artMobile={artMobile}
                    eager={position === 0}
                    preview={preview}
                    swallowClick={swallowClick}
                  />
                </div>
              ))}
            </div>
          </div>
          <CarouselArrows count={count} onPrev={() => go(current - 1)} onNext={() => go(current + 1)} />
        </div>

        {count > 1 ? (
          <div className="banner-carousel__controls">
            {autoplay ? (
              <button
                type="button"
                className="banner-carousel__pause"
                aria-label={paused ? 'Reanudar el carrusel' : 'Pausar el carrusel'}
                onClick={() => setPaused((value) => !value)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  {paused ? <path d="M5 3.5v9l7-4.5z" /> : <path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" />}
                </svg>
              </button>
            ) : null}
            <CarouselDots count={count} index={current} onGo={go} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
