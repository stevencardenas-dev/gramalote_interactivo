import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../../lib/auth.js'

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

function NearbyDialog({ places, onFinish }) {
  const review = useRef(null)

  useEffect(() => {
    review.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onFinish(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onFinish])

  return (
    <div className="admin-dialog" role="presentation">
      <div className="admin-dialog__panel nearby" role="alertdialog" aria-modal="true" aria-labelledby="nearby-title" aria-describedby="nearby-text">
        <div className="nearby__head">
          <span className="nearby__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z" />
              <path d="M12 7v3" />
              <path d="M12 13h.01" />
            </svg>
          </span>
          <div>
            <h2 className="nearby__title" id="nearby-title">Hay lugares muy cerca</h2>
            <p className="nearby__text" id="nearby-text">
              A menos de 10 m de estas coordenadas. En el mapa interactivo los puntos podrían taparse.
            </p>
          </div>
        </div>

        <ul className="nearby__list">
          {places.map((place) => (
            <li key={`${place.type}-${place.id}`} className="nearby__item">
              <svg className="nearby__pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
              <span className="nearby__name">
                <strong>{place.name}</strong>
                <small>{place.kind}</small>
              </span>
              <span className="nearby__dist">a {place.distance} m</span>
            </li>
          ))}
        </ul>

        <p className="nearby__hint">
          Revisa la latitud y la longitud, o guarda si es correcto (por ejemplo, dos negocios en el mismo local).
        </p>

        <div className="admin-dialog__actions nearby__actions">
          <button ref={review} type="button" className="admin-btn" onClick={() => onFinish(false)}>
            Revisar coordenadas
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => onFinish(true)}>
            Guardar igual
          </button>
        </div>
      </div>
    </div>
  )
}

// Lleva el foco al campo de latitud de la ficha (lo marca data-field="latitude").
export function focusLatitude() {
  window.requestAnimationFrame(() => {
    const input = document.querySelector('[data-field="latitude"]')
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input?.focus({ preventScroll: true })
  })
}
