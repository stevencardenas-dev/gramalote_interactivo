import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import SectionNav from '../components/historia/SectionNav.jsx'
import { chapters, getChapter, getChapterIndex } from '../data/historia.js'
import { usePageTitle } from '../lib/usePageTitle.js'

// Navegación del capítulo:
//   · escritorio: las flechas del teclado recorren la línea del tiempo; al
//     pasar del primer o del último acontecimiento se cambia de capítulo.
//   · móvil: cada acontecimiento ocupa la pantalla y el scroll encaja uno a
//     uno (como en TikTok); un deslizamiento lateral cambia de capítulo.
// En ambos casos una pista breve explica qué hacer, y el cierre repite la
// indicación en lugar de ofrecer botones.
const ANGOSTO = '(max-width: 980px)'
const SIN_MOVIMIENTO = '(prefers-reduced-motion: reduce)'
const TECLAS = {
  ArrowRight: 1,
  ArrowDown: 1,
  PageDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  PageUp: -1,
}

const esAngosto = () => window.matchMedia(ANGOSTO).matches
const esReducido = () => window.matchMedia(SIN_MOVIMIENTO).matches

// Los enlaces del panel y del menú tienen sus propios acordes: si el foco está
// en un campo de texto, las flechas deben mover el cursor y no la historia.
function escribiendo(elemento) {
  if (!(elemento instanceof Element)) return false
  return Boolean(elemento.closest('input, textarea, select, [contenteditable="true"]'))
}

export default function HistoriaCapitulo() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const chapter = getChapter(slug)
  const index = getChapterIndex(slug)
  const [progress, setProgress] = useState(0)
  // El paso y la pista guardan el capítulo al que pertenecen: al cambiar de
  // capítulo se reinician sin necesidad de un efecto que los reescriba.
  const [pasoEstado, setPasoEstado] = useState({ slug: null, index: 0 })
  const [pistaOculta, setPistaOculta] = useState(null)
  const storyRef = useRef(null)
  const pasoRef = useRef(-1)

  const paso = pasoEstado.slug === slug ? pasoEstado.index : 0
  const pista = Boolean(chapter) && pistaOculta !== slug

  usePageTitle(chapter ? chapter.title : 'Recorrido histórico')

  useEffect(() => {
    pasoRef.current = -1
  }, [slug])

  const irACapitulo = useCallback(
    (direccion) => {
      const destino = direccion === 'next' ? chapters[index + 1] : chapters[index - 1]
      if (destino) navigate(`/historia/recorrido/${destino.slug}`)
      else navigate(direccion === 'next' ? '/historia/patrimonio' : '/historia')
    },
    [index, navigate],
  )

  // Un paso = un acontecimiento. Si todavía no se ha entrado en la línea del
  // tiempo, el primer paso hacia delante lleva al primero de la lista.
  const moverPaso = useCallback(
    (salto) => {
      const story = storyRef.current
      if (!story) return
      const eventos = [...story.querySelectorAll('.his-event')]
      if (eventos.length === 0) return

      // Después del último acontecimiento viene el cierre del capítulo: así la
      // flecha no se salta ese texto camino al capítulo siguiente.
      const cierre = document.querySelector('.his-closing')
      const bloques = cierre ? [...eventos, cierre] : eventos

      const alto = window.innerHeight
      const dentro = story.getBoundingClientRect().top < alto * 0.8
      let actual = -1
      if (dentro) {
        let distancia = Infinity
        bloques.forEach((bloque, i) => {
          const caja = bloque.getBoundingClientRect()
          const d = Math.abs((caja.top + caja.bottom) / 2 - alto / 2)
          if (d < distancia) {
            distancia = d
            actual = i
          }
        })
      }

      const destino = actual + salto
      if (destino < 0) {
        irACapitulo('prev')
        return
      }
      if (destino >= bloques.length) {
        irACapitulo('next')
        return
      }

      bloques[destino].scrollIntoView({
        behavior: esReducido() ? 'auto' : 'smooth',
        // En el deck móvil cada bloque encaja al principio de la pantalla.
        block: esAngosto() ? 'start' : 'center',
      })
    },
    [irACapitulo],
  )

  // Pista de uso: aparece al entrar y desaparece con la primera acción.
  useEffect(() => {
    if (!chapter) return undefined
    const raiz = document.documentElement
    raiz.classList.add('his-deck')

    const ocultar = () => setPistaOculta(slug)
    const porTiempo = window.setTimeout(ocultar, 9000)
    const alDesplazar = () => {
      if (window.scrollY > 320) ocultar()
    }
    window.addEventListener('scroll', alDesplazar, { passive: true })

    return () => {
      raiz.classList.remove('his-deck')
      window.clearTimeout(porTiempo)
      window.removeEventListener('scroll', alDesplazar)
    }
  }, [chapter, slug])

  // Flechas del teclado (escritorio y también portátiles con teclado).
  useEffect(() => {
    if (!chapter) return undefined

    const alPulsar = (evento) => {
      if (evento.defaultPrevented || evento.altKey || evento.ctrlKey || evento.metaKey) return
      if (escribiendo(evento.target)) return
      const salto = TECLAS[evento.key]
      if (!salto) return
      evento.preventDefault()
      setPistaOculta(slug)
      moverPaso(salto)
    }

    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [chapter, moverPaso, slug])

  // Deslizamiento lateral en el móvil: cambia de capítulo sin botones.
  useEffect(() => {
    if (!chapter) return undefined

    let x0 = 0
    let y0 = 0
    let inicio = 0
    let ignorar = false

    const alTocar = (evento) => {
      const toque = evento.touches[0]
      if (!toque) return
      // La barra de secciones y el mapa se desplazan en horizontal.
      ignorar = Boolean(evento.target.closest('.his-nav, [data-sin-deslizar]'))
      x0 = toque.clientX
      y0 = toque.clientY
      inicio = Date.now()
    }

    const alSoltar = (evento) => {
      if (ignorar) return
      const toque = evento.changedTouches[0]
      if (!toque) return
      if (Date.now() - inicio > 900) return
      const dx = toque.clientX - x0
      const dy = toque.clientY - y0
      if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.8) return
      setPistaOculta(slug)
      irACapitulo(dx < 0 ? 'next' : 'prev')
    }

    window.addEventListener('touchstart', alTocar, { passive: true })
    window.addEventListener('touchend', alSoltar, { passive: true })
    return () => {
      window.removeEventListener('touchstart', alTocar)
      window.removeEventListener('touchend', alSoltar)
    }
  }, [chapter, irACapitulo, slug])

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [slug])

  // Lectura en curso, como en el prototipo de Stitch: el bloque que cruza la
  // banda central queda a plena luz (punto con halo, título en coral) y el
  // resto de su etapa se atenúa. Las fotos dan un pulso al activarse.
  //
  // Se mide con getBoundingClientRect en scroll (no con IntersectionObserver,
  // que en pestañas ocultas no entrega avisos), igual que Reveal.
  useEffect(() => {
    const story = storyRef.current
    if (!story) return undefined

    const eventos = [...story.querySelectorAll('.his-event')]
    let temporizador = 0

    const medir = () => {
      temporizador = 0
      const alto = window.innerHeight
      const arriba = alto * 0.2
      const abajo = alto * 0.6

      let candidato = null
      for (const evento of eventos) {
        const caja = evento.getBoundingClientRect()
        if (caja.bottom > arriba && caja.top < abajo) {
          candidato = evento
          break
        }
      }
      if (!candidato) {
        // Ninguno cruza la banda: se queda el más cercano al centro.
        let distancia = Infinity
        for (const evento of eventos) {
          const caja = evento.getBoundingClientRect()
          const d = Math.abs((caja.top + caja.bottom) / 2 - alto / 2)
          if (d < distancia) {
            distancia = d
            candidato = evento
          }
        }
      }
      if (!candidato) return

      // El bloque activo se guarda en estado (no como clase suelta): así el
      // resaltado y el contador sobreviven a los re-render de React.
      const numero = eventos.indexOf(candidato)
      if (numero >= 0 && numero !== pasoRef.current) {
        pasoRef.current = numero
        setPasoEstado({ slug, index: numero })
      }
    }

    const programar = () => {
      if (!temporizador) temporizador = window.setTimeout(medir, 80)
    }

    medir()
    window.addEventListener('scroll', programar, { passive: true })
    window.addEventListener('resize', programar)
    return () => {
      window.removeEventListener('scroll', programar)
      window.removeEventListener('resize', programar)
      if (temporizador) window.clearTimeout(temporizador)
    }
  }, [slug, chapter])

  if (!chapter) {
    return (
      <section className="section section--estado">
        <div className="container container--narrow">
          <p className="eyebrow">Recorrido histórico</p>
          <h1>Capítulo no encontrado</h1>
          <p className="page-intro">El capítulo que buscas no existe o cambió de dirección.</p>
          <Button to="/historia" icon="arrow">
            Volver a Conocer historia
          </Button>
        </div>
      </section>
    )
  }

  const previous = chapters[index - 1] ?? null
  const next = chapters[index + 1] ?? null
  const totalEvents = chapter.stages.reduce((sum, stage) => sum + stage.events.length, 0)

  // Índice global de cada etapa y del acontecimiento activo, para marcar el
  // bloque en curso y su etapa sin tocar el DOM a mano.
  const inicioEtapa = []
  chapter.stages.reduce((suma, stage, i) => {
    inicioEtapa[i] = suma
    return suma + stage.events.length
  }, 0)
  const activo = pasoEstado.slug === slug ? pasoEstado.index : -1

  return (
    <>
      <div className="his-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="his-cap-hero">
        <div className="container his-cap-hero__grid">
          <Reveal className="his-cap-hero__text">
            <p className="eyebrow his-cap-hero__eyebrow">
              <span className="his-dot" aria-hidden="true" />
              Recorrido histórico · Capítulo {chapter.number}
            </p>
            <h1>{chapter.title}</h1>
            <p className="his-cap-hero__intro">{chapter.heroText}</p>
            <a className="btn btn--primary" href="#etapa-1">
              Empezar la línea del tiempo
              <Icon name="chevron" className="btn__icon" />
            </a>
            <p className="his-cap-hero__meta">
              {chapter.stages.length} etapas · {totalEvents} acontecimientos
              <span className="his-cap-hero__keys">
                <kbd>←</kbd>
                <kbd>→</kbd>
                para recorrerlos
              </span>
            </p>
          </Reveal>
          <Reveal className="his-cap-hero__media" delay={140}>
            <img src={chapter.heroImage} alt={`Imagen del capítulo ${chapter.title}`} />
          </Reveal>
        </div>
      </header>

      <SectionNav />

      <p className={`his-step-counter${totalEvents > 1 ? ' is-visible' : ''}`} aria-hidden="true">
        {String(paso + 1).padStart(2, '0')}
        <span>/ {String(totalEvents).padStart(2, '0')}</span>
      </p>

      <div className="his-story" ref={storyRef} key={slug}>
        <div className="container">
          {chapter.stages.map((stage, stageIndex) => (
            <section
              key={stage.kicker}
              className={`his-stage${
                activo >= inicioEtapa[stageIndex] && activo < inicioEtapa[stageIndex] + stage.events.length
                  ? ' is-reading'
                  : ''
              }`}
              id={`etapa-${stageIndex + 1}`}
              aria-labelledby={`etapa-titulo-${stageIndex + 1}`}
            >
              <Reveal className="his-stage__band">
                <div className="his-stage__label">
                  <span className="his-stage__count">
                    Etapa {String(stageIndex + 1).padStart(2, '0')} / {String(chapter.stages.length).padStart(2, '0')}
                  </span>
                  <h2 id={`etapa-titulo-${stageIndex + 1}`}>{stage.title}</h2>
                </div>
                <p className="his-stage__note">{stage.kicker.split('·')[1]?.trim() || stage.kicker}</p>
              </Reveal>

              <ol className="his-events">
                {stage.events.map((event, eventIndex) => (
                  <Reveal
                    as="li"
                    key={`${stage.kicker}-${event.n}`}
                    data-step={event.n}
                    className={`his-event${eventIndex % 2 === 1 ? ' his-event--reverse' : ''}${
                      inicioEtapa[stageIndex] + eventIndex === activo ? ' is-active' : ''
                    }`}
                  >
                    <span className="his-event__dot" aria-hidden="true" />
                    <figure className="his-event__media">
                      <img src={event.image} alt="" loading="lazy" />
                      <figcaption>
                        <span className="his-event__num">{String(event.n).padStart(2, '0')}</span>
                        <span className="his-event__date">{event.date}</span>
                      </figcaption>
                    </figure>
                    <div className="his-event__body">
                      <h3>{event.title}</h3>
                      <p>{event.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      <section className="his-closing">
        <div className="container">
          <Reveal className="his-closing__card">
            <p className="eyebrow">Cierre del capítulo {chapter.number}</p>
            <h2>{chapter.closing.title}</h2>
            <p>{chapter.closing.text}</p>

            <div className="his-closing__nav">
              <p className="his-closing__hint">
                <kbd>←</kbd>
                <kbd>→</kbd>
                <span>
                  Pasa al {next ? 'siguiente' : 'anterior'} capítulo con las flechas del
                  teclado o deslizando la pantalla
                </span>
              </p>

              <p className="his-closing__links">
                {previous ? (
                  <Link to={`/historia/recorrido/${previous.slug}`}>
                    <span aria-hidden="true">←</span> Capítulo {previous.number} · {previous.title}
                  </Link>
                ) : (
                  <Link to="/historia">
                    <span aria-hidden="true">←</span> Conocer historia
                  </Link>
                )}
                {next ? (
                  <Link to={`/historia/recorrido/${next.slug}`}>
                    Siguiente: {next.title} <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <Link to="/historia/patrimonio">
                    Explorar patrimonio <span aria-hidden="true">→</span>
                  </Link>
                )}
              </p>
            </div>

            {next ? null : (
              <Link className="his-closing__back" to="/historia">
                <Icon name="chevron" className="is-left" />
                Volver a Conocer historia
              </Link>
            )}
          </Reveal>
        </div>
      </section>

      <div className={`his-guide${pista ? ' is-visible' : ''}`} aria-hidden="true">
        <p className="his-guide__desktop">
          <kbd>←</kbd>
          <kbd>→</kbd>
          para recorrer la línea del tiempo
        </p>
        <p className="his-guide__mobile">
          <span className="his-guide__arrow">↑</span>
          Desliza para avanzar · a los lados cambias de capítulo
        </p>
      </div>
    </>
  )
}
