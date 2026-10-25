import { useEffect, useRef, useState } from 'react'
import {
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  LngLatBounds,
  setWorkerUrl,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../styles/mapa.css'
import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'
import { getJson } from '../lib/api.js'

// AVISO: las teselas públicas de openstreetmap.org son solo para desarrollo y
// pruebas. Antes de publicar el sitio hay que cambiarlas (VITE_MAP_TILES_URL)
// por teselas propias o de un proveedor con condiciones de uso claras.
const TILES_URL =
  import.meta.env.VITE_MAP_TILES_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// Centro aproximado de Gramalote, en formato [longitud, latitud].
const INITIAL_CENTER = [-72.79, 7.89]
const INITIAL_ZOOM = 13

// MapLibre busca su worker junto a su propio archivo, que Vite empaqueta en otro
// lugar. Se le indica el worker que trae el paquete npm (sin CDN externo).
setWorkerUrl(workerUrl)

const ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>'

// Un grupo por tipo de punto. El color no es el único canal: cada grupo tiene
// además un tamaño de círculo distinto, una leyenda con texto y un popup con
// el nombre de la categoría.
const GROUPS = [
  { key: 'comer', label: 'Dónde comer', color: '#c2410c', radius: 8 },
  { key: 'dormir', label: 'Dónde dormir', color: '#486284', radius: 10 },
  { key: 'comprar', label: 'Dónde comprar', color: '#2f7d4f', radius: 12 },
  { key: 'experiencia', label: 'Experiencias', color: '#7c3aed', radius: 14 },
]
const GROUP_BY_KEY = Object.fromEntries(GROUPS.map((group) => [group.key, group]))

function isValidCoordinates(coordinates) {
  const { latitude, longitude } = coordinates ?? {}
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

function toPlaces(data) {
  const items = [...(data?.establishments ?? []), ...(data?.experiences ?? [])]
  return items
    .filter((item) => isValidCoordinates(item.coordinates))
    .map((item) => {
      const group = item.kind === 'experience' ? 'experiencia' : item.category?.slug
      return {
        id: `${item.kind}-${item.id}`,
        name: item.name,
        group: GROUP_BY_KEY[group] ? group : null,
        categoryName: item.category?.name ?? GROUP_BY_KEY[group]?.label ?? '',
        type: item.type ?? null,
        longitude: item.coordinates.longitude,
        latitude: item.coordinates.latitude,
      }
    })
    .filter((place) => place.group)
}

function toFeatureCollection(places) {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      // GeoJSON: [longitud, latitud]
      geometry: { type: 'Point', coordinates: [place.longitude, place.latitude] },
      properties: {
        group: place.group,
        name: place.name,
        categoryName: place.categoryName,
        type: place.type ?? '',
      },
    })),
  }
}

function fitToPlaces(map, places) {
  if (places.length === 0) return
  const bounds = new LngLatBounds()
  places.forEach((place) => bounds.extend([place.longitude, place.latitude]))
  map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 0 })
}

export default function Mapa() {
  const containerRef = useRef(null)
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
    let removed = false

    const map = new MapLibreMap({
      container: containerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: false },
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [TILES_URL],
            tileSize: 256,
            maxzoom: 19,
            attribution: ATTRIBUTION,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    const popup = new Popup({ closeButton: true, closeOnClick: true, maxWidth: '260px' })

    const mapLoaded = new Promise((resolve) => map.once('load', resolve))
    const dataLoaded = getJson('/map', { signal: controller.signal })

    Promise.all([mapLoaded, dataLoaded])
      .then(([, response]) => {
        if (removed) return
        const loaded = toPlaces(response?.data)
        setPlaces(loaded)
        setStatus('ready')

        map.addSource('lugares', { type: 'geojson', data: toFeatureCollection(loaded) })
        map.addLayer({
          id: 'lugares',
          type: 'circle',
          source: 'lugares',
          paint: {
            'circle-color': [
              'match',
              ['get', 'group'],
              ...GROUPS.flatMap((group) => [group.key, group.color]),
              '#1d1b20',
            ],
            'circle-radius': [
              'match',
              ['get', 'group'],
              ...GROUPS.flatMap((group) => [group.key, group.radius]),
              8,
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          },
        })
        fitToPlaces(map, loaded)
      })
      .catch((error) => {
        if (error?.name === 'AbortError' || removed) return
        setStatus('error')
      })

    map.on('click', 'lugares', (event) => {
      const feature = event.features?.[0]
      if (!feature) return
      const { name, categoryName, type } = feature.properties
      const content = document.createElement('div')
      content.className = 'mapa-popup'
      const title = document.createElement('strong')
      title.textContent = name
      const detail = document.createElement('span')
      detail.textContent = type ? `${categoryName} · ${type}` : categoryName
      content.append(title, detail)
      popup.setLngLat(feature.geometry.coordinates).setDOMContent(content).addTo(map)
    })
    map.on('mouseenter', 'lugares', () => {
      map.getCanvas().style.cursor = 'pointer'
    })
    map.on('mouseleave', 'lugares', () => {
      map.getCanvas().style.cursor = ''
    })

    // En StrictMode el efecto se monta, se limpia y se monta de nuevo:
    // remove() libera el mapa de la primera pasada.
    return () => {
      removed = true
      controller.abort()
      map.remove()
    }
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Mapa interactivo"
        title="Explora el mapa"
        intro="Filtra por categoría y consulta los lugares de Gramalote Nuevo y Gramalote Viejo. Los sitios naturales se muestran como referencia."
      />

      <section className="section">
        <div className="container">
          <div
            ref={containerRef}
            className="mapa"
            role="region"
            aria-label="Mapa de Gramalote"
          />

          <ul className="mapa-leyenda" aria-label="Leyenda del mapa">
            {GROUPS.map((group) => (
              <li key={group.key}>
                <span
                  className="mapa-leyenda__punto"
                  style={{ background: group.color, width: group.radius * 2, height: group.radius * 2 }}
                  aria-hidden="true"
                />
                {group.label}
              </li>
            ))}
          </ul>

          {status === 'loading' ? <p className="note">Cargando lugares…</p> : null}
          {status === 'error' ? (
            <p className="note">No se pudieron cargar los lugares. Intenta de nuevo más tarde.</p>
          ) : null}
          {status === 'ready' && places.length === 0 ? (
            <p className="note">Todavía no hay lugares con ubicación para mostrar.</p>
          ) : null}

          {places.length > 0 ? (
            <ul className="mapa-lista" aria-label="Lugares en el mapa">
              {places.map((place) => (
                <li key={place.id}>
                  <strong>{place.name}</strong>
                  <span>{place.type ? `${place.categoryName} · ${place.type}` : place.categoryName}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="page-actions" style={{ marginTop: '20px' }}>
            <Button to="/donde-ir" variant="ghost">
              Ver establecimientos
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
