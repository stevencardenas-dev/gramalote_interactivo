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
import { formatAverage, formatVotes } from '../../lib/ratingsApi.js'


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
// el nombre de la categoría. `icon` es el que se muestra en los filtros.
const GROUPS = [
  { key: 'comer', label: 'Dónde comer', color: '#c2410c', radius: 8, icon: 'restaurante' },
  { key: 'dormir', label: 'Dónde dormir', color: '#486284', radius: 10, icon: 'hotel' },
  { key: 'comprar', label: 'Dónde comprar', color: '#2f7d4f', radius: 12, icon: 'artesanias' },
  { key: 'experiencia', label: 'Experiencias', color: '#7c3aed', radius: 14, icon: 'experiencias' },
  { key: 'patrimonio', label: 'Patrimonio', color: '#a16207', radius: 11, icon: 'monumento' },
  { key: 'extras', label: 'Extras', color: '#0f766e', radius: 9, icon: 'alcaldia' },
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
  const items = [
    ...(data?.establishments ?? []),
    ...(data?.experiences ?? []),
    ...(data?.extras ?? []),
    ...(data?.heritage ?? []),
  ]
  return items
    .filter((item) => isValidCoordinates(item.coordinates))
    .map((item) => {
      const isExtra = item.kind === 'extra'
      const isHeritage = item.kind === 'heritage'
      const group = isExtra
        ? 'extras'
        : isHeritage
          ? 'patrimonio'
          : item.kind === 'experience'
            ? 'experiencia'
            : item.category?.slug
      return {
        id: `${item.kind}-${item.id}`,
        slug: item.slug,
        kind: item.kind,
        name: item.name,
        group: GROUP_BY_KEY[group] ? group : null,
        categoryName: item.category?.name ?? GROUP_BY_KEY[group]?.label ?? '',
        extraCategory: isExtra ? (item.category ?? null) : null,
        summary: item.summary ?? null,
        zoneName: item.zone?.name ?? null,
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

// Iconos ilustrados (src/data/mapIcons.js), medidos en píxeles.
const ICON_SIZE = 48

// Pin con el icono del lugar; es un elemento del DOM, no una capa de WebGL.
function createPin(place, onSelect) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'mapa-pin'
  button.setAttribute('aria-label', `${place.name}, ${placeSubtitle(place)}`)
  const image = document.createElement('img')
  image.className = 'mapa-pin__icono'
  image.src = mapIconUrl(place.icon)
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

// Nota del lugar tal como se ve en la lista: 0 cuando nadie ha votado.
const formatRating = (rating) =>
  rating.votes ? `${formatAverage(rating.average)} (${rating.votes})` : '0'

// Mapa de MapLibre con los lugares de GET /api/map.
// `groups`: lista de grupos a mostrar (por defecto, todos).
// `fill`: el mapa toma el alto de su contenedor en vez de uno propio.
// `explorer`: panel lateral con buscador y lista de lugares; los filtros van en
// chips sobre el mapa y al elegir un lugar el mapa se centra en él.
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
  const [listOpen, setListOpen] = useState(false)
  // Menú desplegable de un filtro ('group' | 'rating' | 'type') y su posición.
  const [menu, setMenu] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef(null)
  const groupsKey = groups ? groups.join(',') : ''

  const places = useMemo(() => {
    const term = normalize(search)
    return allPlaces.filter((place) => {
      // Extras y Patrimonio no tienen ficha, horario ni calificación. Cuando se
      // filtra por abierto, tipo o calificación desaparecen, como el resto.
      if (place.kind === 'extra' || place.kind === 'heritage') {
        if (activeType || onlyOpen || minRating) return false
        if (activeGroup && place.group !== activeGroup) return false
        return !term || normalize(`${place.name}${place.categoryName}`).includes(term)
      }
      return (
        (!activeGroup || place.group === activeGroup) &&
        (!activeType || place.type === activeType) &&
        (!onlyOpen || place.openNow === true) &&
        (!minRating || place.rating.average >= minRating) &&
        (!term || normalize(`${place.name}${place.type ?? ''}`).includes(term))
      )
    })
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
    setMenu(null)
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
    // Extras y Patrimonio no tienen ficha todavía: el popup lleva directo a
    // Google Maps.
    if (place.kind === 'extra' || place.kind === 'heritage') {
      const link = document.createElement('a')
      link.href =
        place.mapsUrl ??
        `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.textContent = 'Cómo llegar'
      link.className = 'mapa-popup__enlace'
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
        element: createPin(place, (item) => {
          setSelectedId(item.id)
          if (!explorer && !fill) showPopup(readyMap, item)
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

  // El menú de un filtro se cierra al tocar fuera, con Escape, al hacer scroll
  // o al cambiar el tamaño de la ventana (la posición quedaría desfasada).
  useEffect(() => {
    if (!menu) return undefined

    function onPointerDown(event) {
      const target = event.target
      if (menuRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('.mapa-chip')) return
      setMenu(null)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setMenu(null)
    }
    function close(event) {
      // Deslizar dentro del propio menú (por ejemplo la lista de Categoría) no
      // lo cierra: solo se cierra cuando se mueve la página o el mapa.
      if (event?.target instanceof Node && menuRef.current?.contains(event.target)) return
      setMenu(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  // El menú es fijo para no quedar recortado por la fila deslizable de chips.
  function toggleMenu(key, event) {
    if (menu === key) {
      setMenu(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const width = 236
    setMenuPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
    })
    setMenu(key)
  }

  const chooseGroup = (key) => {
    setActiveGroup(key)
    setActiveType('')
    setSelectedId('')
    setMenu(null)
  }

  const chooseRating = (value) => {
    setMinRating(value)
    setMenu(null)
  }

  const chooseType = (value) => {
    setActiveType(value)
    setMenu(null)
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
    if (!explorer && !fill) showPopup(readyMap, place)
  }

  // Ficha del lugar elegido (tarjeta inferior del modo explorador).
  function renderCard(place) {
    const route =
      place.mapsUrl ??
      `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`

    // Extras y Patrimonio: sin ficha todavía, su información vive en la tarjeta.
    if (place.kind === 'extra' || place.kind === 'heritage') {
      return (
        <div className="mapa-ficha mapa-ficha--extra" role="dialog" aria-label={`Información de ${place.name}`}>
          <button type="button" className="mapa-ficha__cerrar" aria-label="Cerrar" onClick={() => setSelectedId('')}>
            ×
          </button>
          <span className="mapa-ficha__icono-caja">
            <img src={mapIconUrl(place.icon)} alt="" width="40" height="40" />
          </span>
          <div className="mapa-ficha__texto">
            <h3>{place.name}</h3>
            <span className="mapa-ficha__sub">
              {place.categoryName}
              {place.zoneName ? ` · ${place.zoneName}` : ''}
            </span>
            <span className="mapa-ficha__nota">
              {place.kind === 'heritage' ? 'Patrimonio · ficha en preparación' : 'Punto complementario · sin ficha'}
            </span>
            <div className="mapa-ficha__acciones">
              <a className="btn btn--primary btn--sm" href={route} target="_blank" rel="noreferrer">
                Cómo llegar
              <span className="visually-hidden"> (se abre en una pestaña nueva)</span></a>
            </div>
          </div>
        </div>
      )
    }

    const href = place.kind === 'experience' ? `/que-hacer/${place.slug}` : `/establecimiento/${place.slug}`
    const { average, votes } = place.rating
    return (
      <div className="mapa-ficha" role="dialog" aria-label={`Ficha de ${place.name}`}>
        <button type="button" className="mapa-ficha__cerrar" aria-label="Cerrar" onClick={() => setSelectedId('')}>
          ×
        </button>
        {place.photo ? (
          <img className="mapa-ficha__foto" src={place.photo} alt="" />
        ) : (
          <span className="mapa-ficha__foto mapa-ficha__foto--vacia" aria-hidden="true" />
        )}
        <div className="mapa-ficha__texto">
          <h3>{place.name}</h3>
          <span className="mapa-ficha__sub">{placeSubtitle(place)}</span>
          <span className="mapa-ficha__estrellas">
            <StarsRow value={average} />
            {votes ? (
              <>
                {formatAverage(average)} <small>({formatVotes(votes)})</small>
              </>
            ) : null}
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
            <span className="visually-hidden"> (se abre en una pestaña nueva)</span></a>
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
    const groupLabel = activeGroup ? GROUP_BY_KEY[activeGroup]?.label : 'Categoría'
    const ratingLabel = minRating ? `${String(minRating).replace('.', ',')}★ o más` : 'Calificación'
    const typeLabel = activeType || 'Tipo'

    return (
      <>
        <div className={`mapa-explorador${listOpen ? ' is-lista' : ''}`}>
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
                      <span className="mapa-lugar__foto mapa-lugar__foto--vacia" aria-hidden="true" />
                    )}
                    <span className="mapa-lugar__texto">
                      <strong>{place.name}</strong>
                      <span className="mapa-lugar__sub">{placeSubtitle(place)}</span>
                      <span className="mapa-lugar__pie">
                        {place.kind === 'extra' || place.kind === 'heritage' ? (
                          <span className="mapa-lugar__sin-ficha">
                            {place.kind === 'heritage' ? 'Patrimonio · ficha en preparación' : 'Sin ficha · solo mapa'}
                          </span>
                        ) : (
                          <>
                            <svg className="mapa-lugar__estrella" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
                            </svg>
                            {formatRating(place.rating)}
                            {place.openNow === null ? null : (
                              <span className={place.openNow ? 'is-open' : undefined}>
                                {place.openNow ? 'Abierto' : 'Cerrado'}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </span>
                    <img
                      className="mapa-lugar__icono"
                      src={mapIconUrl(place.icon)}
                      alt=""
                      width="30"
                      height="30"
                      loading="lazy"
                    />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mapa-ver-lista"
              aria-expanded={listOpen}
              onClick={() => {
                setMenu(null)
                setListOpen((value) => !value)
              }}
            >
              {listOpen
                ? 'Ver mapa'
                : places.length === 0
                  ? 'Sin resultados'
                  : `Ver lista (${places.length})`}
            </button>
          </aside>

          <div className="mapa-escenario">
            <div
              ref={containerRef}
              className="mapa mapa--explorador"
              role="region"
              aria-label={label}
            />

            <div className="mapa-chips" role="toolbar" aria-label="Filtros del mapa">
              <button
                type="button"
                className={`mapa-chip${activeGroup ? ' is-on' : ''}`}
                aria-haspopup="menu"
                aria-expanded={menu === 'group'}
                onClick={(event) => toggleMenu('group', event)}
              >
                {groupLabel}
                <span className="mapa-chip__flecha" aria-hidden="true">▼</span>
              </button>

              <button
                type="button"
                className={`mapa-chip${minRating ? ' is-on' : ''}`}
                aria-haspopup="menu"
                aria-expanded={menu === 'rating'}
                onClick={(event) => toggleMenu('rating', event)}
              >
                {ratingLabel}
                <span className="mapa-chip__flecha" aria-hidden="true">▼</span>
              </button>

              {typeOptions.length > 1 ? (
                <button
                  type="button"
                  className={`mapa-chip${activeType ? ' is-on' : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={menu === 'type'}
                  onClick={(event) => toggleMenu('type', event)}
                >
                  {typeLabel}
                  <span className="mapa-chip__flecha" aria-hidden="true">▼</span>
                </button>
              ) : null}

              <label className={`mapa-chip mapa-chip--check${onlyOpen ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={onlyOpen}
                  onChange={(event) => setOnlyOpen(event.target.checked)}
                />
                Abierto ahora
              </label>

              {filterCount ? (
                <button
                  type="button"
                  className="mapa-chip mapa-chip--quitar"
                  aria-label="Quitar filtros"
                  onClick={clearFilters}
                >
                  ✕
                </button>
              ) : null}
            </div>

            {menu ? (
              <div
                className="mapa-menu"
                ref={menuRef}
                role="menu"
                style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
              >
                {menu === 'group' ? (
                  <>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={!activeGroup}
                      className={!activeGroup ? 'is-on' : undefined}
                      onClick={() => chooseGroup('')}
                    >
                      Todas las categorías
                    </button>
                    {visibleGroups.map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        role="menuitemradio"
                        aria-checked={activeGroup === group.key}
                        className={activeGroup === group.key ? 'is-on' : undefined}
                        onClick={() => chooseGroup(group.key)}
                      >
                        <img
                          className="mapa-menu__icono"
                          src={mapIconUrl(group.icon)}
                          alt=""
                          width="22"
                          height="22"
                        />
                        {group.label}
                      </button>
                    ))}
                  </>
                ) : null}

                {menu === 'rating'
                  ? [
                      [0, 'Cualquier calificación'],
                      [4, '4★ o más'],
                      [4.5, '4,5★ o más'],
                    ].map(([value, text]) => (
                      <button
                        key={value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={minRating === value}
                        className={minRating === value ? 'is-on' : undefined}
                        onClick={() => chooseRating(value)}
                      >
                        {text}
                      </button>
                    ))
                  : null}

                {menu === 'type' ? (
                  <>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={!activeType}
                      className={!activeType ? 'is-on' : undefined}
                      onClick={() => chooseType('')}
                    >
                      Todos los tipos
                    </button>
                    {typeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        role="menuitemradio"
                        aria-checked={activeType === type}
                        className={activeType === type ? 'is-on' : undefined}
                        onClick={() => chooseType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </>
                ) : null}
              </div>
            ) : null}

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

      {/* Vistas previas: misma ficha que el mapa interactivo (se oculta en móvil). */}
      {fill && selectedPlace ? (
        <div className="mapa-ficha-vista">{renderCard(selectedPlace)}</div>
      ) : null}

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
