import { useCallback, useRef, useState } from 'react'
import AdminToast from '../components/admin/AdminToast.jsx'

// Avisos del panel (errores y confirmaciones) con un solo formato en todas las páginas.
//
//   const { notify, toast } = useAdminToast()
//   notify('ok', 'Cambios guardados', 'La ficha quedó actualizada.')
//   …
//   {toast}   // se pinta donde antes iba <AdminToast …/>
//
// tone: 'ok' | 'error' | 'warn' | 'info'. Cada aviso se monta de nuevo (key) para
// reiniciar la barra de tiempo aunque se repita el mismo mensaje.
export function useAdminToast() {
  const [current, setCurrent] = useState(null)
  const sequence = useRef(0)

  const close = useCallback(() => setCurrent(null), [])
  const notify = useCallback((tone, title, message) => {
    sequence.current += 1
    setCurrent({ key: sequence.current, tone, title, message })
  }, [])

  const toast = current ? (
    <AdminToast key={current.key} tone={current.tone} title={current.title} message={current.message} onClose={close} />
  ) : null

  return { notify, toast, close }
}
