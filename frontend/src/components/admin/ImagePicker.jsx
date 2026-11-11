import { useEffect, useId, useMemo, useState } from 'react'

// Popup para elegir una foto de las galerías de las fichas (Páginas). Muestra
// las fotos agrupadas por ficha, con la elegida marcada; opcionalmente permite
// volver a la del diseño y subir una nueva.
//
// groups: [{ key, label, note?, images: [{ url, alt }] }]
// onPick({ url, alt, from }) — `from` es el nombre del grupo (la ficha).
export default function ImagePicker({
  title = 'Elegir imagen',
  hint,
  groups,
  current,
  onPick,
  onClose,
  onUpload,
  resetLabel,
  onReset,
}) {
  const titleId = useId()
  const [filter, setFilter] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase()
    return groups
      .filter((group) => group.images.length > 0)
      .filter((group) => !term || group.label.toLowerCase().includes(term))
  }, [groups, filter])

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUpload) return
    setUploading(true)
    setError('')
    try {
      const image = await onUpload(file)
      onPick({ url: image.url, alt: image.alt ?? '', from: null })
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const total = groups.reduce((sum, group) => sum + group.images.length, 0)

  return (
    <div className="admin-dialog" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog__panel admin-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-picker__head">
          <div>
            <h2 id={titleId} className="admin-dialog__title">
              {title}
            </h2>
            {hint ? <p className="admin-dialog__text">{hint}</p> : null}
          </div>
          <button type="button" className="admin-picker__close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="admin-picker__tools">
          {groups.length > 3 ? (
            <input
              type="search"
              placeholder="Filtrar por ficha…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filtrar por ficha"
            />
          ) : null}
          {onReset ? (
            <button type="button" className="admin-btn" onClick={onReset}>
              {resetLabel ?? 'Usar la del diseño'}
            </button>
          ) : null}
          {onUpload ? (
            <label className="admin-btn admin-btn--accent">
              {uploading ? 'Subiendo…' : '+ Subir imagen'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          ) : null}
        </div>
        {error ? <p className="auth-error">{error}</p> : null}

        <div className="admin-picker__body">
          {total === 0 ? (
            <p className="empty">
              Esta ficha todavía no tiene fotos. Súbelas en su pestaña «Imágenes».
            </p>
          ) : null}
          {visible.map((group) => (
            <section key={group.key} className="admin-picker__group">
              <h3>
                {group.label}
                {group.note ? <small>{group.note}</small> : null}
              </h3>
              <ul>
                {group.images.map((image) => (
                  <li key={image.url}>
                    <button
                      type="button"
                      className={`admin-picker__shot${image.url === current ? ' is-current' : ''}`}
                      onClick={() => onPick({ url: image.url, alt: image.alt ?? '', from: group.from ?? group.label })}
                      title={image.alt || group.label}
                      aria-pressed={image.url === current}
                    >
                      <img src={image.url} alt={image.alt ?? ''} loading="lazy" />
                      {image.url === current ? <span className="admin-badge admin-badge--ok">Actual</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
