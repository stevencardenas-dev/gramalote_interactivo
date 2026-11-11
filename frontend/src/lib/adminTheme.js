// Tema claro/oscuro del panel de administración.
//
// La preferencia es una sola para todas las vistas de /admin y se guarda en el
// navegador. El oscuro es el aspecto de siempre; el claro usa un blanco cálido.
// El tema se marca en <html data-admin-theme> y el CSS del panel
// (styles/admin-light.css) se encarga del resto: fuera de .admin-app no cambia
// nada del sitio público.

import { useCallback, useSyncExternalStore } from 'react'

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

export function setAdminTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  if (next !== getAdminTheme()) {
    current = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento disponible: el cambio vale solo para esta sesión.
    }
    listeners.forEach((listener) => listener())
  }
  paint(next)
  return next
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAdminTheme() {
  const theme = useSyncExternalStore(subscribe, getAdminTheme, () => DEFAULT_THEME)
  const toggle = useCallback(() => {
    setAdminTheme(getAdminTheme() === 'light' ? 'dark' : 'light')
  }, [])
  return { theme, toggle }
}
