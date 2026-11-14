import { useState } from 'react'

// Listas del panel: 10 por página. Las listas ya llegan completas de la API y
// los filtros de cada página se aplican antes, así que el corte se hace aquí.

export const PAGE_SIZE = 10

export function usePaged(items, size = PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const list = items ?? []
  const pages = Math.max(1, Math.ceil(list.length / size))
  // La página se ajusta al vuelo: si un filtro deja menos páginas, se muestra
  // la última válida sin esperar a un efecto.
  const current = Math.min(page, pages)
  const start = (current - 1) * size
  return {
    page: current,
    pages,
    total: list.length,
    setPage,
    pageItems: list.slice(start, start + size),
  }
}
