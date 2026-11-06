import { useState } from 'react'

// Estado del carrusel: índice actual con vuelta al principio/final.
export function useCarousel(count) {
  const [index, setIndex] = useState(0)
  const current = count > 0 ? Math.min(index, count - 1) : 0

  return {
    index: current,
    prev: () => setIndex((current - 1 + count) % count),
    next: () => setIndex((current + 1) % count),
    go: setIndex,
  }
}
