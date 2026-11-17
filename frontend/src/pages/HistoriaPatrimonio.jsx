import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import SectionNav from '../components/historia/SectionNav.jsx'
import { ZONES, heritageHero } from '../data/historia.js'
import { useHeritage } from '../lib/heritageData.js'
import { usePageTitle } from '../lib/usePageTitle.js'

const HeritageMap = lazy(() => import('../components/historia/HeritageMap.jsx'))

const STATUS_TONE = {
  Visitable: 'ok',
  'Con restricciones': 'warn',
  'Solo memoria': 'memory',
}

const ZONE_TONE = {
  caldereros: 'green',
  'gramalote-viejo': 'coral',
  'nuevo-gramalote': 'navy',
}

function Status({ value }) {
  return <span className={`his-status his-status--${STATUS_TONE[value] ?? 'warn'}`}>{value}</span>
}

export default function HistoriaPatrimonio() {
  usePageTitle('Patrimonio')
  const { items: heritage } = useHeritage()
  const [zone, setZone] = useState('todas')
  const [query, setQuery] = useState('')
  const [view, setView] = useState('listado')
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState(heritage[0]?.slug ?? '')
  const listaRef = useRef(null)

  const counts = useMemo(() => {
    const map = { todas: heritage.length }
    heritage.forEach((item) => {
      map[item.zone] = (map[item.zone] ?? 0) + 1
    })
    return map
  }, [heritage])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return heritage.filter((item) => {
      const inZone = zone === 'todas' || item.zone === zone
      const inText = !term || `${item.name} ${item.category} ${item.zoneLabel}`.toLowerCase().includes(term)
      return inZone && inText
    })
  }, [heritage, zone, query])

  const current = filtered.find((item) => item.slug === selected) ?? filtered[0] ?? null

  // La lista del mapa tiene su propio scroll (si no, la columna derecha crecía
  // mucho más que el mapa): al elegir un punto se trae a la vista la fila
  // activa, que puede haber quedado fuera del recuadro.
  useEffect(() => {
    const lista = listaRef.current
    const activo = lista?.querySelector('button.is-active')
    if (!lista || !activo) return
    const caja = lista.getBoundingClientRect()
    const fila = activo.getBoundingClientRect()
    const fuera = fila.top < caja.top + 4 || fila.bottom > caja.bottom - 4
    if (!fuera) return
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    lista.scrollTo({
      top: lista.scrollTop + (fila.top - caja.top) - (caja.height - fila.height) / 2,
      behavior: reducido ? 'auto' : 'smooth',
    })
  }, [current?.slug, filtered.length, view])
  const filtering = zone !== 'todas' || query.trim().length > 0
  const visible = expanded || filtering ? filtered : filtered.slice(0, 3)

  return (
    <>
      <header className="his-hero his-hero--page">
        <img className="his-hero__img" src="/img/historia/patrimonio-hero.jpg" alt="" />
        <div className="his-hero__veil" aria-hidden="true" />
        <div className="container his-hero__inner">
          <p className="eyebrow">{heritageHero.eyebrow}</p>
          <h1>{heritageHero.title}</h1>
          <p className="his-hero__intro">{heritageHero.intro}</p>
        </div>
      </header>

      <SectionNav />

      <section className="section his-patrimonio">
        <div className="container">
          <Reveal className="his-explorer__head">
            <p className="eyebrow">Explorar patrimonio</p>
            <p className="his-explorer__lead">
              {filtered.length} de {heritage.length} lugares · filtra por zona o busca por nombre y categoría.
            </p>
          </Reveal>

          <Reveal className="his-explorer__bar" delay={80}>
            <div className="his-filters" role="group" aria-label="Filtrar por zona">
              {ZONES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`his-chip${zone === item.id ? ' is-active' : ''}`}
                  onClick={() => setZone(item.id)}
                  aria-pressed={zone === item.id}
                >
                  {item.label} ({counts[item.id] ?? 0})
                </button>
              ))}
            </div>

            <div className="his-tools">
              <label className="his-search">
                <Icon name="search" size={18} />
                <span className="visually-hidden">Buscar patrimonio por nombre o categoría</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre o categoría..."
                />
              </label>
              <div className="his-switch" role="group" aria-label="Vista de patrimonio">
                <button
                  type="button"
                  className={view === 'listado' ? 'is-active' : ''}
                  onClick={() => setView('listado')}
                  aria-pressed={view === 'listado'}
                >
                  Listado
                </button>
                <button
                  type="button"
                  className={view === 'mapa' ? 'is-active' : ''}
                  onClick={() => setView('mapa')}
                  aria-pressed={view === 'mapa'}
                >
                  Mapa
                </button>
              </div>
            </div>
          </Reveal>

          {view === 'listado' ? (
            <>
              {visible.length > 0 ? (
                <ol className="his-rows">
                  {visible.map((item, index) => (
                    <Reveal as="li" key={item.slug} className="his-row" delay={index * 50}>
                      <span className="his-row__num">{item.n}</span>
                      <Link className="his-row__media" to={`/historia/patrimonio/${item.slug}`} tabIndex={-1} aria-hidden="true">
                        <img src={item.image} alt="" loading="lazy" />
                      </Link>
                      <div className="his-row__body">
                        <div className="his-tags">
                          <span className={`his-tag his-tag--${ZONE_TONE[item.zone]}`}>{item.zoneLabel}</span>
                          <span className="his-tag his-tag--cat">{item.category}</span>
                        </div>
                        <h3>
                          <Link to={`/historia/patrimonio/${item.slug}`}>{item.name}</Link>
                        </h3>
                        <p>{item.summary}</p>
                        <Status value={item.status} />
                      </div>
                      <Link className="his-row__cta" to={`/historia/patrimonio/${item.slug}`}>
                        Ver ficha
                        <Icon name="arrow" size={16} />
                      </Link>
                    </Reveal>
                  ))}
                </ol>
              ) : (
                <p className="his-empty">
                  No encontramos patrimonios con ese criterio. Prueba con otra zona o con otra palabra.
                </p>
              )}

              {!filtering && filtered.length > 3 ? (
                <div className="his-rows__foot">
                  <button type="button" className="his-toggle" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
                    {expanded ? 'Ver menos' : 'Ver los 13 registros'}
                    <Icon name={expanded ? 'chevron' : 'chevron'} className={expanded ? 'is-up' : ''} />
                  </button>
                </div>
              ) : null}

              <Reveal className="his-mappromo">
                <div className="his-mappromo__head">
                  <span className="his-mappromo__icon" aria-hidden="true">
                    <Icon name="map" size={26} />
                  </span>
                  <div className="his-mappromo__text">
                    <h2>Patrimonio en el mapa</h2>
                    <p>Explora la ubicación de los 13 patrimonios en el territorio de Gramalote.</p>
                  </div>
                  <button type="button" className="btn btn--primary" onClick={() => setView('mapa')}>
                    Explorar en el mapa
                    <Icon name="arrow" className="btn__icon" />
                  </button>
                </div>
                <Suspense fallback={<p className="note">Cargando mapa…</p>}>
                  <HeritageMap items={heritage} interactive={false} onSelect={() => setView('mapa')} />
                </Suspense>
              </Reveal>
            </>
          ) : (
            <div className="his-mapview">
              <Reveal className="his-mapview__map">
                <Suspense fallback={<p className="note">Cargando mapa…</p>}>
                  <HeritageMap
                    items={filtered}
                    selectedId={current?.slug ?? ''}
                    onSelect={(item) => setSelected(item.slug)}
                  />
                </Suspense>
              </Reveal>

              <aside className="his-mapview__panel">
                {current ? (
                  <article className="his-mapview__card">
                    <img src={current.image} alt="" loading="lazy" />
                    <div className="his-mapview__card-body">
                      <span className={`his-tag his-tag--${ZONE_TONE[current.zone]}`}>{current.zoneLabel}</span>
                      <h3>{current.name}</h3>
                      <p className="his-mapview__meta">
                        {current.zoneLabel} · {current.category}
                      </p>
                      <p className="his-mapview__summary">{current.summary}</p>
                    </div>
                    <div className="his-mapview__card-foot">
                      <Status value={current.status} />
                      <Link className="btn btn--primary his-mapview__cta" to={`/historia/patrimonio/${current.slug}`}>
                        Ver ficha completa
                        <Icon name="arrow" className="btn__icon" />
                      </Link>
                    </div>
                  </article>
                ) : (
                  <p className="his-empty">No hay patrimonios para mostrar con ese filtro.</p>
                )}

                <div className="his-mapview__list">
                  <div className="his-mapview__list-head">
                    <p className="eyebrow">Explora lugares</p>
                    <span className="his-mapview__count">
                      {filtered.length} {filtered.length === 1 ? 'lugar' : 'lugares'}
                    </span>
                  </div>
                  <ol ref={listaRef}>
                    {filtered.map((item) => (
                      <li key={item.slug}>
                        <button
                          type="button"
                          className={item.slug === current?.slug ? 'is-active' : ''}
                          onClick={() => setSelected(item.slug)}
                        >
                          <span>
                            {item.n}. {item.name}
                          </span>
                          <Icon name="pin" size={18} />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </aside>

              <button type="button" className="his-mapview__back" onClick={() => setView('listado')}>
                <Icon name="chevron" className="is-left" />
                Volver al listado
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
