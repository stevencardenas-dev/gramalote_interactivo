import { useEffect, useRef } from 'react'
import { useBlocker, useLocation } from 'react-router-dom'
import { useDialog } from './dialog.jsx'

// Avisa antes de perder cambios sin guardar:
//  - al cerrar o recargar la pestaña (aviso del navegador);
//  - al cambiar de ruta dentro del panel (enlaces, botón «atrás», navigate), con el diálogo del panel.
// No avisa al cambiar solo la búsqueda (?pagina=) ni al ir a /acceder (sesión caducada o cierre de sesión).
// Requiere un data router (createBrowserRouter). Tras guardar o borrar, llama a
// allowLeave() justo antes de navigate() para no pedir confirmación otra vez.
export function useUnsavedChanges(active) {
  const { confirm } = useDialog()
  const { pathname } = useLocation()
  const allow = useRef(false)

  // El permiso de salida vale solo para la navegación que lo pidió.
  useEffect(() => {
    allow.current = false
  }, [pathname])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      active &&
      !allow.current &&
      currentLocation.pathname !== nextLocation.pathname &&
      !nextLocation.pathname.startsWith('/acceder'),
  )
  const blockerRef = useRef(blocker)
  useEffect(() => {
    blockerRef.current = blocker
  })

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    confirm({
      title: '¿Salir sin guardar?',
      message: 'Tienes cambios sin guardar. Si sales ahora, se perderán.',
      confirmLabel: 'Salir sin guardar',
      danger: true,
    }).then((ok) => {
      const current = blockerRef.current
      if (current.state !== 'blocked') return
      if (ok) current.proceed()
      else current.reset()
    })
  }, [blocker.state, confirm])

  useEffect(() => {
    if (!active) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])

  return {
    allowLeave: () => {
      allow.current = true
    },
  }
}
