import { useCallback, useState } from 'react'

// Avisa a la ficha de qué tarjetas de imagen tienen cambios sin guardar, para
// sumarlos al aviso de «salir sin guardar» (useUnsavedChanges).
export function useImageDrafts() {
  const [pending, setPending] = useState({})
  const report = useCallback((key, dirty) => {
    setPending((current) => {
      if (Boolean(current[key]) === dirty) return current
      const next = { ...current }
      if (dirty) next[key] = true
      else delete next[key]
      return next
    })
  }, [])
  return { anyDirty: Object.keys(pending).length > 0, report }
}
