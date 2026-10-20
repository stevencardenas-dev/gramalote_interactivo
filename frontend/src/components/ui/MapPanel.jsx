import Placeholder from './Placeholder.jsx'
import Button from './Button.jsx'

export default function MapPanel({ title, cta, to = '/mapa' }) {
  return (
    <div className="map-panel">
      <div className="map-panel__frame">
        <div className="map-panel__grid" aria-hidden="true" />
        <span className="map-panel__title">{title}</span>
      </div>
      {cta ? (
        <Button to={to} icon="arrow" className="map-panel__cta">
          {cta}
        </Button>
      ) : null}
    </div>
  )
}

export function MapExplorer({ title, text, cta, to = '/mapa' }) {
  return (
    <div className="map-explorer">
      <div className="map-explorer__media">
        <Placeholder label="Mapa interactivo · marcadores de lugares" />
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
