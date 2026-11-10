// Índice del buscador: secciones del sitio, establecimientos y experiencias.
// Los establecimientos se piden una sola vez (la primera vez que se enfoca el
// buscador) y se reutilizan en toda la sesión.
import { componentCatalog } from '../data/componentCatalog.js'
import { activities } from '../data/experiences.js'
import { getJson } from './api.js'
import { adaptEstablishment } from './contentApi.js'

// Ignora mayúsculas, tildes y ñ; `compact` también ignora los espacios.
export const fold = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
export const compact = (value) => fold(value).replace(/\s+/g, '')
const words = (value) => fold(value).split(/[^a-z0-9]+/).filter(Boolean)

// Relevancia de un resultado (0 = no coincide):
// 3 el nombre empieza por lo escrito, 2 lo contiene, 1 coincide al inicio de
// palabras del tipo o la descripción (solo desde 3 letras, para no traer ruido).
export function score(item, query) {
  const term = compact(query)
  if (!term) return 1
  const title = compact(item.title)
  if (title.startsWith(term)) return 3
  if (title.includes(term)) return 2
  if (term.length < 3) return 0
  const wanted = words(query)
  const matches = (text) => {
    const tokens = words(text)
    return wanted.every((word) => tokens.some((token) => token.startsWith(word)))
  }
  return matches(item.type) || matches(item.text) ? 1 : 0
}

const staticItems = [
  ...componentCatalog.map((item) => ({
    id: `seccion-${item.id}`,
    title: item.name,
    meta: 'Sección',
    type: item.keywords,
    text: item.description,
    to: item.to,
    rank: 0,
  })),
  ...activities.map((item) => ({
    id: `experiencia-${item.slug}`,
    title: item.title,
    meta: 'Experiencia',
    text: item.text,
    to: `/que-hacer/${item.slug}`,
    rank: 2,
  })),
]

let loading = null
let establishmentItems = []

// Pide los establecimientos una vez; las llamadas siguientes reutilizan la misma promesa.
export function loadSearchIndex() {
  if (!loading) {
    loading = getJson('/establishments?limit=60')
      .then((payload) => {
        establishmentItems = (payload.data ?? [])
          .map(adaptEstablishment)
          .filter(Boolean)
          .map((item) => ({
            id: `establecimiento-${item.id}`,
            title: item.name,
            meta: 'Establecimiento',
            type: item.type,
            text: item.summary,
            to: `/establecimiento/${item.slug}`,
            rank: 1,
          }))
      })
      .catch(() => {
        loading = null
      })
  }
  return loading
}

// Mejores coincidencias para lo que se está escribiendo. A igual relevancia,
// primero las secciones, luego los establecimientos y al final las experiencias.
export function suggest(query, limit = 7) {
  if (compact(query).length < 2) return []
  return [...staticItems, ...establishmentItems]
    .map((item) => ({ item, relevance: score(item, query) }))
    .filter(({ relevance }) => relevance > 0)
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        a.item.rank - b.item.rank ||
        a.item.title.localeCompare(b.item.title, 'es'),
    )
    .slice(0, limit)
    .map(({ item }) => item)
}
