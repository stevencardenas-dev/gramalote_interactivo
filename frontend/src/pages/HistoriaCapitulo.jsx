import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import SectionNav from '../components/historia/SectionNav.jsx'
import { chapters, getChapter, getChapterIndex } from '../data/historia.js'
import { usePageTitle } from '../lib/usePageTitle.js'

// Navegación del capítulo:
//   · escritorio: la rueda y las flechas del teclado pasan de un bloque al
//     siguiente (cada bloque ocupa una pantalla). En los extremos no se fuerza
//     el cambio de capítulo: para eso están los botones del cierre.
//   · móvil: un deslizamiento lateral cambia de capítulo.
// El cierre explica los atajos de cada modo y ofrece botones para volver al
// inicio y para cambiar de capítulo.
const SIN_MOVIMIENTO = '(prefers-reduced-motion: reduce)'
const TECLAS = {
  ArrowRight: 1,
  ArrowDown: 1,
  PageDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
  PageUp: -1,
}

const esReducido = () => window.matchMedia(SIN_MOVIMIENTO).matches

// Los enlaces del panel y del menú tienen sus propios acordes: si el foco está
// en un campo de texto, las flechas deben mover el cursor y no la historia.
function escribiendo(elemento) {
  if (!(elemento instanceof Element)) return false
  return Boolean(elemento.closest('input, textarea, select, [contenteditable="true"]'))
}

// Acontecimientos seguidos que usan la misma foto forman un grupo: la foto es
// una sola, se queda fija en su lado y solo cambian los textos (uno por
// pantalla). El lado alterna por grupo, no por acontecimiento.
function agruparPorFoto(events) {
  const grupos = []
  events.forEach((event, eventIndex) => {
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.image === event.image) ultimo.items.push({ event, eventIndex })
    else grupos.push({ image: event.image, items: [{ event, eventIndex }] })
  })
  return grupos
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

      // Antes del primer acontecimiento está el encabezado del capítulo y
      // después del último, el cierre y el pie de página: las flechas llegan a
      // ellos igual que pasan de un acontecimiento a otro.
      const encabezado = document.querySelector('.his-cap-hero')
      const cierre = document.querySelector('.his-closing')
      const pie = document.querySelector('.site-footer')
      const bloques = [encabezado, ...eventos, cierre, pie].filter(Boolean)

      const alto = window.innerHeight
      let actual = 0
      let distancia = Infinity
      bloques.forEach((bloque, i) => {
        const caja = bloque.getBoundingClientRect()
        // Lo que cuenta es la parte del bloque que se ve: el pie es más bajo
        // que una pantalla y el encabezado empieza encima del menú.
        const arriba = Math.max(caja.top, 0)
        const abajo = Math.min(caja.bottom, alto)
        if (abajo <= arriba) return
        const d = Math.abs((arriba + abajo) / 2 - alto / 2) - (abajo - arriba) / alto
        if (d < distancia) {
          distancia = d
          actual = i
        }
      })

      const destino = actual + salto
      // Al llegar al primero o al último no se salta de capítulo: el cierre
      // ofrece los botones y el inicio tiene su propio regreso.
      if (destino < 0 || destino >= bloques.length) return

      const comportamiento = esReducido() ? 'auto' : 'smooth'
      const bloque = bloques[destino]
      if (bloque === encabezado) {
        window.scrollTo({ top: 0, behavior: comportamiento })
      } else if (bloque === pie) {
        bloque.scrollIntoView({ behavior: comportamiento, block: 'end' })
      } else {
        // Cada bloque es una pantalla: su borde superior queda bajo el menú
        // (el scroll-margin de historia.css lo alinea con el encabezado).
        bloque.scrollIntoView({ behavior: comportamiento, block: 'start' })
      }
    },
    [],
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

  // Transición entre fragmentos: mientras se desplaza, el bloque que sale se
  // atenúa y se encoge un poco y el que entra sube y se aclara (--vis, de 0 a 1,
  // lo leen las reglas de historia.css). El anillo de abajo se llena en móvil a
  // medida que se avanza hacia el siguiente fragmento.
  const siguienteRef = useRef(null)
  useEffect(() => {
    const story = storyRef.current
    if (!chapter || !story) return undefined
    const cierre = document.querySelector('.his-closing')
    const bloques = [...story.querySelectorAll('.his-event'), ...(cierre ? [cierre] : [])]
    let marco = 0

    const pintar = () => {
      marco = 0
      const ring = siguienteRef.current
      if (esReducido()) {
        bloques.forEach((bloque) => bloque.style.removeProperty('--vis'))
        ring?.style.setProperty('--p', '0')
        return
      }
      const alto = window.innerHeight
      const centro = alto / 2
      const medios = bloques.map((bloque) => {
        const caja = bloque.getBoundingClientRect()
        const medio = (caja.top + caja.bottom) / 2
        const vis = Math.max(0, Math.min(1, 1 - Math.abs(medio - centro) / (alto * 0.75)))
        bloque.style.setProperty('--vis', vis.toFixed(3))
        return medio
      })
      // Último bloque cuyo centro ya pasó por el centro de la pantalla.
      let actual = -1
      medios.forEach((medio, i) => {
        if (medio <= centro) actual = i
      })
      const siguiente = actual >= 0 ? medios[actual + 1] : medios[0]
      const desde = actual >= 0 ? medios[actual] : centro + alto * 0.5
      const avance = siguiente === undefined ? 0 : Math.max(0, Math.min(1, (centro - desde) / (siguiente - desde)))
      ring?.style.setProperty('--p', avance.toFixed(3))
      ring?.classList.toggle('is-end', siguiente === undefined)
    }

    // setTimeout y no requestAnimationFrame: una pestaña en segundo plano no
    // entrega frames y el bloque se quedaría sin su transición.
    const programar = () => {
      if (!marco) marco = window.setTimeout(pintar, 16)
    }

    pintar()
    window.addEventListener('scroll', programar, { passive: true })
    window.addEventListener('resize', programar)
    return () => {
      window.removeEventListener('scroll', programar)
      window.removeEventListener('resize', programar)
      if (marco) window.clearTimeout(marco)
      bloques.forEach((bloque) => bloque.style.removeProperty('--vis'))
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
                <span className="his-cap-hero__keys-or">o</span>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
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

      {/* Abajo a la izquierda van juntos la flecha de avance y el contador del
          suceso; la esquina derecha queda para «volver arriba» y WhatsApp. */}
      <div className="his-floats" aria-hidden="true">
        <div className="his-next" ref={siguienteRef}>
          <svg viewBox="0 0 44 44">
            <circle className="his-next__track" cx="22" cy="22" r="19" />
            <circle className="his-next__fill" cx="22" cy="22" r="19" pathLength="100" />
          </svg>
          <span className="his-next__arrow">↓</span>
        </div>
        <p className={`his-step-counter${totalEvents > 1 ? ' is-visible' : ''}`}>
          {String(paso + 1).padStart(2, '0')}
          <span>/ {String(totalEvents).padStart(2, '0')}</span>
        </p>
      </div>

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
                {agruparPorFoto(stage.events).map((grupo, g) => {
                  const invertido = g % 2 === 1
                  const global = (eventIndex) => inicioEtapa[stageIndex] + eventIndex
                  // El primero de la etapa lleva además el nombre de la etapa.
                  const tarjetaEtapa = (eventIndex) =>
                    eventIndex === 0 ? (
                      <div className="his-event__stage">
                        <span className="his-stage__count">
                          Etapa {String(stageIndex + 1).padStart(2, '0')} / {String(chapter.stages.length).padStart(2, '0')}
                        </span>
                        <h2>{stage.title}</h2>
                        <p>{stage.kicker.split('·')[1]?.trim() || stage.kicker}</p>
                      </div>
                    ) : null
                  const pie = (event) => (
                    <figcaption>
                      <span className="his-event__num">{String(event.n).padStart(2, '0')}</span>
                      <span className="his-event__date">{event.date}</span>
                    </figcaption>
                  )
                  const cuerpo = (event) => (
                    <div className="his-event__body">
                      <h3>{event.title}</h3>
                      <p>{event.text}</p>
                    </div>
                  )

                  if (grupo.items.length === 1) {
                    const { event, eventIndex } = grupo.items[0]
                    return (
                      <Reveal
                        as="li"
                        key={`${stage.kicker}-${event.n}`}
                        data-step={event.n}
                        className={`his-event${invertido ? ' his-event--reverse' : ''}${
                          global(eventIndex) === activo ? ' is-active' : ''
                        }`}
                      >
                        {tarjetaEtapa(eventIndex)}
                        <span className="his-event__dot" aria-hidden="true" />
                        <figure className="his-event__media">
                          <img src={event.image} alt="" loading="lazy" />
                          {pie(event)}
                        </figure>
                        {cuerpo(event)}
                      </Reveal>
                    )
                  }

                  // Foto compartida: queda fija (sticky) mientras pasan sus textos.
                  const visible =
                    grupo.items.find((item) => global(item.eventIndex) === activo) ?? grupo.items[0]
                  return (
                    <li
                      key={`${stage.kicker}-g${g}`}
                      className={`his-shared${invertido ? ' his-shared--reverse' : ''}`}
                    >
                      <div className="his-shared__media">
                        <figure className="his-event__media">
                          <img src={grupo.image} alt="" loading="lazy" />
                          {pie(visible.event)}
                        </figure>
                      </div>
                      <ol className="his-shared__texts">
                        {grupo.items.map(({ event, eventIndex }) => (
                          <li
                            key={`${stage.kicker}-${event.n}`}
                            data-step={event.n}
                            className={`his-event his-event--shared${
                              global(eventIndex) === activo ? ' is-active' : ''
                            }`}
                          >
                            {tarjetaEtapa(eventIndex)}
                            <span className="his-event__dot" aria-hidden="true" />
                            {cuerpo(event)}
                          </li>
                        ))}
                      </ol>
                    </li>
                  )
                })}
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
              <a className="his-closing__start" href="#etapa-1">
                <Icon name="arrow-up" size={18} />
                Volver al inicio del capítulo
              </a>

              <p className="his-closing__hint his-closing__hint--desktop">
                <kbd>←</kbd>
                <kbd>→</kbd>
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                <span>recorren los acontecimientos. Para cambiar de capítulo, usa los botones.</span>
              </p>
              <p className="his-closing__hint his-closing__hint--mobile">
                <span>Desliza hacia arriba para releer el capítulo o usa los botones para cambiar de capítulo.</span>
              </p>

              <div className="his-closing__links">
                {previous ? (
                  <Link
                    className="his-closing__link his-closing__link--prev"
                    to={`/historia/recorrido/${previous.slug}`}
                  >
                    <span className="his-closing__link-kicker">Capítulo {previous.number}</span>
                    <strong>
                      <span className="his-closing__link-arrow" aria-hidden="true">←</span>{' '}
                      {previous.title}
                    </strong>
                  </Link>
                ) : (
                  <Link className="his-closing__link his-closing__link--prev" to="/historia">
                    <span className="his-closing__link-kicker">Volver</span>
                    <strong>
                      <span className="his-closing__link-arrow" aria-hidden="true">←</span> Conocer historia
                    </strong>
                  </Link>
                )}
                {next ? (
                  <Link
                    className="his-closing__link his-closing__link--next"
                    to={`/historia/recorrido/${next.slug}`}
                  >
                    <span className="his-closing__link-kicker">Capítulo {next.number}</span>
                    <strong>
                      {next.title}{' '}
                      <span className="his-closing__link-arrow" aria-hidden="true">→</span>
                    </strong>
                  </Link>
                ) : (
                  <Link className="his-closing__link his-closing__link--next" to="/historia/patrimonio">
                    <span className="his-closing__link-kicker">Siguiente parada</span>
                    <strong>
                      Explorar patrimonio{' '}
                      <span className="his-closing__link-arrow" aria-hidden="true">→</span>
                    </strong>
                  </Link>
                )}
              </div>
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
          <kbd>↑</kbd>
          <kbd>↓</kbd>
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
