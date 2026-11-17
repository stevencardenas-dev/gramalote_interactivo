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

// Antes de tocar el reloj de la animación, lee `docs/INCIDENCIAS.md` § 7 (y
// AGENTS.md § «Componentes delicados»). Dos reglas: (1) no arrancar hasta que la primera foto esté
// decodificada y pintada; (2) avanzar con recorrido acumulado y tope de 250 ms
// por fotograma. Romper cualquiera de las dos devuelve el carrusel trabado
// (arranque a tirones y saltos de foto al volver de otra pestaña).

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

  // Con varios encabezados la ficha los va rotando solos; hay botón de pausa.
  // Arranca en movimiento aunque el sistema pida «reducir movimiento»: quien
  // lo necesite tiene el botón para detenerlo.
  const slides = images?.length ? images : image ? [image] : []
  const total = slides.length
  const multiple = total > 1
  // Identifica el juego de fotos: con esto se espera a que la primera esté
  // lista y no se vuelve a esperar si la ficha no cambió.
  const slidesKey = slides.join('|')
  const trackRef = useRef(null)
  // `progress` es la posición (0..total); `base`, la posición al empezar el
  // tramo actual de animación.
  const progress = useRef(0)
  const base = useRef(0)
  const [dot, setDot] = useState(0)
  const [paused, setPaused] = useState(false)
  const [retarget, setRetarget] = useState(0)
  // El movimiento no arranca hasta que la primera foto está decodificada y
  // pintada: si no, el reloj corre mientras el navegador decodifica la foto
  // grande y el carrusel se ve trabado los primeros segundos.
  const [readyKey, setReadyKey] = useState('')
  const ready = multiple && readyKey === slidesKey

  useEffect(() => {
    if (!multiple) return undefined
    const first = trackRef.current?.querySelector('img')
    if (!first) return undefined
    let alive = true
    let frame
    // Dos vueltas al bucle de pintado: el compuesto ya tiene la foto dentro.
    const start = () => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (alive) setReadyKey(slidesKey)
        })
      })
    }
    // `complete` también es true si la foto falló: en ese caso no llega ningún
    // evento y el carrusel se quedaría quieto.
    if (first.complete) {
      start()
    } else {
      first.addEventListener('load', start, { once: true })
      first.addEventListener('error', start, { once: true })
    }
    return () => {
      alive = false
      if (frame) cancelAnimationFrame(frame)
      first.removeEventListener('load', start)
      first.removeEventListener('error', start)
    }
  }, [multiple, slidesKey])

  // Las demás fotos se decodifican por detrás: así no hay tirón cuando una
  // nueva entra al encabezado.
  useEffect(() => {
    if (!multiple) return
    slidesKey
      .split('|')
      .slice(1)
      .filter(Boolean)
      .forEach((src) => {
        const image = new Image()
        image.decoding = 'async'
        image.src = src
      })
  }, [multiple, slidesKey])

  // Carrusel continuo: las fotos se deslizan sin parar hacia la izquierda; al
  // terminar la última asoma otra vez la primera (hay una copia al final). El
  // puntito cambia cuando una foto pasa de la mitad de su recorrido. Se mueve
  // con requestAnimationFrame y no con CSS porque la hoja global anula las
  // animaciones CSS cuando el visitante pidió «reducir movimiento».
  useEffect(() => {
    if (!multiple || paused || !ready) return undefined
    base.current = progress.current
    let frame
    let last = performance.now()
    // Recorrido acumulado en milisegundos con un tope por fotograma: si el
    // navegador se queda ocupado (foto decodificándose, vuelta desde otra
    // pestaña) el carrusel avanza solo 250 ms en ese hueco. Ni salta como con
    // el reloj, ni se congela como cuando se descartaba el hueco entero.
    let travelled = 0
    let shown = -1
    const MAX_STEP = 250
    function tick(now) {
      travelled += Math.min(now - last, MAX_STEP)
      last = now
      const value = (base.current + travelled / (SLIDE_SECONDS * 1000)) % total
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
  }, [multiple, paused, total, retarget, ready])

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
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'low'}
              />
            ))}
          </div>
        ) : image || slides[0] ? (
          <img src={slides[0]} alt={imageAlt} decoding="async" fetchPriority="high" />
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
