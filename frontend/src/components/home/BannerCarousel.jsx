import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CarouselArrows } from '../ui/Carousel.jsx'
import { intervalSeconds, visibleSlides } from '../../lib/carousel.js'
import { resolveLink } from '../../lib/pageContent.js'

// Carrusel de eventos de Inicio (Páginas › Carrusel en el panel). Cada
// diapositiva es un banner completo (8:3) con el texto ya dibujado.
//
// Reglas del avance automático (no hay botón de pausa):
// - Cambia cada N segundos (mínimo 6) y una barra inferior muestra cuánto falta.
// - Se detiene al instante con el ratón encima, el foco del teclado o un dedo
//   sobre la tarjeta, cuando el carrusel sale de la pantalla y con la pestaña
//   oculta (la barra se congela y sigue donde iba).
// - Si la persona cambia de diapositiva a mano (flechas, puntos, teclado o
//   deslizando), el avance automático se apaga el resto de la sesión.
// - Con «reducir movimiento» también avanza, pero cambia sin deslizar (CSS).
// - Los puntos son solo indicadores; se navega con flechas, teclado o el dedo.
// Las diapositivas ocultas no reciben foco (inert).

// Los banners del diseño tienen una copia de 1280 px para pantallas pequeñas.
function srcSetOf(url) {
  if (!/^\/img\/carrusel\/[a-z0-9-]+\.webp$/.test(url ?? '')) return undefined
  return `${url.replace(/\.webp$/, '-1280.webp')} 1280w, ${url} 2560w`
}

// Tras una interacción manual el carrusel no vuelve a moverse solo en la sesión.
const STOP_KEY = 'gramalote:carrusel-manual'

function readStopped() {
  try {
    return window.sessionStorage.getItem(STOP_KEY) === '1'
  } catch {
    return false
  }
}

function saveStopped() {
  try {
    window.sessionStorage.setItem(STOP_KEY, '1')
  } catch {
    // Sin almacenamiento: dura lo que la página.
  }
}

// Fracción del ancho que hay que arrastrar para pasar de diapositiva.
const SWIPE_THRESHOLD = 0.18

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
  const cta =
    slide.cta?.trim() && link.available ? (
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
      <a
        className="banner-carousel__media"
        href={link.to}
        target="_blank"
        rel="noopener noreferrer"
        onClickCapture={swallowClick}
      >
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
  // En la vista previa del panel no se recuerda la parada entre visitas.
  const [stopped, setStopped] = useState(() => !preview && readStopped())
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [touching, setTouching] = useState(false)
  const [inView, setInView] = useState(true)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [dragX, setDragX] = useState(0)
  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const drag = useRef(null)
  const moved = useRef(false)

  const autoplay = content?.autoplay !== false && count > 1 && !stopped
  const held = hover || focus || touching || !inView || !pageVisible
  const delay = intervalSeconds(content?.interval) * 1000

  // Reloj del avance: cuenta solo mientras corre y conserva lo que faltaba al
  // pausar. La barra es solo el reflejo visual (su animación se congela igual).
  const remaining = useRef(delay)
  const timedSlide = useRef(current)
  const running = autoplay && !held && dragX === 0
  useEffect(() => {
    if (timedSlide.current !== current) {
      timedSlide.current = current
      remaining.current = delay
    }
    if (!running) return undefined
    const startedAt = performance.now()
    const timer = window.setTimeout(() => {
      remaining.current = delay
      setIndex((value) => (Math.min(value, count - 1) + 1) % count)
    }, Math.max(0, remaining.current))
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt))
    }
  }, [running, current, delay, count])

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [count])

  if (!content?.enabled || count === 0) return null

  const wrap = (position) => ((position % count) + count) % count

  // Cambio hecho por la persona: apaga el avance automático en la sesión.
  const goManual = (position) => {
    setIndex(wrap(position))
    if (!stopped) {
      setStopped(true)
      if (!preview) saveStopped()
    }
  }

  // Fotos de celular solo si todas las visibles la tienen (mismo alto para todas).
  const artMobile = slides.every((slide) => slide.imageMobile)

  // Deslizar con el dedo: la tarjeta sigue al dedo y al soltar pasa o vuelve.
  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse') return
    setTouching(true)
    if (count < 2) return
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      width: viewportRef.current?.offsetWidth || 1,
      axis: null,
    }
    moved.current = false
  }
  const onPointerMove = (event) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.axis && Math.abs(dx) + Math.abs(dy) > 8) start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (start.axis === 'x') setDragX(dx)
  }
  const endDrag = (event, cancelled = false) => {
    const start = drag.current
    drag.current = null
    setTouching(false)
    setDragX(0)
    if (!start || start.axis !== 'x') return
    const dx = cancelled ? 0 : event.clientX - start.x
    if (Math.abs(dx) > 8) moved.current = true
    if (Math.abs(dx) > start.width * SWIPE_THRESHOLD) goManual(current + (dx < 0 ? 1 : -1))
  }
  const swallowClick = (event) => {
    if (moved.current) {
      event.preventDefault()
      moved.current = false
    }
  }
  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') goManual(current + 1)
    else if (event.key === 'ArrowLeft') goManual(current - 1)
  }

  const dragging = dragX !== 0
  const trackStyle = {
    transform: `translateX(calc(${-current * 100}% + ${dragX}px))`,
    transition: dragging ? 'none' : undefined,
  }

  return (
    <section
      ref={sectionRef}
      className={`banner-carousel${artMobile ? ' banner-carousel--art-mobile' : ''}${preview ? ' banner-carousel--preview' : ''}`}
      aria-roledescription="carrusel"
      aria-label={content.label || 'Eventos en Gramalote'}
    >
      <div className={preview ? undefined : 'container'}>
        <div
          className="banner-carousel__frame"
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHover(true)}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setHover(false)}
          onFocus={() => setFocus(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false)
          }}
          onKeyDown={onKeyDown}
        >
          <div
            ref={viewportRef}
            className="banner-carousel__viewport"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(event) => endDrag(event)}
            onPointerCancel={(event) => endDrag(event, true)}
          >
            <div className="banner-carousel__track" style={trackStyle} aria-live={autoplay && !held ? 'off' : 'polite'}>
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
            {autoplay ? (
              <div className={`banner-carousel__progress${held ? ' is-held' : ''}`} aria-hidden="true">
                <span
                  key={`${current}-${delay}`}
                  className="banner-carousel__progress-bar"
                  style={{
                    animationDuration: `${delay}ms`,
                    '--bar-duration': `${delay}ms`,
                    animationPlayState: running ? 'running' : 'paused',
                  }}
                />
              </div>
            ) : null}
          </div>
          <CarouselArrows count={count} onPrev={() => goManual(current - 1)} onNext={() => goManual(current + 1)} />
        </div>

        {count > 1 ? (
          <div className="banner-carousel__controls">
            <span className="banner-carousel__dots" aria-hidden="true">
              {slides.map((slide, position) => (
                <span key={slide.id} className={position === current ? 'is-active' : undefined} />
              ))}
            </span>
            <span className="banner-carousel__count">
              {current + 1} / {count}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
