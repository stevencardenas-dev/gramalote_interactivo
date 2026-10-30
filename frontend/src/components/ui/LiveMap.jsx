import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  LngLatBounds,
  setWorkerUrl,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../../styles/mapa.css'
import { getJson } from '../../lib/api.js'
import { establishmentPhotos } from '../../data/establishmentPhotos'

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

// Ignora mayúsculas, tildes, ñ y espacios al buscar.
const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')

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
        slug: item.slug,
        kind: item.kind,
        name: item.name,
        group: GROUP_BY_KEY[group] ? group : null,
        categoryName: item.category?.name ?? GROUP_BY_KEY[group]?.label ?? '',
        type: item.type ?? null,
        photo: item.cover?.url ?? establishmentPhotos[item.slug]?.photo ?? null,
        longitude: item.coordinates.longitude,
        latitude: item.coordinates.latitude,
      }
    })
    .filter((place) => place.group)
}

// PRUEBA: iconos ilustrados (entrega del 29 de octubre) en dos alojamientos
// cercanos para compararlos con el pin de siempre. Se miden en píxeles.
const ICON_SIZE = 64
const TEST_ICONS = {
  'verdeser-glampings': '/img/mapa/glamping-claro.svg',
  'glamping-vista-antigua': '/img/mapa/glamping-oscuro.svg',
}

// Pin SVG del color del grupo; es un elemento del DOM, no una capa de WebGL.
function createPin(place, onSelect) {
  const group = GROUP_BY_KEY[place.group]
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'mapa-pin'
  button.setAttribute('aria-label', `${place.name}, ${placeSubtitle(place)}`)
  const icon = TEST_ICONS[place.slug]
  if (icon) {
    button.innerHTML = `<img class="mapa-pin__icono" src="${icon}" width="${ICON_SIZE}" height="${ICON_SIZE}" alt="" />`
  } else button.innerHTML = `<svg class="mapa-pin__icono" viewBox="0 0 24 32" width="30" height="40" aria-hidden="true"><path d="M12 1C5.9 1 1 5.8 1 11.8 1 20 12 31 12 31s11-11 11-19.2C23 5.8 18.1 1 12 1z" fill="${group.color}" stroke="#ffffff" stroke-width="2"/><circle cx="12" cy="12" r="4.5" fill="#ffffff"/></svg>`
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    onSelect(place)
  })
  return button
}

function fitToPlaces(map, places) {
  if (places.length === 0) return
  // El contenedor puede haber cambiado de tamaño desde que se creó el mapa.
  map.resize()
  const bounds = new LngLatBounds()
  places.forEach((place) => bounds.extend([place.longitude, place.latitude]))
  map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 0 })
}

function placeSubtitle(place) {
  return place.type ? `${place.categoryName} · ${place.type}` : place.categoryName
}

// Mapa de MapLibre con los lugares de GET /api/map.
// `groups`: lista de grupos a mostrar (por defecto, todos).
// `fill`: el mapa toma el alto de su contenedor en vez de uno propio.
// `explorer`: panel lateral con buscador, filtros y lista de lugares; al elegir
// un lugar el mapa se centra en él.
export default function LiveMap({
  groups = null,
  label = 'Mapa de Gramalote',
  showLegend = false,
  showList = false,
  fill = false,
  filterable = false,
  explorer = false,
  initialGroup = '',
  initialType = '',
}) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const popupRef = useRef(null)
  const markersRef = useRef(new Map())
  const placesRef = useRef([])
  const listRef = useRef(null)
  const [allPlaces, setAllPlaces] = useState([])
  const [status, setStatus] = useState('loading')
  const [readyMap, setReadyMap] = useState(null)
  const [activeGroup, setActiveGroup] = useState(initialGroup)
  const [activeType, setActiveType] = useState(initialType)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const groupsKey = groups ? groups.join(',') : ''

  const places = useMemo(() => {
    const term = normalize(search)
    return allPlaces.filter(
      (place) =>
        (!activeGroup || place.group === activeGroup) &&
        (!activeType || place.type === activeType) &&
        (!term || normalize(`${place.name}${place.type ?? ''}`).includes(term)),
    )
  }, [allPlaces, activeGroup, activeType, search])

  // Tipos disponibles dentro del grupo elegido (o de todos) para el segundo filtro.
  const typeOptions = useMemo(() => {
    const names = allPlaces
      .filter((place) => (!activeGroup || place.group === activeGroup) && place.type)
      .map((place) => place.type)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'es'))
  }, [allPlaces, activeGroup])

  useEffect(() => {
    placesRef.current = allPlaces
  }, [allPlaces])

  // Abre el popup de un lugar; el enlace a la ficha navega sin recargar la página.
  const showPopup = (map, place) => {
    const content = document.createElement('div')
    content.className = 'mapa-popup'
    const title = document.createElement('strong')
    title.textContent = place.name
    const detail = document.createElement('span')
    detail.textContent = placeSubtitle(place)
    content.append(title, detail)
    if (place.kind === 'establishment' && place.slug) {
      const href = `/establecimiento/${place.slug}`
      const link = document.createElement('a')
      link.href = href
      link.textContent = 'Ver ficha'
      link.className = 'mapa-popup__enlace'
      link.addEventListener('click', (event) => {
        event.preventDefault()
        navigate(href)
      })
      content.append(link)
    }
    popupRef.current
      ?.setOffset(TEST_ICONS[place.slug] ? [0, -ICON_SIZE / 2] : [0, -38])
      .setLngLat([place.longitude, place.latitude])
      .setDOMContent(content)
      .addTo(map)
  }

  useEffect(() => {
    const controller = new AbortController()
    const allowed = groupsKey ? groupsKey.split(',') : null
    const pins = markersRef.current
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

    popupRef.current = new Popup({ closeButton: true, closeOnClick: false, maxWidth: '260px', offset: [0, -38] })

    const dataLoaded = getJson('/map', { signal: controller.signal })

    // Los pines son elementos del DOM: no hace falta esperar a las teselas.
    dataLoaded
      .then((response) => {
        if (removed) return
        const loaded = toPlaces(response?.data).filter(
          (place) => !allowed || allowed.includes(place.group),
        )
        setAllPlaces(loaded)
        setStatus('ready')

        setReadyMap(map)
      })
      .catch((error) => {
        if (error?.name === 'AbortError' || removed) return
        setStatus('error')
      })

    // En StrictMode el efecto se monta, se limpia y se monta de nuevo:
    // remove() libera el mapa de la primera pasada.
    return () => {
      removed = true
      controller.abort()
      popupRef.current?.remove()
      pins.forEach((marker) => marker.remove())
      pins.clear()
      map.remove()
    }
    // showPopup solo usa refs y navigate, que no cambian entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsKey])

  // Un pin por lugar visible; cambia con los filtros y se encuadra sobre ellos.
  useEffect(() => {
    if (!readyMap) return
    const markers = markersRef.current
    markers.forEach((marker) => marker.remove())
    markers.clear()
    popupRef.current?.remove()
    places.forEach((place) => {
      const marker = new Marker({
        element: createPin(place, (item) => {
          setSelectedId(item.id)
          showPopup(readyMap, item)
        }),
        anchor: TEST_ICONS[place.slug] ? 'center' : 'bottom',
      })
        .setLngLat([place.longitude, place.latitude])
        .addTo(readyMap)
      markers.set(place.id, marker)
    })
    fitToPlaces(readyMap, places)
    // showPopup solo usa refs y navigate, que no cambian entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyMap, places])

  // Resalta el pin elegido y deja su tarjeta a la vista en la lista.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement()
      const active = id === selectedId
      element.toggleAttribute('data-activo', active)
      element.style.zIndex = active ? '2' : ''
    })
    listRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [places, selectedId])

  const chooseGroup = (key) => {
    setActiveGroup(key)
    setActiveType('')
    setSelectedId('')
  }

  // Centra el mapa en el lugar elegido de la lista y abre su popup.
  const focusPlace = (place) => {
    setSelectedId(place.id)
    if (!readyMap) return
    readyMap.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(readyMap.getZoom(), 16),
      duration: 800,
    })
    showPopup(readyMap, place)
  }

  const visibleGroups = groups ? GROUPS.filter((group) => groups.includes(group.key)) : GROUPS

  const typeSelect =
    typeOptions.length > 1 ? (
      <label className="mapa-filtros__tipo">
        <span>Tipo</span>
        <select value={activeType} onChange={(event) => setActiveType(event.target.value)}>
          <option value="">Todos los tipos</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
    ) : null

  const statusNotes = (
    <>
      {status === 'loading' ? <p className="note">Cargando lugares…</p> : null}
      {status === 'error' ? (
        <p className="note">No se pudieron cargar los lugares. Intenta de nuevo más tarde.</p>
      ) : null}
      {status === 'ready' && places.length === 0 ? (
        <p className="note">
          {allPlaces.length > 0
            ? 'No hay lugares con ese filtro.'
            : 'Todavía no hay lugares con ubicación para mostrar.'}
        </p>
      ) : null}
    </>
  )

  if (explorer) {
    return (
      <div className="mapa-explorador">
        <aside className="mapa-panel" aria-label="Lugares del mapa">
          <input
            type="search"
            className="mapa-panel__buscar"
            placeholder="Buscar un lugar…"
            aria-label="Buscar un lugar"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setSelectedId('')
            }}
          />
          <div className="mapa-filtros__grupos" role="group" aria-label="Filtrar por categoría">
            {[{ key: '', label: 'Todos' }, ...visibleGroups].map((group) => (
              <button
                key={group.key}
                type="button"
                className="mapa-filtro"
                aria-pressed={activeGroup === group.key}
                onClick={() => chooseGroup(group.key)}
              >
                {group.color ? (
                  <span className="mapa-filtro__punto" style={{ background: group.color }} aria-hidden="true" />
                ) : null}
                {group.label}
              </button>
            ))}
          </div>
          {typeSelect}
          <p className="mapa-panel__cuenta" aria-live="polite">
            {places.length === 1 ? '1 lugar' : `${places.length} lugares`}
          </p>
          {statusNotes}
          <ul className="mapa-panel__lista" ref={listRef}>
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className="mapa-lugar"
                  aria-current={selectedId === place.id ? 'true' : undefined}
                  onClick={() => focusPlace(place)}
                >
                  {place.photo ? (
                    <img className="mapa-lugar__foto" src={place.photo} alt="" loading="lazy" />
                  ) : (
                    <span
                      className="mapa-lugar__foto mapa-lugar__foto--vacia"
                      style={{ background: GROUP_BY_KEY[place.group].color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="mapa-lugar__texto">
                    <strong>{place.name}</strong>
                    <span>{placeSubtitle(place)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div
          ref={containerRef}
          className="mapa mapa--explorador"
          role="region"
          aria-label={label}
        />
      </div>
    )
  }

  return (
    <>
      {filterable ? (
        <div className="mapa-filtros">
          <div className="mapa-filtros__grupos" role="group" aria-label="Filtrar por categoría">
            {[{ key: '', label: 'Todos' }, ...visibleGroups].map((group) => (
              <button
                key={group.key}
                type="button"
                className="mapa-filtro"
                aria-pressed={activeGroup === group.key}
                onClick={() => chooseGroup(group.key)}
              >
                {group.label}
              </button>
            ))}
          </div>
          {typeSelect}
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={`mapa${fill ? ' mapa--fill' : ''}`}
        role="region"
        aria-label={label}
      />

      {showLegend ? (
        <ul className="mapa-leyenda" aria-label="Leyenda del mapa">
          {visibleGroups.map((group) => (
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
      ) : null}

      {statusNotes}

      {showList && places.length > 0 ? (
        <ul className="mapa-lista" aria-label="Lugares en el mapa">
          {places.map((place) => (
            <li key={place.id}>
              <strong>{place.name}</strong>
              <span>{placeSubtitle(place)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}
