import { lazy, Suspense, useSyncExternalStore } from 'react'
import Button from '../ui/Button.jsx'
import Photo from '../ui/Photo.jsx'
import Placeholder from '../ui/Placeholder.jsx'

// MapLibre pesa bastante: solo se descarga cuando el bloque muestra el mapa.
const LiveMap = lazy(() => import('../ui/LiveMap.jsx'))

// En móvil el bloque es una foto de fondo bajo el texto, así que el mapa
// interactivo solo se monta en pantallas anchas (> 860 px).
const wide = '(min-width: 861px)'
const subscribe = (notify) => {
  const query = window.matchMedia(wide)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const useIsWide = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(wide).matches,
    () => false,
  )

export default function MapBlock() {
  const isWide = useIsWide()

  return (
    <section className="explore-block" aria-labelledby="map-title">
      <div className="container explore-block__inner">
        <div className="explore-block__body">
          <h2 id="map-title">Explora Gramalote Nuevo y Gramalote Viejo</h2>
          <p>
            Ubica los lugares de interés y distingue Gramalote Nuevo de
            Gramalote Viejo. Consulta las fichas y explora los sitios naturales
            como referencia.
          </p>
          <Button to="/mapa" icon="arrow">
            Explorar mapa
          </Button>
        </div>

        {isWide ? (
          <div className="explore-block__media explore-block__media--map">
            <Suspense fallback={<Placeholder label="Cargando mapa…" />}>
              <LiveMap label="Mapa de Gramalote" fill />
            </Suspense>
          </div>
        ) : (
          <Photo
            className="explore-block__media"
            src="/img/home/explora.jpg"
            alt="Calle de Gramalote Nuevo con montañas al fondo"
          />
        )}
      </div>
    </section>
  )
}
