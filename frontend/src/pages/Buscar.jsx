import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import { activities } from '../data/experiences.js'
import { useEstablishments } from '../lib/contentApi.js'
import { componentCatalog } from '../data/componentCatalog.jsx'

// Ignora mayúsculas, tildes y ñ; `compact` también ignora los espacios.
const fold = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
const compact = (value) => fold(value).replace(/\s+/g, '')
const words = (value) => fold(value).split(/[^a-z0-9]+/).filter(Boolean)

// Relevancia de un resultado (0 = no coincide):
// 3 el nombre empieza por lo escrito, 2 lo contiene, 1 coincide al inicio de
// palabras del tipo o la descripción (solo desde 3 letras, para no traer ruido).
function score(item, query) {
  const term = compact(query)
  if (!term) return 1
  const title = compact(item.title)
  if (title.startsWith(term)) return 3
  if (title.includes(term)) return 2
  if (term.length < 3) return 0
  const wanted = words(query)
  const matches = (text) => {
    const tokens = words(text)
    return wanted.every((word) => tokens.some((token) => token.startsWith(word)))
  }
  return matches(item.type) || matches(item.text) ? 1 : 0
}

export default function Buscar() {
  const [params, setParams] = useSearchParams()
  const rawQuery = params.get('q') ?? ''
  const query = rawQuery.trim()
  // Dos modos que no se mezclan: lugares y experiencias, o piezas de interfaz.
  const mode = params.get('tipo') === 'componentes' ? 'componentes' : 'sitio'

  function update(next) {
    const merged = new URLSearchParams(params)
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value)
      else merged.delete(key)
    }
    setParams(merged, { replace: true })
  }
  const { data: establishments } = useEstablishments()

  const results = mode === 'componentes' ? [] : [
    ...establishments.map((item) => ({
      id: item.id,
      title: item.name,
      meta: 'Establecimiento',
      type: item.type,
      text: item.summary,
      photo: item.photo,
      to: `/establecimiento/${item.slug}`,
    })),
    ...activities.map((item) => ({
      id: item.slug,
      title: item.title,
      meta: 'Experiencia',
      text: item.text,
      photo: item.photo,
      to: `/que-hacer/${item.slug}`,
    })),
  ]
    .map((item) => ({ item, relevance: score(item, query) }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ item }) => item)

  const components =
    mode === 'componentes'
      ? componentCatalog
          .map((item) => ({
            item,
            relevance: score(
              { title: item.name, type: item.keywords, text: item.description },
              query,
            ),
          }))
          .filter(({ relevance }) => relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .map(({ item }) => item)
      : []

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-comprar.jpg"
        title="Buscar"
        intro={
          query
            ? `Resultados para “${query}”.`
            : mode === 'componentes'
              ? 'Escribe el nombre de una pieza de interfaz: botón, estrellas, etiqueta…'
              : 'Escribe un lugar, producto o contenido histórico en el buscador.'
        }
      />

      <section className="section">
        <div className="container">
          <div className="search-tools">
            <div className="search-switch" role="group" aria-label="Qué buscar">
              <button
                type="button"
                aria-pressed={mode === 'sitio'}
                className={mode === 'sitio' ? 'is-active' : undefined}
                onClick={() => update({ tipo: null })}
              >
                Establecimientos y experiencias
              </button>
              <button
                type="button"
                aria-pressed={mode === 'componentes'}
                className={mode === 'componentes' ? 'is-active' : undefined}
                onClick={() => update({ tipo: 'componentes' })}
              >
                Componentes
              </button>
            </div>
            <input
              className="search-tools__input"
              type="search"
              value={rawQuery}
              placeholder={
                mode === 'componentes' ? 'Buscar componente…' : 'Buscar lugar o experiencia…'
              }
              aria-label="Buscar"
              onChange={(event) => update({ q: event.target.value })}
            />
          </div>

          {mode === 'componentes' ? (
            components.length === 0 ? (
              <p className="empty">No hay componentes que coincidan con “{query}”.</p>
            ) : (
              <div className="component-results">
                {components.map((item) => (
                  <article key={item.id} className="component-card">
                    <span className="search-result__meta">Componente</span>
                    <h2>{item.name}</h2>
                    <p>{item.description}</p>
                    <div className="component-card__stage">{item.preview()}</div>
                  </article>
                ))}
              </div>
            )
          ) : query && results.length === 0 ? (
            <p className="empty">
              No encontramos resultados para “{query}”. Prueba con otra palabra.
            </p>
          ) : (
            <div className="search-results">
              {results.map((item) => (
                <Link key={`${item.meta}-${item.id}`} className="search-result" to={item.to}>
                  {item.photo && (
                    <img
                      className="search-result__photo"
                      src={item.photo}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <div className="search-result__body">
                    <span className="search-result__meta">{item.meta}</span>
                    <strong>{item.title}</strong>
                    <span className="search-result__meta">{item.text}</span>
                  </div>
                  <span className="link-arrow">Abrir</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
