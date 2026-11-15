import { useMemo } from 'react'

// Mapa esquemático del territorio: los tres emplazamientos históricos de
// Gramalote con sus patrimonios repartidos por zona. No inventa coordenadas:
// cada punto representa un registro del inventario dentro de su zona, que es el
// dato que sí está validado (ver data/historia.js).
const ZONE_MAP = {
  caldereros: { label: 'Caldereros', cx: 24, cy: 32, tone: 'green' },
  'gramalote-viejo': { label: 'Gramalote Viejo', cx: 47, cy: 68, tone: 'coral' },
  'nuevo-gramalote': { label: 'Nuevo Gramalote', cx: 77, cy: 33, tone: 'navy' },
}

// Reparto estable alrededor del centro de cada zona (espiral áurea).
function place(zone, index) {
  const meta = ZONE_MAP[zone]
  if (!meta) return { x: 50, y: 50 }
  const angle = index * 2.39996 - Math.PI / 3
  const radius = index === 0 ? 0 : 7 + (index % 3) * 2.6
  return {
    x: meta.cx + Math.cos(angle) * radius,
    y: meta.cy + Math.sin(angle) * radius * 0.82,
  }
}

export default function HeritageMap({
  items,
  selectedId,
  onSelect,
  interactive = true,
  showLegend = true,
  className = '',
}) {
  const points = useMemo(
    () =>
      items.map((item) => {
        const sameZone = items.filter((other) => other.zone === item.zone)
        const index = sameZone.findIndex((other) => other.slug === item.slug)
        return { item, ...place(item.zone, Math.max(index, 0)) }
      }),
    [items],
  )

  return (
    <div className={`hmap ${className}`.trim()}>
      <div className="hmap__stage">
        <div className="hmap__canvas">
        <svg className="hmap__art" viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hmapBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f1f8ec" />
              <stop offset="55%" stopColor="#e4f2da" />
              <stop offset="100%" stopColor="#d6ebc8" />
            </linearGradient>
            <linearGradient id="hmapWater" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#bcd9e4" />
              <stop offset="100%" stopColor="#9cc7d8" />
            </linearGradient>
          </defs>
          <rect width="1000" height="620" fill="url(#hmapBg)" />
          {/* Curvas de nivel */}
          <g fill="none" stroke="#c2ddb2" strokeWidth="1.4" opacity="0.75">
            <path d="M-40 120C140 40 300 170 470 96s330-30 540 46" />
            <path d="M-40 190C150 104 320 236 500 158s320-22 540 60" />
            <path d="M-40 470C130 392 330 508 520 436s310-40 520 30" />
            <path d="M-40 540C150 466 340 570 540 502s300-34 500 30" />
          </g>
          {/* Río / quebrada */}
          <path
            d="M-20 330C180 300 260 430 420 404s210-140 360-96 180 116 260 88"
            fill="none"
            stroke="url(#hmapWater)"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Caminos */}
          <g fill="none" stroke="#e7d9c6" strokeWidth="6" strokeLinecap="round" strokeDasharray="14 12">
            <path d="M240 210C330 300 400 350 470 430" />
            <path d="M480 420C600 360 690 300 775 220" />
            <path d="M250 200C400 150 620 150 770 215" />
          </g>
          {/* Zonas */}
          <g fill="none" strokeDasharray="10 9" strokeWidth="2">
            <ellipse cx="240" cy="198" rx="150" ry="112" stroke="#4a8a5b" opacity="0.5" />
            <ellipse cx="470" cy="422" rx="165" ry="120" stroke="#db5319" opacity="0.45" />
            <ellipse cx="770" cy="205" rx="170" ry="120" stroke="#00426b" opacity="0.4" />
          </g>
        </svg>

        {Object.entries(ZONE_MAP).map(([id, meta]) => (
          <span
            key={id}
            className={`hmap__zone hmap__zone--${meta.tone}`}
            style={{ left: `${meta.cx}%`, top: `calc(${meta.cy}% + 64px)` }}
          >
            {meta.label}
          </span>
        ))}

        {points.map(({ item, x, y }) => (
          <button
            key={item.slug}
            type="button"
            className={`hmap__pin hmap__pin--${ZONE_MAP[item.zone]?.tone ?? 'navy'}${
              item.slug === selectedId ? ' is-active' : ''
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => interactive && onSelect?.(item)}
            aria-label={`${item.n}. ${item.name}`}
            aria-pressed={item.slug === selectedId}
            tabIndex={interactive ? 0 : -1}
          >
            <span className="hmap__pin-dot" />
            <span className="hmap__pin-label">{item.n}</span>
          </button>
        ))}

        </div>

        {showLegend ? (
          <div className="hmap__legend">
            <p className="hmap__legend-title">Convenciones</p>
            <ul>
              <li>
                <span className="hmap__dot hmap__dot--green" /> Caldereros (2)
              </li>
              <li>
                <span className="hmap__dot hmap__dot--coral" /> Gramalote Viejo (5)
              </li>
              <li>
                <span className="hmap__dot hmap__dot--navy" /> Nuevo Gramalote (6)
              </li>
            </ul>
          </div>
        ) : null}
      </div>
      <p className="hmap__hint">Toca cada punto para ver el patrimonio de esa zona.</p>
    </div>
  )
}
