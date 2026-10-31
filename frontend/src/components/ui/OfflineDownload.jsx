import { useEffect, useState } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import {
  clearOfflineData,
  downloadForOffline,
  offlineSupported,
  readOfflineState,
} from '../../lib/offline.js'

const dateFormat = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  hour: 'numeric',
  minute: '2-digit',
})

// "Descarga previa": guarda fichas, fotos y la app para consultarlas sin señal.
export default function OfflineDownload() {
  const [saved, setSaved] = useState(() => readOfflineState())
  const [megabytes, setMegabytes] = useState(null)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')
  const supported = offlineSupported()

  useEffect(() => {
    if (!supported) return
    fetch(`${import.meta.env.BASE_URL}offline-manifest.json`)
      .then((response) => response.json())
      .then((manifest) => {
        const bytes = manifest.files.reduce((sum, file) => sum + file.bytes, 0)
        // Las fotos de las fichas en /media suman unos 5 MB más.
        setMegabytes(Math.ceil(bytes / 1024 / 1024) + 5)
      })
      .catch(() => {})
  }, [supported])

  if (!supported) return null

  async function handleDownload() {
    setError('')
    setProgress({ done: 0, total: 0 })
    try {
      const state = await downloadForOffline(setProgress)
      setSaved(state)
      if (state.failed > 0) {
        setError(`No se pudieron guardar ${state.failed} archivos. Inténtalo de nuevo con mejor señal.`)
      }
    } catch {
      setError('No se pudo completar la descarga. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setProgress(null)
    }
  }

  async function handleClear() {
    await clearOfflineData()
    setSaved(null)
    setError('')
  }

  const busy = progress !== null
  const percent = progress?.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <section className="offline-card" id="sin-conexion" aria-labelledby="sin-conexion-titulo">
      <span className="offline-card__icon">
        <Icon name="download" size={30} />
      </span>
      <div className="offline-card__body">
        <h3 id="sin-conexion-titulo">Lleva Gramalote sin conexión</h3>
        <p>
          En algunas veredas la señal es intermitente. Descarga las fichas, las fotos y la
          app{megabytes ? ` (unos ${megabytes} MB)` : ''} antes de salir y consúltalas sin
          internet. El mapa muestra las zonas que hayas visto con conexión.
        </p>

        {busy ? (
          <div className="offline-card__progress" role="status">
            <progress max={100} value={percent} />
            <span>
              Descargando… {progress.done} de {progress.total || '…'} archivos
            </span>
          </div>
        ) : saved ? (
          <p className="offline-card__status" role="status">
            Guardado el {dateFormat.format(new Date(saved.savedAt))}
          </p>
        ) : null}

        {error ? <p className="offline-card__error">{error}</p> : null}

        <div className="offline-card__actions">
          <Button type="button" icon="arrow" disabled={busy} onClick={handleDownload}>
            {saved ? 'Actualizar descarga' : 'Descargar para usar sin conexión'}
          </Button>
          {saved && !busy ? (
            <button type="button" className="offline-card__clear" onClick={handleClear}>
              Borrar datos guardados
            </button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
