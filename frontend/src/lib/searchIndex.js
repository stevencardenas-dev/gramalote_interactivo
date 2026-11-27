// Índice del buscador: secciones del sitio, establecimientos y experiencias.
// Los establecimientos se piden una sola vez (la primera vez que se enfoca el
// buscador) y se reutilizan en toda la sesión.
import { componentCatalog } from '../data/componentCatalog.js'
import { activities } from '../data/experiences.js'
import { getJson } from './api.js'
import { adaptEstablishment } from './contentApi.js'
import { load as loadHeritage } from './heritageData.js'

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
let remoteItems = []

const establishmentsIndex = () =>
  getJson('/establishments?limit=60').then((payload) =>
    (payload.data ?? [])
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
      })),
  )

// Patrimonio: lleva a su ficha (mismo criterio que la página de resultados).
const heritageIndex = () =>
  loadHeritage().then((list) =>
    (list ?? []).map((item) => ({
      id: `patrimonio-${item.slug}`,
      title: item.name,
      meta: 'Patrimonio',
      type: [item.category, item.zoneLabel].filter(Boolean).join(' '),
      text: item.summary,
      to: `/historia/patrimonio/${item.slug}`,
      rank: 1,
    })),
  )

// Extras del mapa: llevan al mapa con ese punto ya seleccionado.
const extrasIndex = () =>
  getJson('/map').then((payload) =>
    (payload.data?.extras ?? []).map((item) => ({
      id: `extra-${item.slug}`,
      title: item.name,
      meta: 'Extra',
      type: [item.category?.name, item.zone?.name].filter(Boolean).join(' '),
      text: item.summary ?? '',
      to: `/mapa?extra=${encodeURIComponent(item.slug)}`,
      rank: 1,
    })),
  )

// Pide los lugares una vez; las llamadas siguientes reutilizan la misma promesa.
// Cada origen falla por separado: si uno no responde, los demás siguen buscándose.
export function loadSearchIndex() {
  if (!loading) {
    loading = Promise.allSettled([establishmentsIndex(), heritageIndex(), extrasIndex()]).then(
      (results) => {
        remoteItems = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        if (results.every((result) => result.status === 'rejected')) loading = null
      },
    )
  }
  return loading
}

// Mejores coincidencias para lo que se está escribiendo. A igual relevancia,
// primero las secciones, luego los lugares (establecimientos, patrimonio, extras) y al final las experiencias.
export function suggest(query, limit = 7) {
  if (compact(query).length < 2) return []
  return [...staticItems, ...remoteItems]
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
