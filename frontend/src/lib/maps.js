// Enlace a Google Maps con la ruta hasta el establecimiento. Sin `origin`,
// Google parte de la ubicación actual de quien abre el enlace (pide permiso).
export function googleDirectionsUrl(coordinates) {
  const { latitude, longitude } = coordinates ?? {}
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}

// Props del botón «Ver ubicación en el mapa»: Google Maps si la ficha tiene
// coordenadas; si no, el mapa del sitio.
export function locationButtonProps(item) {
  const href = googleDirectionsUrl(item.coordinates)
  return href
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { to: '/mapa' }
}
