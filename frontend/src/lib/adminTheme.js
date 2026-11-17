// Tema claro/oscuro del panel de administración.
//
// La preferencia es una sola para todas las vistas de /admin y se guarda en el
// navegador. El oscuro es el aspecto de siempre; el claro usa un blanco cálido.
// El tema se marca en <html data-admin-theme> y el CSS del panel
// (styles/admin-light.css) se encarga del resto: fuera de .admin-app no cambia
// nada del sitio público.

import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

const STORAGE_KEY = 'gramalote.admin.theme'
const DEFAULT_THEME = 'dark'
const listeners = new Set()
let current = null

function readStored() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    // Navegación privada sin almacenamiento: se queda en el tema por defecto.
    return null
  }
}

function paint(theme) {
  document.documentElement.dataset.adminTheme = theme
}

// Al cambiar de tema el nuevo aspecto se abre como un círculo desde el botón
// (API de transiciones de vista). Si el navegador no la tiene, los colores se
// funden con una clase temporal en <html> (ver admin-dark.css). Con «reducir
// movimiento» el cambio es instantáneo.
const FADE_MS = 500
let fadeTimer = 0

function fadeTheme() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const html = document.documentElement
  html.classList.add('admin-theme-fade')
  window.clearTimeout(fadeTimer)
  fadeTimer = window.setTimeout(() => html.classList.remove('admin-theme-fade'), FADE_MS + 80)
}

export function getAdminTheme() {
  if (current === null) current = readStored() ?? DEFAULT_THEME
  return current
}

// Se llama al arrancar la app para que el tema guardado esté puesto antes del
// primer pintado del panel.
export function initAdminTheme() {
  paint(getAdminTheme())
  return current
}

// origin: {x, y} en píxeles del viewport (el centro del botón que se pulsó).
export function setAdminTheme(theme, origin) {
  const next = theme === 'light' ? 'light' : 'dark'
  if (next === getAdminTheme()) {
    paint(next)
    return next
  }

  current = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Sin almacenamiento disponible: el cambio vale solo para esta sesión.
  }

  const apply = () => {
    paint(next)
    flushSync(() => listeners.forEach((listener) => listener()))
  }
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  if (reduced) {
    apply()
  } else if (origin && typeof document.startViewTransition === 'function') {
    const html = document.documentElement
    // El sitio escala la interfaz con `zoom` en <html> (styles/global.css): las
    // medidas del recorte se interpretan ya escaladas, así que se dividen.
    const zoom = Number.parseFloat(window.getComputedStyle(html).zoom) || 1
    const cx = origin.x / zoom
    const cy = origin.y / zoom
    const radius =
      Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      ) / zoom
    html.classList.add('admin-theme-circle')
    const transition = document.startViewTransition(apply)
    transition.ready
      .then(() =>
        html.animate(
          { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
          { duration: 700, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
        ),
      )
      .catch(() => {})
    transition.finished.finally(() => html.classList.remove('admin-theme-circle'))
  } else {
    fadeTheme()
    apply()
  }
  return next
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, getAdminTheme, () => DEFAULT_THEME)
  const toggle = useCallback((event) => {
    const box = event?.currentTarget?.getBoundingClientRect?.()
    const origin = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined
    setAdminTheme(getAdminTheme() === 'light' ? 'dark' : 'light', origin)
  }, [])
  return { theme, toggle }
}
