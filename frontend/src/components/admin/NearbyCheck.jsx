import { useCallback, useState } from 'react'
import { apiRequest } from '../../lib/auth.js'
import NearbyDialog from './NearbyDialog.jsx'

// Aviso al guardar: si hay otro lugar (establecimiento, experiencia, patrimonio
// o extra) a menos de 10 m, en el mapa los puntos se taparían. No bloquea: el
// editor revisa las coordenadas o guarda igual.
//
//   const nearby = useNearbyCheck()
//   if (!(await nearby.check({ lat, lng, type: 'establishment', id }))) return
//   …
//   {nearby.element}
export function useNearbyCheck({ onReview } = {}) {
  const [pending, setPending] = useState(null)

  const check = useCallback(async ({ lat, lng, type, id }) => {
    const latitude = Number(lat)
    const longitude = Number(lng)
    if (lat === '' || lng === '' || lat === null || lng === null) return true
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return true
    let places = []
    try {
      const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude), type, id: String(id ?? '') })
      places = (await apiRequest(`/admin/nearby?${params}`)) ?? []
    } catch {
      // Si la consulta falla, no se impide guardar: es solo un aviso.
      return true
    }
    if (places.length === 0) return true
    return new Promise((resolve) => setPending({ places, resolve }))
  }, [])

  function finish(save) {
    pending?.resolve(save)
    setPending(null)
    if (!save) onReview?.()
  }

  const element = pending ? <NearbyDialog places={pending.places} onFinish={finish} /> : null
  return { check, element }
}

// Lleva el foco al campo de latitud de la ficha (lo marca data-field="latitude").
export function focusLatitude() {
  window.requestAnimationFrame(() => {
    const input = document.querySelector('[data-field="latitude"]')
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input?.focus({ preventScroll: true })
  })
}
