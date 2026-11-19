import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import FichaHorario from '../components/ui/FichaHorario.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import { locationButtonProps } from '../lib/maps.js'
import { fichaInfoItems } from '../lib/fichaInfo.js'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.dormir

function GallerySlot({ src, alt }) {
  if (!src) return <div className="photo ficha-gallery__empty" aria-hidden="true" />
  return <Photo src={src} alt={alt} />
}

export default function EstablecimientoDormir({ item }) {
  const gallery = (item.gallery ?? []).slice(0, 5)

  return (
    <>
      <HeroFicha
        eyebrow={item.type}
        title={item.name}
        rating={{ kind: 'establecimiento', slug: item.slug }}
        summary={item.summary}
        image={item.hero ?? '/img/home/hero.jpg'}
        images={item.heroes}
        imageAlt={item.name}
        pillTone="brick"
        social={['share']}
        links={item.socialLinks}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde dormir', to: '/donde-dormir' },
          { label: item.name },
        ]}
      />

      <div className="container">
        <InfoBar items={fichaInfoItems(item)} />
      </div>

      <FichaHorario item={item} />

      <section className="ficha-section ficha-section--dormir">
        <div className="container">
          <div className="section-head section-head--center">
            <h2>Instalaciones</h2>
            <p>{item.description}</p>
          </div>

          {/* Collage fijo de 5 espacios: se llena con las fotos de «Galería» en
              orden y los espacios sin foto quedan en blanco. Sin fotos, nada. */}
          {gallery.length > 0 ? (
            <div className="ficha-gallery">
              <div className="ficha-gallery__top">
                {[0, 1].map((slot) => (
                  <GallerySlot key={slot} src={gallery[slot]} alt={`${item.name} ${slot + 1}`} />
                ))}
              </div>
              <div className="ficha-gallery__row">
                {[2, 3, 4].map((slot) => (
                  <GallerySlot key={slot} src={gallery[slot]} alt={`${item.name} ${slot + 1}`} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="center-action">
            <Button {...locationButtonProps(item)} icon="arrow">
              Ver ubicación en el mapa
            </Button>
          </div>
        </div>
      </section>

      <RelatedPlaces
        items={item.relatedItems}
        exclude={item.slug}
        category={item.category}
        title={info.relationTitle}
        text={info.relationText}
      />
    </>
  )
}
