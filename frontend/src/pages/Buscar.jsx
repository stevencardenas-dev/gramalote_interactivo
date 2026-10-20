import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import { establishments } from '../data/establishments.js'
import { experiences } from '../data/experiences.js'

export default function Buscar() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const term = query.toLowerCase()

  const results = [
    ...establishments.map((item) => ({
      id: item.id,
      title: item.name,
      meta: 'Establecimiento',
      text: item.summary,
      to: `/establecimiento/${item.slug}`,
    })),
    ...experiences.map((item) => ({
      id: item.id,
      title: item.title,
      meta: 'Experiencia',
      text: item.description,
      to: item.to,
    })),
  ].filter((item) =>
    [item.title, item.meta, item.text].some((value) =>
      value.toLowerCase().includes(term),
    ),
  )

  return (
    <>
      <PageHero
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
                <Link key={item.id} className="search-result" to={item.to}>
                  <div>
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
