// Service worker de Gramalote Interactivo (lo genera pwa/plugin.js al compilar).
// - La app (HTML, JS, CSS) se guarda al instalar: abre sin conexión.
// - La API pública se pide a la red y, si no hay señal, se responde con la
//   última copia guardada.
// - Fotos subidas (/media): primero la copia guardada. Fotos del diseño,
//   iconos y fuentes: la copia guardada, actualizada en segundo plano.
// - Teselas del mapa: solo las que el visitante ya vio con conexión (la política
//   de uso de OpenStreetMap no permite descargarlas en bloque).
/* global self, caches, URL, Response */

const VERSION = __VERSION__
const BASE = __BASE__
const PRECACHE = __PRECACHE__
const TILE_ORIGIN = __TILE_ORIGIN__

const SHELL = `gramalote-shell-${VERSION}`
const API = 'gramalote-api'
const MEDIA = 'gramalote-media'
const TILES = 'gramalote-tiles'
const MAX_TILES = 1500

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('gramalote-shell-') && key !== SHELL)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request, { ignoreVary: true })
    if (cached) return cached
    throw error
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { ignoreVary: true })
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName)
    cache.put(request, response.clone())
  }
  return response
}

// Responde con la copia guardada y la actualiza en segundo plano.
async function staleWhileRevalidate(request, cacheName, onStore) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request, { ignoreVary: true })
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone()).then(onStore)
      }
      return response
    })
    .catch(() => cached)
  return cached ?? network
}

async function trimTiles() {
  const cache = await caches.open(TILES)
  const keys = await cache.keys()
  const extra = keys.length - MAX_TILES
  if (extra > 0) await Promise.all(keys.slice(0, extra).map((key) => cache.delete(key)))
}

async function navigation(request) {
  try {
    return await fetch(request)
  } catch {
    const shell = await caches.match(BASE, { ignoreVary: true })
    return shell ?? new Response('Sin conexión', { status: 503 })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    const path = url.pathname.slice(BASE.length - 1)

    if (path.startsWith('/api/')) {
      // La sesión y el panel siempre van a la red.
      if (path.startsWith('/api/auth') || path.startsWith('/api/admin')) return
      event.respondWith(networkFirst(request, API))
      return
    }
    if (request.mode === 'navigate') {
      event.respondWith(navigation(request))
      return
    }
    if (path.startsWith('/assets/')) {
      event.respondWith(cacheFirst(request, SHELL))
      return
    }
    // Las fotos subidas tienen nombre único: la copia guardada nunca caduca.
    if (path.startsWith('/media/')) {
      event.respondWith(cacheFirst(request, MEDIA))
      return
    }
    // Las del diseño se pueden reemplazar con el mismo nombre (p. ej. un
    // encabezado en mejor calidad): se responde con la guardada y se revisa en
    // segundo plano, así la versión nueva aparece en la siguiente visita.
    if (/^\/(img|brand|icons)\//.test(path)) {
      event.respondWith(staleWhileRevalidate(request, MEDIA))
    }
    return
  }

  if (TILE_ORIGIN && url.origin === TILE_ORIGIN) {
    event.respondWith(staleWhileRevalidate(request, TILES, trimTiles))
    return
  }

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, MEDIA))
  }
})
