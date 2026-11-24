import { useEffect } from 'react'
import { ADMIN_NOTICE_EVENT } from '../../lib/adminNotice.js'
import { useAdminToast } from '../../lib/useAdminToast.jsx'

// Muestra los avisos que llegan con showAdminNotice (ver lib/adminNotice.js).
export default function AdminToastHost() {
  const { notify, toast } = useAdminToast()

  useEffect(() => {
    const onNotice = (event) => {
      const { tone, title, message } = event.detail ?? {}
      notify(tone, title, message)
    }
    window.addEventListener(ADMIN_NOTICE_EVENT, onNotice)
    return () => window.removeEventListener(ADMIN_NOTICE_EVENT, onNotice)
  }, [notify])

  return toast
}
