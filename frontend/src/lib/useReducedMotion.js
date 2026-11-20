import { useState } from 'react'

// true cuando el sistema del visitante pidió «reducir movimiento».
export function prefersReducedMotion() {
  if (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-a11y-motion')) return true
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

// Valor inicial para un estado «en pausa»: los carruseles arrancan quietos.
export function useStartsPaused() {
  return useState(prefersReducedMotion)
}
