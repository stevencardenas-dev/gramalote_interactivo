// Enlace a Google Maps con la ruta hasta el establecimiento. Sin `origin`,
// Google parte de la ubicación actual de quien abre el enlace (pide permiso).
export function googleDirectionsUrl(coordinates) {
  const { latitude, longitude } = coordinates ?? {}
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}

// Arma la ruta hasta el lugar a partir del enlace de Google Maps de la ficha
// (`/maps/place/…` con su identificador `!1s0x…:0x…` y coordenadas propias de
// Google, o `query_place_id`). Los enlaces cortos o sin identificador se abren
// tal cual: la ficha del lugar ya trae «Cómo llegar».
function routeFromMapsUrl(mapsUrl, name) {
  let url
  try {
    url = new URL(mapsUrl)
  } catch {
    return mapsUrl
  }
  const raw = decodeURIComponent(url.pathname + url.search)
  const label =
    url.searchParams.get('query') ||
    raw.match(/\/maps\/place\/([^/@]+)/)?.[1]?.replace(/\+/g, ' ') ||
    name ||
    ''
  const placeId = url.searchParams.get('query_place_id') || raw.match(/!19s(ChIJ[\w-]+)/)?.[1]
  if (placeId) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(label)}&destination_place_id=${placeId}`
  }
  const feature = raw.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/)?.[1]
  const point = raw.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/)
  if (feature && point) {
    return `https://www.google.com/maps/dir//${encodeURIComponent(label)}/data=!4m8!4m7!1m0!1m5!1m1!1s${feature}!2m2!1d${point[2]}!2d${point[1]}`
  }
  return mapsUrl
}

// Props del botón «Ver ubicación en el mapa»: la ruta al lugar según el enlace
// de Google Maps de la ficha; si no tiene, la ruta por coordenadas; si tampoco,
// el mapa del sitio.
export function locationButtonProps(item) {
  const href = item.mapsUrl
    ? routeFromMapsUrl(item.mapsUrl, item.name)
    : googleDirectionsUrl(item.coordinates)
  return href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { to: '/mapa' }
}
