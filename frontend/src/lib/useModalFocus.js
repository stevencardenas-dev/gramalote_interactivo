import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Comportamiento común de un diálogo modal (WCAG 2.1.2, 2.4.3, 4.1.2):
// foco inicial dentro, Tab que no se sale, Escape que cierra (si hay onClose)
// y el foco vuelve a lo que abrió el diálogo. Ponle el ref al panel.
export function useModalFocus(onClose) {
  const panelRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const panel = panelRef.current
    const opener = document.activeElement
    if (panel) {
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1')
      const first = panel.querySelector(FOCUSABLE)
      ;(first ?? panel).focus()
    }

    function onKeyDown(event) {
      if (event.key === 'Escape' && closeRef.current) {
        event.stopPropagation()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (!items.length) {
        event.preventDefault()
        panel.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (!panel.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
    }
  }, [])

  return panelRef
}
