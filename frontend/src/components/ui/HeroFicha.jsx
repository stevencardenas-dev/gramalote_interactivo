import { useStartsPaused } from '../../lib/useReducedMotion.js'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import RatingStars from './RatingStars.jsx'
import SocialIcon from './SocialIcon.jsx'

const NETWORKS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
}

function ShareButton({ title }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // El usuario canceló o el navegador bloqueó el portapapeles.
    }
  }

  return (
    <button
      type="button"
      className="social-dot"
      onClick={share}
      aria-label={copied ? 'Enlace copiado' : 'Compartir'}
      title={copied ? 'Enlace copiado' : 'Compartir'}
    >
      <Icon name="share" />
    </button>
  )
}

function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Migas de pan">
      <ol className="breadcrumb">
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} aria-current={current ? 'page' : undefined}>
              {current || !item.to ? item.label : <Link to={item.to}>{item.label}</Link>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Segundos que tarda una foto en recorrer todo el ancho (deslizamiento continuo).
const SLIDE_SECONDS = 12

function paint(track, value, total) {
  if (!track) return
  track.style.transform = `translate3d(-${(value * 100) / (total + 1)}%, 0, 0)`
}

export default function HeroFicha({
  breadcrumb,
  eyebrow,
  title,
  summary,
  image,
  images,
  imageAlt = '',
  pillTone = 'olive',
  social = ['share'],
  links = [],
  dots = true,
  rating,
}) {
  const canShare = Array.isArray(social) ? social.includes('share') : Boolean(social)
  const networks = links.filter((link) => NETWORKS[link.platform] && link.url)

  // Con varios encabezados la ficha los va rotando solos; hay botón de pausa
  // (y con «reducir movimiento» el cambio es instantáneo, sin fundido).
  const slides = images?.length ? images : image ? [image] : []
  const total = slides.length
  const multiple = total > 1
  const trackRef = useRef(null)
  // La posición (0..total) sale del reloj, no de sumar fotogramas: con fotos
  // grandes el navegador baja de 20 fps y, sumando fotogramas con tope, la
  // rotación se arrastraba. `base` es la posición al empezar este tramo y
  // `since` el instante en que empezó.
  const progress = useRef(0)
  const base = useRef(0)
  const since = useRef(0)
  const [dot, setDot] = useState(0)
  const [paused, setPaused] = useStartsPaused()
  const [retarget, setRetarget] = useState(0)

  // Carrusel continuo: las fotos se deslizan sin parar hacia la izquierda; al
  // terminar la última asoma otra vez la primera (hay una copia al final). El
  // puntito cambia cuando una foto pasa de la mitad de su recorrido. Se mueve
  // con requestAnimationFrame y no con CSS porque la hoja global anula las
  // animaciones CSS cuando el visitante pidió «reducir movimiento».
  useEffect(() => {
    if (!multiple || paused) return undefined
    base.current = progress.current
    since.current = performance.now()
    let frame
    let last = since.current
    let shown = -1
    function tick(now) {
      const gap = now - last
      last = now
      // Al entrar en la ficha (o al volver de una pestaña oculta) el primer
      // fotograma llega con mucho retraso, y con el reloj la primera foto
      // aparecía a mitad de camino. Se descarta ese hueco; los tirones normales
      // de la máquina (hasta 200 ms) sí cuentan, para no frenar el ritmo.
      if (gap > 200) since.current += gap - 16
      const value = (base.current + (now - since.current) / (SLIDE_SECONDS * 1000)) % total
      progress.current = value
      paint(trackRef.current, value, total)
      const next = Math.round(value) % total
      if (next !== shown) {
        shown = next
        setDot(next)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [multiple, paused, total, retarget])

  function goTo(index) {
    progress.current = index
    paint(trackRef.current, index, total)
    setDot(index)
    setRetarget((value) => value + 1)
  }

  const track = multiple ? [...slides, slides[0]] : slides

  return (
    <section className="ficha-hero">
      <div className="ficha-hero__bg">
        {multiple ? (
          <div
            ref={trackRef}
            className="ficha-hero__track"
            style={{ '--n': total }}
          >
            {track.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt={index === dot ? imageAlt : ''}
              />
            ))}
          </div>
        ) : image || slides[0] ? (
          <img src={slides[0]} alt={imageAlt} />
        ) : null}
      </div>

      <div className="container ficha-hero__inner">
        <Breadcrumb items={breadcrumb} />

        <div className="ficha-hero__center">
          {networks.length || canShare ? (
            <div className="ficha-hero__social">
              {networks.map((link) => (
                <a
                  key={link.platform}
                  className="social-dot"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={NETWORKS[link.platform]}
                  title={NETWORKS[link.platform]}
                >
                  <SocialIcon name={link.platform} />
                <span className="visually-hidden"> (se abre en una pestaña nueva)</span></a>
              ))}
              {canShare ? <ShareButton title={title} /> : null}
            </div>
          ) : null}

          {eyebrow ? (
            <span className={`ficha-hero__pill ficha-hero__pill--${pillTone}`}>{eyebrow}</span>
          ) : null}

          <h1>{title}</h1>

          {summary ? <p className="ficha-hero__summary">{summary}</p> : null}

          {rating ? <RatingStars kind={rating.kind} slug={rating.slug} title={title} /> : null}

          {/* Pausa y puntitos comparten fila en las dos fichas: el botón no
              cambia de sitio según la cantidad de fotos ni de encabezado. */}
          {multiple ? (
            <div className="ficha-hero__controls">
              {dots ? (
                <div className="ficha-hero__dots">
                  {slides.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      className={index === dot ? 'is-active' : undefined}
                      aria-label={`Ver foto ${index + 1} de ${slides.length}`}
                      aria-current={index === dot}
                      onClick={() => goTo(index)}
                    />
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className="ficha-hero__pause"
                aria-pressed={paused}
                aria-label={paused ? 'Reanudar el movimiento de las fotos' : 'Pausar el movimiento de las fotos'}
                title={paused ? 'Reanudar' : 'Pausar'}
                onClick={() => setPaused((value) => !value)}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  {paused ? (
                    <path d="M5 3.2v9.6L12.6 8z" />
                  ) : (
                    <path d="M4.5 3h2.6v10H4.5zM8.9 3h2.6v10H8.9z" />
                  )}
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
