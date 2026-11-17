import { useEffect, useMemo, useRef } from 'react'
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { buildMapStyle } from '../../lib/mapStyle.js'

// Mapa de los patrimonios sobre las mismas teselas de Protomaps que el mapa de
// Explorar. Cada patrimonio va en su coordenada real (data/historia.js) y las
// tres zonas se resaltan con el color de la identidad: Nuevo Gramalote (azul),
// Gramalote Viejo (naranja) y Caldereros (verde).
//
// Los límites de las zonas no están en el inventario: el área de cada una es una
// envolvente aproximada alrededor de sus patrimonios ubicados.
const ZONE_MAP = {
  caldereros: { label: 'Caldereros', tone: 'green', color: '#306c46' },
  'gramalote-viejo': { label: 'Gramalote Viejo', tone: 'coral', color: '#db5319' },
  'nuevo-gramalote': { label: 'Nuevo Gramalote', tone: 'navy', color: '#00426b' },
}

const ZONE_RADIUS_M = 230
// Separación mínima (px) entre los centros de dos pines numerados.
const PIN_GAP = 34

const mapZoneOf = (item) => item.mapZone ?? item.zone

// Puntos de un círculo (m) alrededor de [lng, lat].
function circlePoints([lng, lat], radius, steps = 20) {
  const dLat = radius / 111320
  const dLng = radius / (111320 * Math.cos((lat * Math.PI) / 180))
  return Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return [lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat]
  })
}

// Envolvente convexa (cadena monótona de Andrew).
function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const build = (list) => {
    const out = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...build(pts), ...build([...pts].reverse())]
}

function zoneAreas(located) {
  const features = []
  const labels = []
  Object.entries(ZONE_MAP).forEach(([id, meta]) => {
    const coords = located.filter((item) => mapZoneOf(item) === id).map((item) => item.coords)
    if (!coords.length) return
    const ring = hull(coords.flatMap((c) => circlePoints(c, ZONE_RADIUS_M)))
    features.push({
      type: 'Feature',
      properties: { id, color: meta.color },
      geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
    })
    const top = ring.reduce((best, p) => (p[1] > best[1] ? p : best), ring[0])
    const centerLng = ring.reduce((sum, p) => sum + p[0], 0) / ring.length
    labels.push({
      type: 'Feature',
      properties: { label: meta.label, color: meta.color },
      geometry: { type: 'Point', coordinates: [centerLng, top[1]] },
    })
  })
  return {
    areas: { type: 'FeatureCollection', features },
    labels: { type: 'FeatureCollection', features: labels },
  }
}

function pinElement(item, interactive, onClick) {
  const holder = document.createElement('div')
  holder.className = 'hmap__holder'
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `hmap__pin hmap__pin--${ZONE_MAP[mapZoneOf(item)]?.tone ?? 'navy'}`
  button.setAttribute('aria-label', `${item.n}. ${item.name}`)
  button.setAttribute('aria-pressed', 'false')
  button.tabIndex = interactive ? 0 : -1
  button.innerHTML = '<span class="hmap__pin-dot"></span><span class="hmap__pin-label"></span>'
  button.querySelector('.hmap__pin-label').textContent = item.n
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    onClick(item)
  })
  holder.append(button)
  return holder
}

export default function HeritageMap({
  items,
  selectedId,
  onSelect,
  interactive = true,
  showLegend = true,
  showHint = true,
  action = null,
  className = '',
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const pinsRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const spreadRef = useRef(null)

  useEffect(() => {
    onSelectRef.current = onSelect
  })

  const located = useMemo(() => items.filter((item) => Array.isArray(item.coords)), [items])
  const unlocated = items.filter((item) => !Array.isArray(item.coords))
  const counts = useMemo(() => {
    const result = { caldereros: 0, 'gramalote-viejo': 0, 'nuevo-gramalote': 0 }
    located.forEach((item) => {
      result[mapZoneOf(item)] += 1
    })
    return result
  }, [located])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !located.length) return undefined
    const pins = pinsRef.current

    const map = new MapLibreMap({
      container,
      style: buildMapStyle(),
      center: located[0].coords,
      zoom: 14,
      interactive,
      attributionControl: { compact: false },
    })
    mapRef.current = map
    if (interactive) map.addControl(new NavigationControl({ showCompass: false }), 'top-right')

    const { areas, labels } = zoneAreas(located)
    map.on('load', () => {
      map.addSource('zonas', { type: 'geojson', data: areas })
      map.addSource('zonas-nombre', { type: 'geojson', data: labels })
      map.addLayer({
        id: 'zonas-relleno',
        type: 'fill',
        source: 'zonas',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.2 },
      })
      map.addLayer({
        id: 'zonas-borde',
        type: 'line',
        source: 'zonas',
        paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-dasharray': [2, 1.5] },
      })
      map.addLayer({
        id: 'zonas-nombre',
        type: 'symbol',
        source: 'zonas-nombre',
        layout: {
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Medium'],
          'text-size': 13,
          'text-max-width': 30,
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.1,
          'text-anchor': 'bottom',
          'text-offset': [0, -0.4],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': ['get', 'color'], 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
      })
      spreadRef.current?.()
    })

    located.forEach((item) => {
      const marker = new Marker({
        element: pinElement(item, interactive, (picked) => interactive && onSelectRef.current?.(picked)),
        anchor: 'center',
      })
        .setLngLat(item.coords)
        .addTo(map)
      pins.set(item.slug, marker)
    })

    // Los números no se solapan: en pantalla se separan los pines cercanos; al
    // acercar el mapa vuelven a su ubicación real.
    const spread = () => {
      const pts = located.map((item) => {
        const p = map.project(item.coords)
        return { item, x: p.x, y: p.y, ox: p.x, oy: p.y }
      })
      for (let step = 0; step < 80; step += 1) {
        for (let i = 0; i < pts.length; i += 1) {
          for (let j = i + 1; j < pts.length; j += 1) {
            let dx = pts[j].x - pts[i].x
            let dy = pts[j].y - pts[i].y
            let dist = Math.hypot(dx, dy)
            if (dist >= PIN_GAP) continue
            if (dist < 0.01) {
              const angle = (i * 2.4 + j) % (Math.PI * 2)
              dx = Math.cos(angle)
              dy = Math.sin(angle)
              dist = 1
            }
            const push = (PIN_GAP - dist) / 2
            pts[i].x -= (dx / dist) * push
            pts[i].y -= (dy / dist) * push
            pts[j].x += (dx / dist) * push
            pts[j].y += (dy / dist) * push
          }
        }
      }
      pts.forEach((pt) => {
        const moved = Math.hypot(pt.x - pt.ox, pt.y - pt.oy) > 4
        const lngLat = moved ? map.unproject([pt.x, pt.y]) : { lng: pt.item.coords[0], lat: pt.item.coords[1] }
        pins.get(pt.item.slug).setLngLat([lngLat.lng, lngLat.lat])
      })
    }
    spreadRef.current = spread
    map.on('zoom', spread)
    map.on('resize', spread)

    if (!interactive) map.on('click', () => onSelectRef.current?.())

    const bounds = located.reduce(
      (box, item) => box.extend(item.coords),
      new LngLatBounds(located[0].coords, located[0].coords),
    )
    map.fitBounds(bounds, { padding: { top: 90, right: 60, bottom: 60, left: 60 }, maxZoom: 16, duration: 0 })
    spread()

    // Zona prudente: solo el entorno de los patrimonios (con margen), de modo que
    // siempre se vean las tres zonas y no se pueda salir hacia el resto del mapa.
    // El margen se amplía hasta que el recuadro tenga al menos la proporción del
    // marco del mapa; si no, el límite recortaría la vista a lo ancho.
    const west = bounds.getWest()
    const east = bounds.getEast()
    const south = bounds.getSouth()
    const north = bounds.getNorth()
    const ratio = Math.max(container.clientWidth / Math.max(container.clientHeight, 1), 1.7)
    const height = Math.max((north - south) * 1.5, 0.016)
    const width = Math.max((east - west) * 1.5, height * ratio)
    const midLng = (east + west) / 2
    const midLat = (north + south) / 2
    const limit = [
      [midLng - width / 2, midLat - height / 2],
      [midLng + width / 2, midLat + height / 2],
    ]
    map.setMaxBounds(limit)
    const fit = map.cameraForBounds(limit)
    if (fit) map.setMinZoom(fit.zoom)

    return () => {
      pins.forEach((marker) => marker.remove())
      pins.clear()
      map.remove()
      mapRef.current = null
    }
  }, [located, interactive])

  // Pin elegido: resaltado y centrado suave.
  useEffect(() => {
    pinsRef.current.forEach((marker, slug) => {
      const button = marker.getElement().querySelector('.hmap__pin')
      const active = slug === selectedId
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
    const target = selectedId ? located.find((item) => item.slug === selectedId) : null
    if (target && mapRef.current) mapRef.current.easeTo({ center: target.coords, zoom: Math.max(mapRef.current.getZoom(), 16), duration: 600 })
  }, [selectedId, located])

  return (
    <div className={`hmap ${className}`.trim()}>
      <div className="hmap__stage">
        <div className="hmap__canvas">
          <div
            ref={containerRef}
            className="hmap__map"
            role="region"
            aria-label="Mapa de los patrimonios de Gramalote"
          />
          {action ? <div className="hmap__action">{action}</div> : null}
        </div>

        {showLegend ? (
          <div className="hmap__legend">
            <p className="hmap__legend-title">Convenciones</p>
            <ul>
              {Object.entries(ZONE_MAP).map(([id, meta]) => (
                <li key={id}>
                  <span className={`hmap__dot hmap__dot--${meta.tone}`} /> {meta.label} ({counts[id]})
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {showHint ? (
        <p className="hmap__hint">
          {interactive ? 'Toca cada punto para ver el patrimonio de esa zona.' : 'Toca el mapa para explorarlo.'} Las zonas
          sombreadas son aproximadas.
          {unlocated.length
            ? ` Sin ubicación todavía: ${unlocated.map((item) => `${item.n}. ${item.name}`).join(', ')}.`
            : ''}
        </p>
      ) : null}
    </div>
  )
}
