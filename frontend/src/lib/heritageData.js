import { useEffect, useState } from 'react'
import { heritage as fallback } from '../data/historia.js'
import { getJson } from './api.js'

// Patrimonio de Historia: lo que se edita en el panel (Lugares › Patrimonio) viene
// de la API y manda; los datos que trae el sitio sirven de respaldo cuando la API
// no responde (sin conexión) y para dar la numeración y los textos de arranque.

// Slug de la base de datos → slug con el que ya existía la ficha en el sitio.
const SITE_SLUG = { 'templo-san-rafael-antiguo': 'templo-de-san-rafael-antiguo' }


function fromRemote(remote, base, index) {
  const hasImages = Array.isArray(remote.images) && remote.images.length > 0
  return {
    ...(base ?? {}),
    n: base?.n ?? String(index + 1).padStart(2, '0'),
    // La dirección pública no cambia: se conserva el slug con el que ya existía.
    slug: base?.slug ?? remote.slug,
    dbSlug: remote.slug,
    name: remote.name,
    zone: remote.zone ?? base?.zone ?? 'gramalote-viejo',
    zoneLabel: remote.zoneLabel ?? base?.zoneLabel ?? '',
    zoneTag: remote.zoneTag ?? undefined,
    category: remote.category,
    status: remote.status,
    subtitle: remote.subtitle ?? '',
    intro: remote.intro ?? '',
    summary: remote.summary ?? '',
    body: remote.body?.length ? remote.body : (base?.body ?? []),
    visit: remote.visit ?? null,
    hoursText: remote.hoursText ?? null,
    address: remote.address ?? null,
    period: remote.period ?? null,
    sources: remote.sources ?? null,
    mapsUrl: remote.mapsUrl ?? base?.mapsUrl ?? null,
    coords: remote.coords ?? base?.coords,
    coordsApprox: remote.coordsApprox,
    mapZone: undefined,
    image: remote.image ?? base?.image ?? null,
    imageAlt: hasImages ? (remote.imageAlt ?? undefined) : base?.imageAlt,
    imageCaption: hasImages ? (remote.imageCaption ?? undefined) : base?.imageCaption,
    eras: hasImages ? remote.eras : (base?.eras ?? []),
    gallery: hasImages ? remote.gallery : (base?.gallery ?? []),
  }
}

export function mergeHeritage(remoteList) {
  if (!Array.isArray(remoteList) || remoteList.length === 0) return fallback
  const bySlug = new Map(fallback.map((item) => [item.slug, item]))
  return remoteList.map((remote, index) =>
    fromRemote(remote, bySlug.get(SITE_SLUG[remote.slug] ?? remote.slug), index),
  )
}

let cache = null
let pending = null

function load() {
  if (!pending) {
    pending = getJson('/heritage')
      .then((response) => {
        cache = mergeHeritage(response?.data)
        return cache
      })
      .catch(() => {
        pending = null
        return null
      })
  }
  return pending
}

// Lista de patrimonios lista para pintar: arranca con los datos del sitio y se
// actualiza con los de la API en cuanto llegan.
export function useHeritage() {
  const [items, setItems] = useState(cache ?? fallback)
  const [ready, setReady] = useState(cache !== null)

  useEffect(() => {
    let alive = true
    load().then((list) => {
      if (!alive) return
      if (list) setItems(list)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  return { items, ready }
}

export function findHeritage(items, slug) {
  return items.find((item) => item.slug === slug || item.dbSlug === slug) ?? null
}

