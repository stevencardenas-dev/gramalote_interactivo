import { useEffect, useRef } from 'react'

// Aviso de lugares a menos de 10 m (lo abre useNearbyCheck al guardar).
export default function NearbyDialog({ places, onFinish }) {
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
