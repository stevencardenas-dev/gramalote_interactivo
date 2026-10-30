import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import { experiences } from '../data/experiences.js'
import { useEstablishments } from '../lib/contentApi.js'

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
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const { data: establishments } = useEstablishments()

  const results = [
    ...establishments.map((item) => ({
      id: item.id,
      title: item.name,
      meta: 'Establecimiento',
      type: item.type,
      text: item.summary,
      photo: item.photo,
      to: `/establecimiento/${item.slug}`,
    })),
    ...experiences.map((item) => ({
      id: item.id,
      title: item.title,
      meta: 'Experiencia',
      text: item.description,
      photo: item.photo,
      to: item.to,
    })),
  ]
    .map((item) => ({ item, relevance: score(item, query) }))
    .filter(({ relevance }) => relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ item }) => item)

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-comprar.jpg"
        title="Buscar"
        intro={
          query
            ? `Resultados para “${query}”.`
            : 'Escribe un lugar, producto o contenido histórico en el buscador.'
        }
      />

      <section className="section">
        <div className="container">
          {query && results.length === 0 ? (
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
