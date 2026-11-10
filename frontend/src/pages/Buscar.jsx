import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import IconMask from '../components/ui/IconMask.jsx'
import Photo from '../components/ui/Photo.jsx'
import { componentCatalog } from '../data/componentCatalog.js'
import { activities } from '../data/experiences.js'
import { useEstablishments } from '../lib/contentApi.js'
import { compact, score } from '../lib/searchIndex.js'

export default function Buscar() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const rawQuery = params.get('q') ?? ''
  const query = rawQuery.trim()
  const { data: establishments } = useEstablishments()

  // Si lo escrito es exactamente el nombre de una sección («Dónde comer»,
  // «Información práctica»…), se va directo a ella sin pasar por resultados.
  const exactSection = query
    ? componentCatalog.find((item) => compact(item.name) === compact(query))
    : null

  useEffect(() => {
    if (exactSection) navigate(exactSection.to, { replace: true })
  }, [exactSection, navigate])

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

  // Las secciones del sitio se buscan siempre, sin tener que elegir un modo.
  const sections = query
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

  const nothing = query && results.length === 0 && sections.length === 0

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-comprar.jpg"
        title="Buscar"
        intro={
          query
            ? `Resultados para “${query}”.`
            : 'Escribe un lugar, una sección o contenido histórico en el buscador.'
        }
      />

      <section className="section">
        <div className="container">
          <div className="search-tools">
            <input
              className="search-tools__input"
              type="search"
              value={rawQuery}
              placeholder="Buscar un lugar, experiencia o sección…"
              aria-label="Buscar"
              onChange={(event) => {
                const merged = new URLSearchParams(params)
                if (event.target.value) merged.set('q', event.target.value)
                else merged.delete('q')
                setParams(merged, { replace: true })
              }}
            />
          </div>

          {nothing ? (
            <p className="empty">
              No encontramos resultados para “{query}”. Prueba con otra palabra.
            </p>
          ) : null}

          {sections.length > 0 ? (
            <>
              <h2 className="search-group">Secciones</h2>
              <div className="component-results">
                {sections.map((item) =>
                  item.design === 'quick' ? (
                    <Link key={item.id} className="quick-card" to={item.to}>
                      <Photo src={item.photo} alt={item.name} />
                      <span>{item.name}</span>
                    </Link>
                  ) : (
                    <Link key={item.id} className="feature-card" to={item.to}>
                      {item.illustration ? (
                        <img className="feature-card__art" src={item.illustration} alt="" loading="lazy" />
                      ) : (
                        <span className="feature-card__icon">
                          <IconMask icon={`icono-${item.icon}`} size={58} />
                        </span>
                      )}
                      <h3 className="feature-card__title">{item.name}</h3>
                      <p>{item.description}</p>
                    </Link>
                  ),
                )}
              </div>
            </>
          ) : null}

          {results.length > 0 ? (
            <>
              {sections.length > 0 ? (
                <h2 className="search-group">Establecimientos y experiencias</h2>
              ) : null}
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
            </>
          ) : null}
        </div>
      </section>
    </>
  )
}
