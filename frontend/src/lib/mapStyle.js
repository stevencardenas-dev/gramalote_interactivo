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
    layers: layers('protomaps', namedFlavor('light'), { lang: 'es' }),
  }
}
