// Contenido de las páginas editables desde /admin/paginas.
//
// La API devuelve lo guardado (o null) ya limpio: sin fotos borradas y con
// cada enlace a una ficha resuelto ({ to, available }). Aquí se mezcla encima
// del diseño original (data/pages.js): un valor null o ausente usa el del
// diseño, y las listas de tarjetas se mezclan por `id`.
import { useEffect, useState } from 'react'
import { PAGE_DEFAULTS } from '../data/pages.js'
import { orderBySlugs } from './contentApi.js'

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const STORAGE_PREFIX = 'gramalote:page:'
const cache = new Map()

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export function mergeContent(base, stored) {
  if (stored === null || stored === undefined) return base
  if (Array.isArray(stored)) {
    if (!Array.isArray(base)) return stored
    const byId = new Map(base.filter(isObject).map((item) => [item.id, item]))
    return stored.map((item) => (isObject(item) && byId.has(item.id) ? mergeContent(byId.get(item.id), item) : item))
  }
  if (isObject(stored)) {
    const result = isObject(base) ? { ...base } : {}
    for (const [key, value] of Object.entries(stored)) {
      result[key] = mergeContent(isObject(base) || Array.isArray(base) ? base?.[key] : undefined, value)
    }
    return result
  }
  return stored
}

function readStored(page) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + page)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function writeStored(page, value) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + page, JSON.stringify(value))
  } catch {
    // Sin almacenamiento (modo privado): se vuelve a pedir en la próxima visita.
  }
}

// Lo último conocido de la página: primero la memoria, luego la copia local
// (para que una segunda visita no parpadee con el diseño original).
function known(page) {
  if (cache.has(page)) return cache.get(page)
  const stored = readStored(page)
  if (stored !== undefined) cache.set(page, stored)
  return stored
}

export function usePageContent(page) {
  const [stored, setStored] = useState(() => known(page) ?? null)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_URL}/pages/${page}`, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((payload) => {
        const value = payload?.data ?? null
        cache.set(page, value)
        writeStored(page, value)
        setStored(value)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [page])

  return mergeContent(PAGE_DEFAULTS[page], stored)
}

// Ruta y disponibilidad de un enlace de tarjeta. La API ya los resuelve; sin
// ella (diseño original) se calculan aquí y se dan por disponibles.
export function resolveLink(link) {
  if (!link) return { to: null, available: false }
  const fallback =
    link.kind === 'experience'
      ? `/que-hacer/${link.slug}`
      : link.kind === 'establishment'
        ? `/establecimiento/${link.slug}`
        : link.path ?? null
  return { to: link.to ?? fallback, available: link.available ?? Boolean(fallback) }
}

// Foto de la tarjeta: la elegida en el panel (de la galería de la ficha) o la
// portada de siempre.
export function withCover(item, covers) {
  const photo = covers?.[item.slug]
  return photo ? { ...item, photo } : item
}

// Ordena según lo elegido en el panel; lo no listado va al final, para que una
// ficha nueva no quede oculta.
export function arrange(items, order, covers) {
  return orderBySlugs(items, Array.isArray(order) ? order : []).map((item) => withCover(item, covers))
}

// Las N tarjetas de un bloque de referencias: las elegidas primero y, si alguna
// se despublicó, se completa con otras de la misma categoría.
export function pickRelated(items, block, count) {
  return arrange(items, block?.items, block?.covers).slice(0, count)
}
