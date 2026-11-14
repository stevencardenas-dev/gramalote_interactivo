import { useStartsPaused } from '../../lib/useReducedMotion.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CarouselArrows } from '../ui/Carousel.jsx'
import { intervalSeconds, timingSeconds, visibleSlides } from '../../lib/carousel.js'
import { resolveLink } from '../../lib/pageContent.js'

// Carrusel de eventos de Inicio (Páginas › Carrusel en el panel). Cada
// diapositiva es un banner completo (8:3) con el texto ya dibujado.
//
// Reglas del avance automático (no hay botón de pausa; los tiempos se editan
// en el panel):
// - Cambia cada `interval` segundos (mínimo 6) y una barra inferior muestra
//   cuánto falta.
// - Se detiene al instante con el ratón encima, el foco del teclado o un dedo
//   sobre la tarjeta, cuando el carrusel sale de la pantalla y con la pestaña
//   oculta. La barra se congela (sin desaparecer) y sigue donde iba.
// - Al soltar el dedo tras mantenerlo presionado, sigue en pausa
//   `touchResume` segundos más.
// - Si la persona cambia de diapositiva a mano (flechas, teclado o deslizando)
//   la barra se oculta y el avance vuelve tras `manualResume` segundos sin
//   otro cambio manual.
// - Con «reducir movimiento» también avanza, pero cambia sin deslizar (CSS).
// - Los puntos son solo indicadores.
// Las diapositivas ocultas no reciben foco (inert).

// Los banners del diseño tienen una copia de 1280 px para pantallas pequeñas.
function srcSetOf(url) {
  if (!/^\/img\/carrusel\/[a-z0-9-]+\.webp$/.test(url ?? '')) return undefined
  return `${url.replace(/\.webp$/, '-1280.webp')} 1280w, ${url} 2560w`
}

// Fracción del ancho que hay que arrastrar para pasar de diapositiva.
const SWIPE_THRESHOLD = 0.18
// Movimiento (px) a partir del cual un toque cuenta como arrastre.
const DRAG_START = 8

function SlideBody({ slide, eager, preview, swallowClick }) {
  const link = resolveLink(slide.link)
  const image = (
    <img
      src={slide.image}
      srcSet={srcSetOf(slide.image)}
      sizes="(min-width: 1440px) 1281px, calc(100vw - 40px)"
      alt={slide.alt || slide.title || ''}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
    />
  )
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
        <span className="visually-hidden"> (se abre en otra pestaña)</span></a>
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
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [touching, setTouching] = useState(false)
  const [touchHold, setTouchHold] = useState(false)
  const [manual, setManual] = useState(false)
  const [userPaused, setUserPaused] = useStartsPaused()
  const [inView, setInView] = useState(true)
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [dragX, setDragX] = useState(0)
  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const drag = useRef(null)
  const moved = useRef(false)
  const touchTimer = useRef(0)
  const manualTimer = useRef(0)

  const delay = intervalSeconds(content?.interval) * 1000
  const touchResume = timingSeconds(content?.touchResume, 'touchResume') * 1000
  const manualResume = timingSeconds(content?.manualResume, 'manualResume') * 1000
  const autoplay = content?.autoplay !== false && count > 1
  const showBar = autoplay && !manual
  const held = userPaused || hover || focus || touching || touchHold || !inView || !pageVisible
  const running = showBar && !held && dragX === 0

  // Reloj del avance: cuenta solo mientras corre y conserva lo que faltaba al
  // pausar. La barra es solo el reflejo visual (su animación se congela igual).
  const remaining = useRef(delay)
  const timedSlide = useRef(current)
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

  // Al desmontar no quedan temporizadores vivos.
  useEffect(
    () => () => {
      window.clearTimeout(touchTimer.current)
      window.clearTimeout(manualTimer.current)
    },
    [],
  )

  if (!content?.enabled || count === 0) return null

  const wrap = (position) => ((position % count) + count) % count

  // Cambio hecho por la persona: oculta la barra y el avance vuelve tras
  // `manualResume` sin otro cambio manual.
  const goManual = (position) => {
    setIndex(wrap(position))
    setManual(true)
    window.clearTimeout(touchTimer.current)
    setTouchHold(false)
    window.clearTimeout(manualTimer.current)
    manualTimer.current = window.setTimeout(() => setManual(false), manualResume)
  }

  // Dedo sobre la tarjeta: pausa; al soltar sigue pausado `touchResume` y si
  // desliza la tarjeta sigue al dedo y al soltar pasa o vuelve.
  const onPointerDown = (event) => {
    if (event.pointerType === 'mouse') return
    window.clearTimeout(touchTimer.current)
    setTouchHold(false)
    setTouching(true)
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
    if (!start || count < 2) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.axis && Math.abs(dx) + Math.abs(dy) > DRAG_START) start.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (start.axis === 'x') setDragX(dx)
  }
  const endDrag = (event, cancelled = false) => {
    const start = drag.current
    drag.current = null
    setTouching(false)
    setDragX(0)
    if (!start) return
    const dx = cancelled || start.axis !== 'x' ? 0 : event.clientX - start.x
    if (Math.abs(dx) > DRAG_START) moved.current = true
    if (Math.abs(dx) > start.width * SWIPE_THRESHOLD) {
      goManual(current + (dx < 0 ? 1 : -1))
      return
    }
    // Se desplazó la página en vertical: no es una pausa de la tarjeta.
    if (cancelled || start.axis === 'y') return
    setTouchHold(true)
    touchTimer.current = window.setTimeout(() => setTouchHold(false), touchResume)
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
      className={`banner-carousel${preview ? ' banner-carousel--preview' : ''}`}
      aria-roledescription="carrusel"
      aria-label={content.label || 'Eventos en Gramalote'}
    >
      <div className={preview ? undefined : 'container'}>
        <div
          className="banner-carousel__frame"
          onPointerEnter={(event) => event.pointerType === 'mouse' && setHover(true)}
          onPointerLeave={(event) => event.pointerType === 'mouse' && setHover(false)}
          // Solo el foco de teclado pausa: el de un clic en una flecha no.
          onFocus={(event) => setFocus(event.target.matches?.(':focus-visible') ?? false)}
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
            onContextMenu={(event) => {
              // Mantener presionado en celular no abre el menú de la imagen.
              if (touching) event.preventDefault()
            }}
          >
            <div className="banner-carousel__track" style={trackStyle} aria-live={running ? 'off' : 'polite'}>
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
                  <SlideBody slide={slide} eager={position === 0} preview={preview} swallowClick={swallowClick} />
                </div>
              ))}
            </div>
            {showBar ? (
              <div className={`banner-carousel__progress${running ? '' : ' is-held'}`} aria-hidden="true">
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
            {autoplay ? (
              <button
                type="button"
                className="banner-carousel__pause"
                aria-pressed={userPaused}
                aria-label={userPaused ? 'Reanudar el cambio automático de banners' : 'Pausar el cambio automático de banners'}
                title={userPaused ? 'Reanudar' : 'Pausar'}
                onClick={() => setUserPaused((value) => !value)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  {userPaused ? <path d="M5 3.2v9.6L12.6 8z" /> : <path d="M4.5 3h2.6v10H4.5zM8.9 3h2.6v10H8.9z" />}
                </svg>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
