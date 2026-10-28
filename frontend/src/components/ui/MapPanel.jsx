import { lazy, Suspense } from 'react'
import Placeholder from './Placeholder.jsx'
import Button from './Button.jsx'

// MapLibre pesa bastante: se descarga solo cuando una página muestra el mapa.
const LiveMap = lazy(() => import('./LiveMap.jsx'))

export default function MapPanel({ title, cta, to = '/mapa', groups = null }) {
  return (
    <div className="map-panel">
      <div className="map-panel__frame">
        <Suspense fallback={<span className="map-panel__title">{title}</span>}>
          <LiveMap groups={groups} label={title} fill />
        </Suspense>
      </div>
      {cta ? (
        <Button to={to} icon="arrow" className="map-panel__cta">
          {cta}
        </Button>
      ) : null}
    </div>
  )
}

export function MapExplorer({ title, text, cta, to = '/mapa', groups = null }) {
  return (
    <div className="map-explorer">
      <div className="map-explorer__media">
        <Suspense fallback={<Placeholder label="Cargando mapa…" />}>
          <LiveMap groups={groups} label={title} fill />
        </Suspense>
      </div>
      <div className="map-explorer__body">
        <h2>{title}</h2>
        <p>{text}</p>
        <Button to={to} icon="arrow">
          {cta}
        </Button>
      </div>
    </div>
  )
}
