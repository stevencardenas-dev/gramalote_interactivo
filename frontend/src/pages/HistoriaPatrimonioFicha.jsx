import { Link, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import EraCarousel from '../components/historia/EraCarousel.jsx'
import PhotoNote, { PhotoBadge } from '../components/historia/PhotoNote.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import { findHeritage, useHeritage } from '../lib/heritageData.js'
import { usePageTitle } from '../lib/usePageTitle.js'

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

export default function HistoriaPatrimonioFicha() {
  const { slug } = useParams()
  const { items: heritage, ready } = useHeritage()
  const site = findHeritage(heritage, slug)
  const index = site ? heritage.indexOf(site) : -1

  usePageTitle(site ? site.name : 'Patrimonio')

  if (!site && !ready) {
    return (
      <section className="section section--estado">
        <div className="container container--narrow">
          <p className="note">Cargando ficha…</p>
        </div>
      </section>
    )
  }

  if (!site) {
    return (
      <section className="section section--estado">
        <div className="container container--narrow">
          <p className="eyebrow">Patrimonio</p>
          <h1>Ficha no encontrada</h1>
          <p className="page-intro">Este patrimonio no existe o cambió de dirección.</p>
          <Button to="/historia/patrimonio" icon="arrow">
            Volver al patrimonio
          </Button>
        </div>
      </section>
    )
  }

  const previous = heritage[index - 1] ?? null
  const next = heritage[index + 1] ?? null
  // La galería puede venir como textos (datos de respaldo) o como objetos con
  // pie de foto y crédito (API).
  const gallery = [
    site.image ? { src: site.image, alt: site.imageAlt, caption: site.imageCaption, credit: site.imageCredit } : null,
    ...site.gallery.map((photo) => (typeof photo === 'string' ? { src: photo } : photo)),
  ].filter((photo) => photo?.src)

  return (
    <>
      <article className="his-ficha">
        <div className="container">
          <nav aria-label="Migas de pan" className="his-ficha__crumbs">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link to="/historia">Historia</Link>
            <span aria-hidden="true">/</span>
            <Link to="/historia/patrimonio">Patrimonio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{site.name}</span>
          </nav>

          <div className="his-ficha__top">
            <div className="his-ficha__main">
              <Reveal className="his-ficha__head">
                <div className="his-tags">
                  <span className={`his-tag his-tag--${ZONE_TONE[site.zone]}`}>{site.zoneTag ?? site.zoneLabel}</span>
                  <span className="his-tag his-tag--cat">{site.category}</span>
                  {site.period ? <span className="his-tag his-tag--cat">{site.period}</span> : null}
                </div>
                <h1>{site.name}</h1>
                <p className="his-ficha__intro">{site.intro}</p>
              </Reveal>

              <Reveal className="his-ficha__body" delay={80}>
                <h2>{site.subtitle}</h2>
                {site.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                {site.sources ? <p className="his-ficha__sources">Fuentes consultadas: {site.sources}</p> : null}
              </Reveal>
            </div>

            <div className="his-ficha__aside">
              <Reveal className="his-ficha__media" delay={120}>
                {site.eras?.length > 1 ? (
                  <EraCarousel photos={site.eras} name={site.name} />
                ) : (
                  <div className="his-photo-frame">
                    <img src={site.image} alt={site.imageAlt ?? site.name} />
                    <PhotoBadge text={site.imageCaption} />
                  </div>
                )}
                {site.eras?.length > 1 ? null : <PhotoNote credit={site.imageCredit} />}
              </Reveal>

              {site.visit ? (
              <Reveal className="his-ficha__visit" delay={180}>
                <h3>Información para visitarlo</h3>
                <dl>
                  <div>
                    <dt>Ubicación</dt>
                    <dd>{site.visit.location}</dd>
                  </div>
                  <div>
                    <dt>Acceso</dt>
                    <dd>{site.visit.access}</dd>
                  </div>
                  <div>
                    <dt>Recomendación</dt>
                    <dd>{site.visit.recommendation}</dd>
                  </div>
                  {site.hoursText ? (
                    <div>
                      <dt>Horario</dt>
                      <dd>{site.hoursText}</dd>
                    </div>
                  ) : null}
                  {site.address ? (
                    <div>
                      <dt>Dirección</dt>
                      <dd>{site.address}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="his-ficha__visit-foot">
                  <span className={`his-status his-status--${STATUS_TONE[site.status] ?? 'warn'}`}>{site.status}</span>
                  <a className="btn btn--primary" href={site.mapsUrl} target="_blank" rel="noreferrer">
                    Cómo llegar
                    <Icon name="pin" className="btn__icon" />
                  </a>
                </div>
              </Reveal>
              ) : null}
            </div>
          </div>

          {gallery.length > 1 ? (
            <div className="his-ficha__gallery">
              {gallery.map((photo) => (
                <figure key={photo.src} className="his-ficha__photo">
                  <div className="his-photo-frame">
                    <img src={photo.src} alt={photo.alt ?? ''} loading="lazy" />
                    <PhotoBadge text={photo.caption} />
                  </div>
                  <PhotoNote credit={photo.credit} />
                </figure>
              ))}
            </div>
          ) : null}

          <nav className="his-ficha__nav" aria-label="Otros patrimonios">
            {previous ? (
              <Link to={`/historia/patrimonio/${previous.slug}`} className="his-ficha__navlink his-ficha__navlink--prev">
                <span>
                  <Icon name="chevron" className="is-left" /> Patrimonio anterior
                </span>
                <strong>{previous.name}</strong>
              </Link>
            ) : (
              <span className="his-ficha__navlink his-ficha__navlink--prev is-empty" aria-hidden="true" />
            )}

            <Link to="/historia/patrimonio" className="his-ficha__navback">
              Volver al listado
            </Link>

            {next ? (
              <Link to={`/historia/patrimonio/${next.slug}`} className="his-ficha__navlink his-ficha__navlink--next">
                <span>
                  Siguiente patrimonio <Icon name="arrow" />
                </span>
                <strong>{next.name}</strong>
              </Link>
            ) : (
              <span className="his-ficha__navlink his-ficha__navlink--next is-empty" aria-hidden="true" />
            )}
          </nav>
        </div>
      </article>
    </>
  )
}
