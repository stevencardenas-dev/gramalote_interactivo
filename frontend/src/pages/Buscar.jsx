import { Link, useSearchParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import { experiences } from '../data/experiences.js'
import { useEstablishments } from '../lib/contentApi.js'

// Ignora mayúsculas, tildes, ñ y espacios al comparar.
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')

export default function Buscar() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const term = normalize(query)
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
  ].filter((item) =>
    [item.title, item.meta, item.type, item.text].some((value) =>
      normalize(value).includes(term),
    ),
  )

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
