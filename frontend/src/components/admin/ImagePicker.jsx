import { useModalFocus } from '../../lib/useModalFocus.js'
import { IMAGE_ACCEPT, IMAGE_RULES, checkImageFiles } from '../../lib/imageUpload.js'
import { apiRequest } from '../../lib/auth.js'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

// Popup para elegir una foto de las galerías de las fichas (Páginas). Para no
// cargar cientos de miniaturas de golpe, las fotos se piden paginadas por tipo
// (Experiencias, Establecimientos, Subidas para páginas y los grupos locales) y
// por lugar (una ficha). Con `scope` se limita a una sola ficha, para que la
// foto elegida sea siempre de la ficha a la que enlaza la tarjeta.
//
// places: [{ kind: 'experience' | 'establishment', slug, label, note?, category?, imageCount? }]
// extraGroups: [{ key, label, images: [{ url, alt }] }]  (grupos pequeños, locales)
// onPick({ url, alt, from }) — `from` es el nombre del lugar (la ficha).
const PHOTOS_PER_PAGE = 24

export default function ImagePicker({
  title = 'Elegir foto',
  hint,
  places = [],
  scope = null,
  extraGroups = [],
  current,
  onPick,
  onClose,
  onUpload,
  resetLabel,
  onReset,
}) {
  const titleId = useId()
  const [type, setType] = useState(() => initialType(places, scope, extraGroups, Boolean(onUpload)))
  const [slug, setSlug] = useState(() => initialSlug(places, scope, extraGroups, Boolean(onUpload)))
  const [page, setPage] = useState(1)
  // Resultado por petición: mientras la clave no coincida se muestra «Cargando».
  const [result, setResult] = useState({ key: '', images: [], total: 0 })
  const [failure, setFailure] = useState({ key: '', message: '' })
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef(null)
  const [uploadError, setUploadError] = useState('')

  const panelRef = useModalFocus(onClose)

  const experiencePlaces = useMemo(() => places.filter((place) => place.kind === 'experience'), [places])
  const establishmentPlaces = useMemo(
    () => places.filter((place) => place.kind === 'establishment'),
    [places],
  )

  const types = useMemo(() => {
    const list = []
    if (experiencePlaces.length > 0 || scope?.kind === 'experience') {
      list.push({ key: 'experience', label: 'Experiencias' })
    }
    if (establishmentPlaces.length > 0 || scope?.kind === 'establishment') {
      list.push({ key: 'establishment', label: 'Establecimientos' })
    }
    if (onUpload) list.push({ key: 'upload', label: 'Subidas para páginas' })
    extraGroups
      .filter((group) => group.images.length > 0)
      .forEach((group) => list.push({ key: `extra:${group.key}`, label: group.label }))
    return list
  }, [experiencePlaces, establishmentPlaces, extraGroups, onUpload, scope])

  const placesOfType =
    type === 'experience' ? experiencePlaces : type === 'establishment' ? establishmentPlaces : []
  const effectiveSlug = scope?.slug ?? (placesOfType.some((place) => place.slug === slug) ? slug : placesOfType[0]?.slug ?? '')
  const activePlace = placesOfType.find((place) => place.slug === effectiveSlug) ?? null
  const localGroup = type.startsWith('extra:')
    ? extraGroups.find((group) => `extra:${group.key}` === type) ?? null
    : null
  const localImages = localGroup?.images ?? null

  const scopePlace =
    scope && (places.find((place) => place.kind === scope.kind && place.slug === scope.slug) ?? null)

  // Fotos del lugar elegido: las locales se muestran enteras; las de la API se
  // piden por página para que el popup abra rápido.
  const hasSource = Boolean(localImages || (type && (type === 'upload' || effectiveSlug)))
  const requestKey = hasSource && !localImages ? `${type}|${effectiveSlug}|${page}` : ''

  useEffect(() => {
    if (!requestKey) return undefined
    let alive = true
    const params = new URLSearchParams({ kind: type, page: String(page), perPage: String(PHOTOS_PER_PAGE) })
    if (type !== 'upload') params.set('slug', effectiveSlug)

    apiRequest(`/admin/pages/images?${params.toString()}`)
      .then((payload) => {
        if (alive) setResult({ key: requestKey, images: payload.images ?? [], total: payload.total ?? 0 })
      })
      .catch((err) => {
        if (alive) setFailure({ key: requestKey, message: err.message })
      })

    return () => {
      alive = false
    }
  }, [requestKey, type, effectiveSlug, page])

  const loaded = Boolean(requestKey) && result.key === requestKey
  const shownImages = localImages ?? (loaded ? result.images : [])
  const shownTotal = localImages ? localImages.length : loaded ? result.total : 0
  const totalPages = Math.max(1, Math.ceil(shownTotal / PHOTOS_PER_PAGE))
  const isLoading = Boolean(requestKey) && !loaded && failure.key !== requestKey
  const error = uploadError || (failure.key === requestKey ? failure.message : '')

  function changeType(next) {
    setType(next)
    setPage(1)
    const first = next === 'experience' ? experiencePlaces[0] : next === 'establishment' ? establishmentPlaces[0] : null
    setSlug(first?.slug ?? '')
  }

  function changePlace(next) {
    setSlug(next)
    setPage(1)
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !onUpload) return
    const problem = checkImageFiles([file])
    if (problem) {
      setUploadError(problem)
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const image = await onUpload(file)
      onPick({ url: image.url, alt: image.alt ?? '', from: null })
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function pickImage(image) {
    const from = localImages ? localGroup?.from ?? null : type === 'upload' ? null : activePlace?.label ?? null
    onPick({ url: image.url, alt: image.alt ?? '', from })
  }

  return (
    <div className="admin-dialog" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog__panel admin-picker"
        ref={panelRef}
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
          {!scope && types.length > 1 ? (
            <label className="admin-picker__filter">
              <span>Tipo</span>
              <select value={type} onChange={(event) => changeType(event.target.value)}>
                {types.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {!scope && placesOfType.length > 0 ? (
            <label className="admin-picker__filter admin-picker__filter--place">
              <span>Lugar</span>
              <select value={effectiveSlug} onChange={(event) => changePlace(event.target.value)}>
                {placesOfType.map((place) => (
                  <option key={place.slug} value={place.slug}>
                    {place.label}
                    {place.note ? ` · ${place.note}` : ''}
                    {place.imageCount ? ` (${place.imageCount} fotos)` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {scope && scopePlace ? (
            <p className="admin-picker__scope">
              <strong>{scopePlace.label}</strong>
              {scopePlace.note ? <small>{scopePlace.note}</small> : null}
            </p>
          ) : null}
          {onReset ? (
            <button type="button" className="admin-btn" onClick={onReset}>
              {resetLabel ?? 'Usar la del diseño'}
            </button>
          ) : null}
          {onUpload ? (
            <>
              <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} hidden onChange={handleUpload} />
              <button
                type="button"
                className="admin-btn admin-btn--accent"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                {uploading ? 'Subiendo…' : '+ Subir foto'}
              </button>
            </>
          ) : null}
        </div>
        {onUpload ? <p className="admin-hint">{IMAGE_RULES}</p> : null}
        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <div className="admin-picker__body">
          {isLoading ? <p className="admin-picker__status">Cargando fotos…</p> : null}
          {!isLoading && shownTotal === 0 ? (
            <p className="empty">
              {type === 'upload'
                ? 'Todavía no hay fotos subidas para páginas. Usa «+ Subir foto».'
                : 'Este lugar todavía no tiene fotos. Súbelas en su pestaña «Imágenes».'}
            </p>
          ) : null}
          {!isLoading && shownTotal > 0 ? (
            <section className="admin-picker__group">
              <h3>
                {localGroup?.label ?? activePlace?.label ?? 'Fotos'}
                <small>
                  {shownTotal} {shownTotal === 1 ? 'foto' : 'fotos'}
                  {totalPages > 1 ? ` · página ${page} de ${totalPages}` : ''}
                </small>
              </h3>
              <ul>
                {shownImages.map((image, index) => (
                  <li key={`${image.url}-${index}`}>
                    <button
                      type="button"
                      className={`admin-picker__shot${image.url === current ? ' is-current' : ''}`}
                      onClick={() => pickImage(image)}
                      title={image.alt || activePlace?.label || localGroup?.label || 'Foto'}
                      aria-pressed={image.url === current}
                    >
                      <img src={image.url} alt={image.alt ?? ''} loading="lazy" />
                      {image.url === current ? <span className="admin-badge admin-badge--ok">Actual</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {totalPages > 1 ? (
            <nav className="admin-pager" aria-label="Páginas de fotos">
              <button type="button" className="admin-btn" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                ← Anterior
              </button>
              <span className="admin-pager__info">
                Página {page} de {totalPages} · {shownTotal} fotos
              </span>
              <button
                type="button"
                className="admin-btn"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Siguiente →
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function firstPlaceOf(type, places) {
  return places.find((place) => place.kind === type) ?? null
}

function initialType(places, scope, extraGroups, canUpload) {
  if (scope?.kind) return scope.kind
  if (places.some((place) => place.kind === 'experience')) return 'experience'
  if (places.some((place) => place.kind === 'establishment')) return 'establishment'
  if (canUpload) return 'upload'
  if (extraGroups.length > 0) return `extra:${extraGroups[0].key}`
  return ''
}

function initialSlug(places, scope, extraGroups, canUpload) {
  if (scope?.slug) return scope.slug
  const type = initialType(places, scope, extraGroups, canUpload)
  return firstPlaceOf(type, places)?.slug ?? ''
}
