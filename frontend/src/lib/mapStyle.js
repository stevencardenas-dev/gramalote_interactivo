// Estilo del mapa con teselas propias (PMTiles vectoriales de Protomaps, datos
// de OpenStreetMap). No hay peticiones a servidores de terceros: el archivo
// .pmtiles, las tipografías y los sprites los sirve el mismo nginx.
import { addProtocol } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { layers, namedFlavor } from '@protomaps/basemaps'

const PMTILES_URL = import.meta.env.VITE_MAP_PMTILES_URL || '/tiles/norte-de-santander.pmtiles'

const ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a> · ' +
  '<a href="https://protomaps.com" target="_blank" rel="noopener">Protomaps</a>'

let registered = false

function registerProtocol() {
  if (registered) return
  addProtocol('pmtiles', new Protocol().tile)
  registered = true
}

// pmtiles:// necesita URL absoluta; las rutas relativas se resuelven contra el sitio.
function absolute(url) {
  return new URL(url, window.location.origin + import.meta.env.BASE_URL).href
}

// Variante del estilo claro con más contraste: el fondo más claro, las casas en
// un tono cálido con borde y las calles blancas con borde marcado, para que no se
// confundan entre sí al acercar el mapa.
const flavor = {
  ...namedFlavor('light'),
  earth: '#f4f1ea',
  buildings: '#d9bfa0',
  minor_a: '#ffffff',
  minor_b: '#ffffff',
  minor_casing: '#b9b1a3',
  link: '#ffffff',
  link_casing: '#b9b1a3',
  major: '#ffffff',
  major_casing_early: '#b9b1a3',
  major_casing_late: '#a79f90',
  minor_service: '#ffffff',
  minor_service_casing: '#b9b1a3',
  other: '#d8c9ad',
  pedestrian: '#ece7d8',
  highway: '#fff3d6',
  highway_casing_early: '#c9a96a',
  highway_casing_late: '#c9a96a',
}

const BUILDING_OUTLINE = {
  id: 'buildings_outline',
  type: 'line',
  source: 'protomaps',
  'source-layer': 'buildings',
  minzoom: 14,
  paint: {
    'line-color': '#a98a66',
    'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.4, 18, 1.2],
  },
}

export function buildMapStyle() {
  registerProtocol()
  const base = import.meta.env.BASE_URL
  return {
    version: 8,
    glyphs: `${base}map-assets/fonts/{fontstack}/{range}.pbf`,
    sprite: absolute(`${base}map-assets/sprites/v4/light`),
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${absolute(PMTILES_URL)}`,
        attribution: ATTRIBUTION,
      },
    },
    layers: layers('protomaps', flavor, { lang: 'es' }).flatMap((layer) =>
      layer.id === 'buildings' ? [layer, BUILDING_OUTLINE] : [layer],
    ),
  }
}
