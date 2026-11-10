import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  LngLatBounds,
  setWorkerUrl,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { buildMapStyle } from '../../lib/mapStyle.js'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../../styles/mapa.css'
import { getJson } from '../../lib/api.js'
import { mapIconUrl, resolveMapIcon } from '../../data/mapIcons.js'
import { StarsRow } from './RatingStars.jsx'


// Centro aproximado de Gramalote, en formato [longitud, latitud].
const INITIAL_CENTER = [-72.79, 7.89]
const INITIAL_ZOOM = 13

// Límites aproximados de Norte de Santander: [[oeste, sur], [este, norte]].
// Evitan pedir teselas de otras regiones y llenar el caché offline con ellas.
const NORTE_DE_SANTANDER_BOUNDS = [
  [-73.7, 6.9],
  [-72.0, 9.3],
]
const MIN_ZOOM = 8

// MapLibre busca su worker junto a su propio archivo, que Vite empaqueta en otro
// lugar. Se le indica el worker que trae el paquete npm (sin CDN externo).
setWorkerUrl(workerUrl)

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
        icon: resolveMapIcon({
          mapIcon: item.mapIcon,
          slug: item.slug,
          type: item.type,
          group,
        }),
        photo: item.cover?.url ?? null,
        openNow: item.openNow ?? null,
        rating: item.rating ?? { average: 0, votes: 0 },
        mapsUrl: item.mapsUrl ?? null,
        longitude: item.coordinates.longitude,
        latitude: item.coordinates.latitude,
      }
    })
    .filter((place) => place.group)
}

// Iconos ilustrados (src/data/mapIcons.js), medidos en píxeles. La versión 1
// (fondo oscuro) o 2 (fondo claro) la elige quien mira el mapa con el control
// "Iconos" y se recuerda en este navegador.
const ICON_SIZE = 48
const VERSION_KEY = 'gramalote:iconos-mapa'

function readIconVersion() {
  try {
    return localStorage.getItem(VERSION_KEY) === '2' ? 2 : 1
  } catch {
    return 1
  }
}

function saveIconVersion(version) {
  try {
    localStorage.setItem(VERSION_KEY, String(version))
  } catch {
    // Sin almacenamiento (modo privado): la elección dura lo que la página.
  }
}

// Control de MapLibre (DOM plano) con los botones "1" y "2".
class IconVersionControl {
  constructor(onChange) {
    this.onChange = onChange
  }

  onAdd() {
    this.element = document.createElement('div')
    this.element.className = 'maplibregl-ctrl mapa-version'
    this.element.setAttribute('role', 'group')
    this.element.setAttribute('aria-label', 'Versión de los iconos del mapa')
    const label = document.createElement('span')
    label.textContent = 'Iconos'
    label.setAttribute('aria-hidden', 'true')
    this.element.append(label)
    this.buttons = [1, 2].map((version) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = String(version)
      button.title = version === 1 ? 'Iconos versión 1 (fondo oscuro)' : 'Iconos versión 2 (fondo claro)'
      button.setAttribute('aria-label', button.title)
      button.addEventListener('click', () => this.onChange(version))
      this.element.append(button)
      return button
    })
    return this.element
  }

  setVersion(version) {
    this.buttons?.forEach((button, index) =>
      button.setAttribute('aria-pressed', String(index + 1 === version)),
    )
  }

  onRemove() {
    this.element?.remove()
  }
}

// Pin con el icono del lugar; es un elemento del DOM, no una capa de WebGL.
function createPin(place, version, onSelect) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'mapa-pin'
  button.setAttribute('aria-label', `${place.name}, ${placeSubtitle(place)}`)
  const image = document.createElement('img')
  image.className = 'mapa-pin__icono'
  image.src = mapIconUrl(place.icon, version)
  image.width = ICON_SIZE
  image.height = ICON_SIZE
  image.alt = ''
  button.append(image)
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
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)
  // En escritorio los filtros van abiertos dentro del panel izquierdo; en móvil, como hoja.
  const [sheetOpen, setSheetOpen] = useState(() => window.matchMedia('(min-width: 861px)').matches)
  const [listOpen, setListOpen] = useState(false)
  const [iconVersion, setIconVersion] = useState(readIconVersion)
  const iconVersionRef = useRef(iconVersion)
  const versionControlRef = useRef(null)
  const groupsKey = groups ? groups.join(',') : ''

  const places = useMemo(() => {
    const term = normalize(search)
    return allPlaces.filter(
      (place) =>
        (!activeGroup || place.group === activeGroup) &&
        (!activeType || place.type === activeType) &&
        (!onlyOpen || place.openNow === true) &&
        (!minRating || place.rating.average >= minRating) &&
        (!term || normalize(`${place.name}${place.type ?? ''}`).includes(term)),
    )
  }, [allPlaces, activeGroup, activeType, search, onlyOpen, minRating])

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null
  const filterCount =
    (activeGroup ? 1 : 0) + (activeType ? 1 : 0) + (minRating ? 1 : 0) + (onlyOpen ? 1 : 0)

  function clearFilters() {
    setActiveGroup('')
    setActiveType('')
    setMinRating(0)
    setOnlyOpen(false)
    setSelectedId('')
  }

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
      ?.setOffset([0, -ICON_SIZE / 2])
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
      minZoom: MIN_ZOOM,
      maxBounds: NORTE_DE_SANTANDER_BOUNDS,
      attributionControl: { compact: false },
      style: buildMapStyle(),
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    // En escritorio el selector va dentro del mapa; en móvil (explorador) se usa la barra de arriba.
    const versionControl = new IconVersionControl(setIconVersion)
    map.addControl(versionControl, 'top-left')
    versionControl.setVersion(iconVersionRef.current)
    versionControlRef.current = versionControl

    popupRef.current = new Popup({ closeButton: true, closeOnClick: false, maxWidth: '260px', offset: [0, -ICON_SIZE / 2] })

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
        element: createPin(place, iconVersionRef.current, (item) => {
          setSelectedId(item.id)
          if (!explorer) showPopup(readyMap, item)
        }),
        anchor: 'center',
      })
        .setLngLat([place.longitude, place.latitude])
        .addTo(readyMap)
      markers.set(place.id, marker)
    })
    fitToPlaces(readyMap, places)
    // showPopup solo usa refs y navigate, que no cambian entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyMap, places])

  // Cambia la versión de los iconos sin volver a crear los pines.
  useEffect(() => {
    iconVersionRef.current = iconVersion
    saveIconVersion(iconVersion)
    versionControlRef.current?.setVersion(iconVersion)
    const byId = new Map(places.map((place) => [place.id, place]))
    markersRef.current.forEach((marker, id) => {
      const place = byId.get(id)
      const image = marker.getElement().querySelector('img')
      if (place && image) image.src = mapIconUrl(place.icon, iconVersion)
    })
  }, [iconVersion, places])

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
    setListOpen(false)
    if (!readyMap) return
    readyMap.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(readyMap.getZoom(), 16),
      duration: 800,
    })
    if (!explorer) showPopup(readyMap, place)
  }

  // Ficha del lugar elegido (tarjeta inferior del modo explorador).
  function renderCard(place) {
    const href = place.kind === 'experience' ? `/que-hacer/${place.slug}` : `/establecimiento/${place.slug}`
    const route =
      place.mapsUrl ||
      `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
    const { average, votes } = place.rating
    return (
      <div className="mapa-ficha" role="dialog" aria-label={`Ficha de ${place.name}`}>
        <button type="button" className="mapa-ficha__cerrar" aria-label="Cerrar" onClick={() => setSelectedId('')}>
          ×
        </button>
        {place.photo ? (
          <img className="mapa-ficha__foto" src={place.photo} alt="" />
        ) : (
          <span
            className="mapa-ficha__foto mapa-ficha__foto--vacia"
            style={{ background: GROUP_BY_KEY[place.group].color }}
            aria-hidden="true"
          />
        )}
        <div className="mapa-ficha__texto">
          <h3>{place.name}</h3>
          <span className="mapa-ficha__sub">{placeSubtitle(place)}</span>
          <span className="mapa-ficha__estrellas">
            <StarsRow value={average} />
            {votes ? average.toFixed(1).replace('.', ',') : null}
          </span>
          {place.openNow === null ? null : (
            <span className={place.openNow ? 'mapa-ficha__estado is-open' : 'mapa-ficha__estado'}>
              {place.openNow ? 'Abierto ahora' : 'Cerrado ahora'}
            </span>
          )}
          <div className="mapa-ficha__acciones">
            <Link className="btn btn--primary btn--sm" to={href}>
              Ver ficha
            </Link>
            <a className="btn btn--ghost btn--sm" href={route} target="_blank" rel="noreferrer">
              Cómo llegar
            </a>
          </div>
        </div>
      </div>
    )
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
      <>
      <div className="mapa-barra">
        <span id="iconos-etiqueta">Iconos</span>
        <div role="group" aria-labelledby="iconos-etiqueta" className="mapa-barra__opciones">
          {[1, 2].map((version) => (
            <button
              key={version}
              type="button"
              aria-pressed={iconVersion === version}
              title={version === 1 ? 'Iconos versión 1 (fondo oscuro)' : 'Iconos versión 2 (fondo claro)'}
              onClick={() => setIconVersion(version)}
            >
              {version}
            </button>
          ))}
        </div>
      </div>
      <div className="mapa-explorador">
        <aside className={`mapa-panel${listOpen ? ' is-list-open' : ''}`} aria-label="Lugares del mapa">
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
          <div className="mapa-rapidos">
            <button
              type="button"
              className="mapa-filtro mapa-filtro--mas"
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen((value) => !value)}
            >
              Filtros
              {filterCount ? <span className="mapa-filtro__cuenta">{filterCount}</span> : null}
            </button>
            {listOpen || !selectedPlace ? (
              <button type="button" className="mapa-ver-lista" onClick={() => setListOpen((value) => !value)}>
                {listOpen
                  ? 'Ver mapa'
                  : places.length === 0
                    ? 'Sin resultados'
                    : `Ver lista (${places.length})`}
              </button>
            ) : null}
          </div>
          {filterCount ? (
            <div className="mapa-activos" aria-label="Filtros aplicados">
              {activeGroup ? (
                <span className="mapa-activo">
                  {GROUP_BY_KEY[activeGroup]?.label}
                  <button type="button" aria-label="Quitar categoría" onClick={() => chooseGroup('')}>×</button>
                </span>
              ) : null}
              {activeType ? (
                <span className="mapa-activo">
                  {activeType}
                  <button type="button" aria-label="Quitar tipo" onClick={() => setActiveType('')}>×</button>
                </span>
              ) : null}
              {minRating ? (
                <span className="mapa-activo">
                  {String(minRating).replace('.', ',')}★ o más
                  <button type="button" aria-label="Quitar calificación mínima" onClick={() => setMinRating(0)}>×</button>
                </span>
              ) : null}
              {onlyOpen ? (
                <span className="mapa-activo">
                  Abierto ahora
                  <button type="button" aria-label="Quitar abierto ahora" onClick={() => setOnlyOpen(false)}>×</button>
                </span>
              ) : null}
              <button type="button" className="mapa-limpiar" onClick={clearFilters}>
                Limpiar todo
              </button>
            </div>
          ) : null}
          {
            <div
              className={`mapa-hoja${sheetOpen ? ' is-open' : ''}`}
              onMouseDown={(event) => event.target === event.currentTarget && setSheetOpen(false)}
            >
              <div className="mapa-hoja__panel" role="dialog" aria-modal="true" aria-label="Filtros del mapa">
                <span className="mapa-hoja__asa" aria-hidden="true" />
                <h2 className="mapa-hoja__titulo">
                  <button
                    type="button"
                    className="mapa-hoja__cabecera"
                    aria-expanded={sheetOpen}
                    onClick={() => setSheetOpen((value) => !value)}
                  >
                    <span>
                      Filtrar lugares
                      {filterCount ? <span className="mapa-filtro__cuenta">{filterCount}</span> : null}
                    </span>
                    <span className="mapa-hoja__chevron" aria-hidden="true">▾</span>
                  </button>
                </h2>
                <div className="mapa-hoja__cuerpo">

                <h3>Categoría</h3>
                <div className="mapa-hoja__opciones mapa-hoja__opciones--cuadricula" role="group" aria-label="Categoría">
                  {[{ key: '', label: 'Todas' }, ...visibleGroups].map((group) => (
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

                <label className="mapa-hoja__fila">
                  <span>Abierto ahora</span>
                  <input type="checkbox" checked={onlyOpen} onChange={(event) => setOnlyOpen(event.target.checked)} />
                </label>

                <h3>Calificación mínima</h3>
                <div className="mapa-hoja__opciones" role="group" aria-label="Calificación mínima">
                  {[
                    [0, 'Todas'],
                    [4, '4★ o más'],
                    [4.5, '4,5★ o más'],
                  ].map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      className="mapa-filtro"
                      aria-pressed={minRating === value}
                      onClick={() => setMinRating(value)}
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <div className="mapa-hoja__pie">
                  <button type="button" className="btn btn--ghost" onClick={clearFilters}>
                    Limpiar
                  </button>
                  <button type="button" className="btn btn--primary" onClick={() => setSheetOpen(false)}>
                    Ver {places.length} {places.length === 1 ? 'lugar' : 'lugares'}
                  </button>
                </div>
                </div>
              </div>
            </div>
          }
          <p className="mapa-panel__cuenta" aria-live="polite">
            {places.length === 0 && filterCount
              ? 'Sin resultados con estos filtros'
              : places.length === 1
                ? '1 lugar'
                : `${places.length} lugares`}
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
        <div className="mapa-escenario">
          <div
            ref={containerRef}
            className="mapa mapa--explorador"
            role="region"
            aria-label={label}
          />
          {selectedPlace ? renderCard(selectedPlace) : null}
        </div>

      </div>
      </>
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
