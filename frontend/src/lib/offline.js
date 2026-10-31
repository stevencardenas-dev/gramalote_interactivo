// Modo sin conexión (PWA con descarga previa).
// El service worker (pwa/sw.template.js) guarda la app y lo que se visita; aquí
// se descarga de una vez lo demás: datos de la API y todas las fotos, para que
// el visitante pueda recorrer Gramalote sin señal.
import { adaptEstablishment } from './contentApi'
const BASE = import.meta.env.BASE_URL
const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const STATE_KEY = 'gramalote-offline'
// Mismos nombres que en el service worker.
const API_CACHE = 'gramalote-api'
const MEDIA_CACHE = 'gramalote-media'
const TILES_CACHE = 'gramalote-tiles'
const PARALLEL = 4

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${BASE}sw.js`).catch(() => {})
  })
}

export function offlineSupported() {
  return import.meta.env.PROD && 'serviceWorker' in navigator && 'caches' in window
}

export function readOfflineState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY))
  } catch {
    return null
  }
}

function saveOfflineState(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // Navegación privada o almacenamiento lleno: la descarga sigue valiendo.
  }
}

// Mismas URL que piden las páginas (contentApi.js y LiveMap), para que el
// service worker las encuentre tal cual.
function listUrl(category) {
  const params = new URLSearchParams({ limit: '60' })
  if (category) params.set('category', category)
  return `${API_URL}/establishments?${params.toString()}`
}

// Las fotos que pintan las plantillas: las de la API y, si una ficha aún no
// tiene, las de respaldo del diseño (contentApi.js decide cuál).
function photosOf(item) {
  const adapted = adaptEstablishment(item)
  if (!adapted) return []
  return [
    adapted.photo,
    adapted.hero,
    ...(adapted.gallery ?? []),
    ...(adapted.features ?? []).map((feature) => feature.photo),
    ...(adapted.products ?? []).map((product) => product.photo),
    ...(adapted.relatedItems ?? []).map((related) => related.photo),
    ...(item.images ?? []).map((image) => image.url),
  ]
}

async function store(cache, url) {
  const response = await fetch(url, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`${url} respondió ${response.status}`)
  await cache.put(url, response.clone())
  return response
}

// Descarga todo lo necesario para navegar sin conexión.
// onProgress({ done, total }) se llama tras cada archivo.
export async function downloadForOffline(onProgress = () => {}) {
  navigator.storage?.persist?.().catch(() => {})

  const [apiCache, mediaCache] = await Promise.all([
    caches.open(API_CACHE),
    caches.open(MEDIA_CACHE),
  ])
  const manifest = await (await fetch(`${BASE}offline-manifest.json`, { cache: 'no-cache' })).json()

  // 1. Listados y mapa; de ahí salen las fichas.
  const lists = [listUrl(), listUrl('comer'), listUrl('dormir'), listUrl('comprar')]
  const payloads = await Promise.all(
    [...lists, `${API_URL}/map`].map(async (url) => (await store(apiCache, url)).json()),
  )
  // /api/map devuelve un objeto; las fichas salen de los listados.
  const listed = payloads.slice(0, lists.length).flatMap((payload) => payload.data ?? [])
  const slugs = [...new Set(listed.map((item) => item.slug))]

  const photos = new Set([
    // public/img, public/brand y public/icons (lista generada al compilar).
    ...manifest.files.map((file) => file.url),
    ...listed.flatMap(photosOf),
  ])

  // 2. Cada ficha y sus fotos; 3. el resto de fotos e ilustraciones.
  const tasks = [
    ...slugs.map((slug) => async () => {
      const response = await store(apiCache, `${API_URL}/establishments/${encodeURIComponent(slug)}`)
      photosOf((await response.json()).data).forEach((url) => url && photos.add(url))
    }),
  ]
  let done = 0
  let failed = 0
  const total = () => slugs.length + manifest.shell.length + photos.size
  const tick = () => onProgress({ done: ++done, total: total() })

  async function run(queue) {
    async function worker() {
      while (queue.length > 0) {
        const task = queue.shift()
        try {
          await task()
        } catch {
          failed += 1
        }
        tick()
      }
    }
    await Promise.all(Array.from({ length: PARALLEL }, worker))
  }

  // La app misma, por si el service worker aún no terminó de instalarse.
  const shellCache = await caches.open(`gramalote-shell-${manifest.version}`)
  tasks.push(
    ...manifest.shell.map((url) => async () => {
      if (!(await shellCache.match(url))) await store(shellCache, url)
    }),
  )
  await run(tasks)
  const pending = [...photos].filter(Boolean)
  await run(
    pending.map((url) => async () => {
      if (await mediaCache.match(url, { ignoreVary: true })) return
      await store(mediaCache, url)
    }),
  )

  const state = { savedAt: new Date().toISOString(), version: manifest.version, files: done, failed }
  saveOfflineState(state)
  return state
}

export async function clearOfflineData() {
  await Promise.all([API_CACHE, MEDIA_CACHE, TILES_CACHE].map((name) => caches.delete(name)))
  try {
    localStorage.removeItem(STATE_KEY)
  } catch {
    // Sin almacenamiento local no hay nada que borrar.
  }
}
