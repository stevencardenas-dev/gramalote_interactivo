// Preferencias del menú de accesibilidad del sitio público.
//
// Se guardan en el navegador y se marcan en <html> como atributos data-a11y-*;
// styles/accessibility.css hace el resto. El sitio debe ser accesible sin este menú
// (Resolución 1519 de 2020, WCAG 2.1 AA): esto es una ayuda adicional.

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'gramalote.a11y'

// text: 0 normal, 1 grande, 2 más grande, 3 muy grande.
export const TEXT_LEVELS = ['Normal', 'Grande', 'Más grande', 'Muy grande']
export const DEFAULTS = Object.freeze({
  contrast: false,
  links: false,
  text: 0,
  spacing: false,
  motion: false,
  images: false,
  font: false,
  cursor: false,
})

const listeners = new Set()
let current = null

function sanitize(raw) {
  const next = { ...DEFAULTS }
  if (!raw || typeof raw !== 'object') return next
  for (const key of Object.keys(DEFAULTS)) {
    if (key === 'text') {
      const level = Number(raw.text)
      next.text = Number.isInteger(level) && level >= 0 && level < TEXT_LEVELS.length ? level : 0
    } else {
      next[key] = raw[key] === true
    }
  }
  return next
}

function readStored() {
  try {
    return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY)))
  } catch {
    // Sin almacenamiento (navegación privada) o dato dañado: preferencias por defecto.
    return { ...DEFAULTS }
  }
}

function apply(prefs) {
  const root = document.documentElement
  for (const key of Object.keys(DEFAULTS)) {
    const value = prefs[key]
    if (key === 'text') {
      if (value > 0) root.setAttribute('data-a11y-text', String(value))
      else root.removeAttribute('data-a11y-text')
    } else if (value) {
      root.setAttribute(`data-a11y-${key}`, '')
    } else {
      root.removeAttribute(`data-a11y-${key}`)
    }
  }
}

function snapshot() {
  if (!current) current = readStored()
  return current
}

function save(next) {
  current = next
  apply(next)
  try {
    const changed = Object.keys(DEFAULTS).some((key) => next[key] !== DEFAULTS[key])
    if (changed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sin almacenamiento: la preferencia vale hasta cerrar la página.
  }
  listeners.forEach((listener) => listener())
}

// Se llama una vez al arrancar, antes del primer pintado.
export function initAccessibility() {
  apply(snapshot())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAccessibility() {
  const prefs = useSyncExternalStore(subscribe, snapshot, () => DEFAULTS)

  const toggle = useCallback((key) => save({ ...snapshot(), [key]: !snapshot()[key] }), [])
  const cycleText = useCallback(() => save({ ...snapshot(), text: (snapshot().text + 1) % TEXT_LEVELS.length }), [])
  const reset = useCallback(() => save({ ...DEFAULTS }), [])
  const active = Object.keys(DEFAULTS).some((key) => prefs[key] !== DEFAULTS[key])

  return { prefs, active, toggle, cycleText, reset }
}
