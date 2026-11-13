import { useEffect } from 'react'

const SITE = 'Turismo Gramalote'

// Título de la pestaña por vista: "Bambú · Turismo Gramalote".
// Sin título (cargando o sin datos) se deja el nombre del sitio.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE
  }, [title])
}
