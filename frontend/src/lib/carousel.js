// Utilidades del carrusel de eventos (Inicio y Páginas › Carrusel).
import { CAROUSEL_LIMITS } from '../data/pages.js'

const pad = (value) => String(value).padStart(2, '0')

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Diapositivas que se ven hoy: activas, con imagen y dentro de sus fechas.
export function visibleSlides(slides, today = todayKey()) {
  return (slides ?? []).filter(
    (slide) =>
      slide &&
      slide.active !== false &&
      slide.image &&
      (!slide.startsAt || slide.startsAt <= today) &&
      (!slide.endsAt || slide.endsAt >= today),
  )
}

export function intervalSeconds(value) {
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return 7
  return Math.min(CAROUSEL_LIMITS.maxInterval, Math.max(CAROUSEL_LIMITS.minInterval, Math.round(seconds)))
}
