import { getJson } from './api.js'

// Encuadre de las fotos por espacio (lo define el panel). Se pide una sola vez y
// lib/imageOrientation.js lo aplica a cada <img> según el espacio donde esté.
//
// La clave de una foto es su ruta sin extensión ni sufijo de ancho (-480, -960): la
// foto grande y sus variantes comparten encuadre. (Copia de cropKey en
// backend/src/routes/media-crops.js.) Cada encuadre es {w, l, t}: ancho de la foto y
// su posición, en % del marco.
export function cropKey(url) {
  const pathname = String(url ?? '').split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/i, '')
  const base = pathname.replace(/\.[a-z0-9]+$/i, '')
  // Solo las fotos subidas (/media/…) tienen variantes por ancho (-480, -960…);
  // en las fijas del sitio el número es parte del nombre (pat-01, pat-02…) y
  // quitarlo juntaba todas en un mismo encuadre.
  return base.startsWith('/media/') ? base.replace(/-\d+$/, '') : base
}

let crops = {}
let loading = null
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

export function getCrop(src, frame) {
  return crops[cropKey(src)]?.[frame] ?? null
}

export function onCropsChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function loadCrops({ force = false } = {}) {
  if (!loading || force) {
    loading = getJson('/media-crops')
      .then((response) => {
        crops = response?.data ?? {}
        emit()
      })
      .catch(() => {
        loading = null
      })
  }
  return loading
}

// Tras guardar desde el panel: se refleja al momento sin esperar a la caché.
export function setCrop(url, frame, crop) {
  const key = cropKey(url)
  const frames = { ...(crops[key] ?? {}) }
  if (crop) frames[frame] = crop
  else delete frames[frame]
  const { [key]: _old, ...rest } = crops
  crops = Object.keys(frames).length > 0 ? { ...rest, [key]: frames } : rest
  emit()
}
