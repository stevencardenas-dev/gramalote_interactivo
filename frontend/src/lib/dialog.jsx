import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import Dialog from '../components/ui/Dialog.jsx'

// Un único popup para todo el sitio y el panel. Cualquier componente puede
// pedir un aviso o una confirmación sin abrir los diálogos del navegador:
//
//   const { alert, confirm } = useDialog()
//   await alert({ title: 'Guardado', message: 'Los cambios ya se ven.' })
//   if (!(await confirm({ title: '¿Borrar…?', confirmLabel: 'Borrar', danger: true }))) return
//
// El popup se dibuja una sola vez, en DialogProvider (main.jsx).
const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [request, setRequest] = useState(null)
  const resolveRef = useRef(null)

  const open = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolveRef.current = resolve
        setRequest(options)
      }),
    [],
  )

  const confirm = useCallback((options) => open({ kind: 'confirm', ...options }), [open])

  const alert = useCallback(
    (options) =>
      open({
        kind: 'alert',
        ...(typeof options === 'string' ? { message: options } : options),
      }),
    [open],
  )

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm])

  function close(answer) {
    const resolve = resolveRef.current
    resolveRef.current = null
    setRequest(null)
    resolve?.(answer)
  }

  return (
    <DialogContext.Provider value={value}>
      {children}
      {request ? <Dialog {...request} onClose={close} /> : null}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error('useDialog debe usarse dentro de <DialogProvider>')
  return context
}
