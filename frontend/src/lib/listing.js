// Utilidades de los listados de Dónde comer / dormir / comprar.
import { useState } from 'react'

export const PAGE_SIZE = 6

// Paginación local: "Cargar más" muestra PAGE_SIZE fichas más. El contador
// vuelve a PAGE_SIZE cuando cambian los filtros (signature).
export function usePagedList(items, signature) {
  const [state, setState] = useState({ signature, count: PAGE_SIZE })
  const count = state.signature === signature ? state.count : PAGE_SIZE

  return {
    visible: items.slice(0, count),
    hasMore: items.length > count,
    loadMore: () => setState({ signature, count: count + PAGE_SIZE }),
  }
}

// Rangos de la lista "Precio" de Dónde comprar, en el mismo orden que
// categories.comprar.prices.
export const PRICE_RANGES = [
  [0, 50000],
  [50000, 150000],
  [150000, Infinity],
]

// Los precios se guardan como texto libre ("$4.000 – $35.000", "15k, 20k",
// "desde 35k asta 700k"), así que se extraen las cifras para comparar.
export function priceBounds(text) {
  if (!text) return null
  const amounts = []
  for (const match of String(text).matchAll(/(\d[\d.,]*)\s*(k|mil)?/gi)) {
    let value = Number(match[1].replace(/[.,]/g, ''))
    if (!Number.isFinite(value)) continue
    if (match[2]) value *= 1000
    if (value >= 1000) amounts.push(value)
  }
  if (amounts.length === 0) return null
  return { min: Math.min(...amounts), max: Math.max(...amounts) }
}

export function matchesPriceRange(text, rangeIndex) {
  const range = PRICE_RANGES[rangeIndex]
  const bounds = priceBounds(text)
  if (!range || !bounds) return false
  return bounds.min <= range[1] && bounds.max >= range[0]
}
