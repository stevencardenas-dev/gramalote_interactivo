import AuditTimeline from '../components/admin/AuditTimeline.jsx'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import OpeningHoursEditor from '../components/admin/OpeningHoursEditor.jsx'
import MapIconPicker from '../components/admin/MapIconPicker.jsx'
import { useAdminToast } from '../lib/useAdminToast.jsx'
import CoordinateInput from '../components/admin/CoordinateInput.jsx'
import { focusLatitude, useNearbyCheck } from '../components/admin/NearbyCheck.jsx'
import RatingsPanel from '../components/admin/RatingsPanel.jsx'
import { apiRequest, ensureSession } from '../lib/auth.js'
import { useDialog } from '../lib/dialog.jsx'
import { useUnsavedChanges } from '../lib/useUnsavedChanges.js'
import AdminImageCard from '../components/admin/AdminImageCard.jsx'
import { useImageDrafts } from '../lib/useImageDrafts.js'
import { resolveMapIcon } from '../data/mapIcons.js'

const TABS = [
  { key: 'info', label: 'Información' },
  { key: 'images', label: 'Imágenes' },
  { key: 'extras', label: 'Servicios y extras' },
  { key: 'publish', label: 'Publicación' },
  { key: 'ratings', label: 'Calificaciones' },
  { key: 'history', label: 'Historial' },
]



const PLATFORMS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
  { key: 'website', label: 'Sitio web' },
]
const ROLE_LABELS = { cover: 'Portada', hero: 'Encabezado', gallery: 'Galería', logo: 'Logo' }

// Lo que guarda «Guardar». Quedan fuera las fotos (se guardan al subirlas),
// el historial y el estado de publicación.
function editableJson(form) {
  // eslint-disable-next-line no-unused-vars
  const { audit, updatedAt, images, published, publishedAt, ...rest } = form
  return JSON.stringify(rest)
}

// Elige una de las fotos ya subidas a la ficha para un plato o producto.
function PhotoSelect({ images, value, onChange }) {
  const selected = images.find((image) => image.mediaId === value)
  return (
    <div className="admin-photo-select">
      {selected ? <img src={selected.url} alt="" /> : <span aria-hidden="true" />}
      <select
        aria-label="Foto"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">Sin foto (usa la portada)</option>
        {images.map((image, index) => (
          <option key={image.imageId} value={image.mediaId}>
            {image.alt || `Foto ${index + 1}`} · {ROLE_LABELS[image.role] ?? image.role}
          </option>
        ))}
      </select>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function Section({ title, hint, actions, defaultOpen = false, signal, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  const [seen, setSeen] = useState(signal.n)
  if (seen !== signal.n) {
    setSeen(signal.n)
    setOpen(signal.open)
  }

  return (
    <section className={`admin-section ${open ? 'is-open' : 'is-closed'}`}>
      <div className="admin-section__bar">
        <h2>
          <button
            type="button"
            className="admin-section__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="admin-section__title">
              {title}
              {hint ? <small>{hint}</small> : null}
            </span>
            <span className="admin-section__chevron" aria-hidden="true" />
          </button>
        </h2>
        {actions}
      </div>
      <div
        id={bodyId}
        className="admin-section__body"
        hidden={!open}
        onInvalidCapture={() => setOpen(true)}
      >
        {children}
      </div>
    </section>
  )
}

// Tarjetas que caben en «También puedes disfrutar en Gramalote».
const RELATED_LIMIT = 3

export default function AdminEstablecimiento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInput = useRef(null)

  const [tab, setTab] = useState('info')
  const nearby = useNearbyCheck({
    onReview: () => {
      setTab('info')
      focusLatitude()
    },
  })
  const [relatedQuery, setRelatedQuery] = useState('')
  const [signal, setSignal] = useState({ open: false, n: 0 })
  const [form, setForm] = useState(null)
  // Copia de lo último guardado, para saber si hay cambios pendientes.
  const [savedJson, setSavedJson] = useState(null)
  const dirty = form !== null && savedJson !== null && editableJson(form) !== savedJson
  const imageDrafts = useImageDrafts()
  const { allowLeave } = useUnsavedChanges(dirty || imageDrafts.anyDirty)
  const [meta, setMeta] = useState(null)
  // Evita que un doble aviso del selector de archivos suba la misma foto dos veces.
  const uploadGuard = useRef(false)
  const [allEstablishments, setAllEstablishments] = useState([])
  const [loadError, setLoadError] = useState('')
  const { notify, toast, close } = useAdminToast()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyImage, setBusyImage] = useState(false)
  const { confirm } = useDialog()

  async function load() {
    setLoadError('')
    try {
      const [detail, metaData, list] = await Promise.all([
        apiRequest(`/admin/establishments/${id}`),
        apiRequest('/meta'),
        apiRequest('/admin/establishments'),
      ])
      setForm(detail)
      setSavedJson(editableJson(detail))
      setMeta(metaData)
      setAllEstablishments(list ?? [])
    } catch (err) {
      setLoadError(err.message)
    }
  }

  useEffect(() => {
    let alive = true
    ensureSession().then((session) => {
      if (!alive) return
      if (!session) {
        navigate('/acceder', { replace: true })
        return
      }
      load()
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const auditLookups = useMemo(() => {
    const categories = meta?.establishmentCategories ?? []
    return {
      category: (id) => categories.find((item) => item.id === Number(id))?.name,
      type: (id) => categories.flatMap((item) => item.types ?? []).find((item) => item.id === Number(id))?.name,
      zone: (id) => (meta?.zones ?? []).find((item) => item.id === Number(id))?.name,
    }
  }, [meta])
  const category = meta && form
    ? meta.establishmentCategories.find((item) => item.id === Number(form.categoryId))
    : null
  const types = useMemo(() => category?.types ?? [], [category])
  // Servicios y horario de entrada/salida son de alojamiento; los productos, de comer y comprar.
  const isDormir = category?.slug === 'dormir'
  // Dónde dormir muestra la galería en un collage de 5: no se admiten más.
  const galleryLimit = isDormir ? 5 : null
  const galleryCount = (form?.images ?? []).filter((image) => image.role === 'gallery').length
  const galleryFull = galleryLimit !== null && galleryCount >= galleryLimit
  // Icono que tendría la ficha en "Automático", según su categoría y tipo.
  const automaticIcon = resolveMapIcon({
    type: types.find((type) => type.id === form?.typeId)?.name,
    group: category?.slug,
  })

  if (!form) {
    return (
      <section className="admin-page">
        <div className="container">
          {loadError ? <p className="auth-error" role="alert">{loadError}</p> : <p className="note">Cargando ficha…</p>}
        </div>
      </section>
    )
  }

  const cover = form.images.find((image) => image.role === 'cover') ?? null

  // Fichas que se pueden sugerir en «También puedes visitar».
  const relatedQueryText = relatedQuery.trim().toLowerCase()
  const relatedCandidates = allEstablishments
    .filter((item) => item.id !== form.id)
    .filter((item) => item.published)
    // Solo de la misma categoría (Dónde comer, dormir o comprar).
    .filter((item) => !category || item.category?.slug === category.slug)
    .filter((item) => {
      if (!relatedQueryText) return true
      return (
        String(item.name ?? '').toLowerCase().includes(relatedQueryText) ||
        String(item.category?.name ?? '').toLowerCase().includes(relatedQueryText)
      )
    })

  function update(patch) {
    setForm((current) => ({ ...current, ...patch }))
    close()
  }

  // La ficha del sitio tiene sitio para tres tarjetas: no se pueden sugerir más.
  function toggleRelated(target) {
    if (!form.relatedIds.includes(target) && form.relatedIds.length >= RELATED_LIMIT) {
      notify('warn', 'Límite alcanzado', `Ya hay ${RELATED_LIMIT} sugerencias. Quita una para añadir otra.`)
      return
    }
    update({
      relatedIds: form.relatedIds.includes(target)
        ? form.relatedIds.filter((value) => value !== target)
        : [...form.relatedIds, target],
    })
  }

  function updateList(key, index, patch) {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    }))
    close()
  }

  function addToList(key, item) {
    setForm((current) => ({ ...current, [key]: [...(current[key] ?? []), item] }))
  }

  function removeFromList(key, index) {
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((_item, position) => position !== index),
    }))
  }

  // Trae de nuevo solo el historial (y la fecha de edición) para que el último
  // guardado aparezca al instante sin pisar lo que se esté editando.
  async function refreshAudit() {
    try {
      const detail = await apiRequest(`/admin/establishments/${id}`)
      setForm((current) => (current ? { ...current, audit: detail.audit ?? current.audit } : current))
    } catch {
      // Si falla, el historial se verá actualizado en la próxima carga.
    }
  }

  async function handleSave(event) {
    event?.preventDefault()
    const proceed = await nearby.check({ lat: form.latitude, lng: form.longitude, type: 'establishment', id: form.id })
    if (!proceed) return
    setSaving(true)
    close()
    close()
    try {
      const result = await apiRequest(`/admin/establishments/${id}`, {
        method: 'PATCH',
        body: { ...form, updatedAt: form.updatedAt },
      })
      setForm((current) => ({ ...current, updatedAt: result.updatedAt }))
      setSavedJson(editableJson(form))
      notify('ok', 'Cambios guardados', 'La ficha quedó actualizada.')
      await refreshAudit()
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(published) {
    close()
    close()
    try {
      // Con cambios sin guardar no se publica: se perderían (pagos, redes…).
      if (published && dirty) {
        notify('error', 'No se pudo publicar', 'Guarda los cambios antes de publicar la ficha.')
        return
      }
      const result = await apiRequest(`/admin/establishments/${id}/publish`, {
        method: 'POST',
        body: { published },
      })
      setForm((current) => ({
        ...current,
        published,
        publishedAt: current.publishedAt ?? result.updatedAt,
        updatedAt: result.updatedAt,
      }))
      notify('ok', 'Guardado', published ? 'Ficha publicada.' : 'Ficha despublicada.')
      await refreshAudit()
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: `¿Borrar «${form.name}»?`,
      message: 'Deja de verse en el sitio y en el mapa.',
      confirmLabel: 'Borrar',
      danger: true,
    })
    if (!ok) return
    close()
    close()
    try {
      await apiRequest(`/admin/establishments/${id}`, { method: 'DELETE' })
      allowLeave()
      navigate('/admin/lugares/establecimientos', { replace: true })
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    }
  }

  async function handleUpload(event) {
    const files = [...(event.target.files ?? [])]
    if (files.length === 0 || uploadGuard.current) return
    uploadGuard.current = true

    setUploading(true)
    close()
    try {
      // La primera foto de una ficha sin imágenes entra como portada; el resto,
      // como galería (si ya hay portada, todas van a la galería).
      const needsCover = !form.images.some((image) => image.role === 'cover')
      // Con la galería llena (Dónde dormir), las fotos que sobran entran como
      // encabezado; el editor decide luego qué hacer con ellas.
      let galleryRoom = galleryLimit ? Math.max(galleryLimit - galleryCount, 0) : Infinity
      let toHero = 0
      for (const [index, file] of files.entries()) {
        let role = 'gallery'
        if (needsCover && index === 0) role = 'cover'
        else if (galleryRoom > 0) galleryRoom -= 1
        else {
          role = 'hero'
          toHero += 1
        }
        const data = new FormData()
        data.append('file', file)
        data.append('establishmentId', id)
        data.append('role', role)
        await apiRequest('/admin/media', { method: 'POST', formData: data })
      }
      await reloadImages()
      notify(
        'ok',
        'Guardado',
        toHero > 0
          ? `Imágenes subidas. La galería ya tenía ${galleryLimit} fotos: ${toHero === 1 ? 'la nueva quedó' : `${toHero} quedaron`} como encabezado.`
          : 'Imágenes subidas.',
      )
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      uploadGuard.current = false
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  // Refresca solo las imágenes para no descartar cambios de texto sin guardar.
  async function reloadImages() {
    const detail = await apiRequest(`/admin/establishments/${id}`)
    setForm((current) => ({ ...current, images: detail.images, audit: detail.audit ?? current.audit, updatedAt: detail.updatedAt }))
  }

  async function patchImage(image, patch) {
    setBusyImage(true)
    close()
    try {
      await apiRequest(`/admin/establishments/${id}/images/${image.imageId}`, {
        method: 'PATCH',
        body: patch,
      })
      await reloadImages()
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function updateMediaAlt(image, altText) {
    try {
      await apiRequest(`/admin/media/${image.mediaId}`, {
        method: 'PATCH',
        body: { altText },
      })
      setForm((current) => ({
        ...current,
        images: current.images.map((item) => (item.mediaId === image.mediaId ? { ...item, alt: altText } : item)),
      }))
      notify('ok', 'Guardado', 'Foto actualizada.')
      return true
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
      return false
    }
  }

  async function moveImage(index, direction) {
    const target = index + direction
    if (target < 0 || target >= form.images.length) return
    const reordered = [...form.images]
    const [item] = reordered.splice(index, 1)
    reordered.splice(target, 0, item)

    setBusyImage(true)
    close()
    try {
      await apiRequest(`/admin/establishments/${id}/images/order`, {
        method: 'PUT',
        body: {
          items: reordered.map((image, position) => ({
            imageId: image.imageId,
            sortOrder: (position + 1) * 10,
          })),
        },
      })
      await reloadImages()
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusyImage(false)
    }
  }

  // Cambia el archivo de una foto y conserva su uso, orden y texto alternativo.
  async function replaceImage(image, file) {
    setBusyImage(true)
    close()
    try {
      const data = new FormData()
      data.append('file', file)
      await apiRequest(`/admin/establishments/${id}/images/${image.imageId}/file`, { method: 'PUT', formData: data })
      await reloadImages()
      notify('ok', 'Guardado', 'Foto cambiada.')
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function unlinkImage(image) {
    setBusyImage(true)
    close()
    try {
      await apiRequest(`/admin/establishments/${id}/images/${image.imageId}`, {
        method: 'DELETE',
      })
      await reloadImages()
      notify('ok', 'Guardado', 'Imagen quitada de la ficha. Sigue en la biblioteca de medios.')
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusyImage(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-head2">
          <Link className="admin-back" to="/admin/lugares/establecimientos">
            ← Establecimientos
          </Link>
          <div className="admin-head2__cover">
            {cover ? <img src={cover.url} alt={cover.alt} /> : <span aria-hidden="true" />}
          </div>
          <div className="admin-head2__body">
            <h1>{form.name}</h1>
            <p>
              <span
                className={`admin-badge ${form.published ? 'admin-badge--ok' : 'admin-badge--draft'}`}
              >
                {form.published ? 'Publicada' : 'No publicada'}
              </span>
              {form.featured ? <span className="admin-badge">★ Destacada</span> : null}
              <small>
                {form.categoryName}
                {form.zoneName ? ` · ${form.zoneName}` : ''}
              </small>
            </p>
          </div>
          <div className="admin-head2__actions">
            <Link
              className="admin-btn"
              to={`/establecimiento/${form.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver ficha ↗
            </Link>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
            </button>
          </div>
        </div>

        {nearby.element}

        {toast}

        <nav className="admin-tabs" aria-label="Secciones de la ficha">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={tab === item.key ? 'true' : undefined}
              className={`admin-tab ${tab === item.key ? 'is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
              {item.key === 'images' ? (
                <span className="admin-tab__count">{form.images.length}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <form onSubmit={handleSave} className="admin-panel">
          {tab === 'info' || tab === 'extras' ? (
            <div className="admin-panel__tools">
              <button
                type="button"
                className="admin-tool-btn"
                onClick={() => setSignal((prev) => ({ open: true, n: prev.n + 1 }))}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 3.5 4 4 4-4M4 8.5l4 4 4-4" />
                </svg>
                Expandir todo
              </button>
              <button
                type="button"
                className="admin-tool-btn"
                onClick={() => setSignal((prev) => ({ open: false, n: prev.n + 1 }))}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 7.5 4-4 4 4M4 12.5l4-4 4 4" />
                </svg>
                Contraer todo
              </button>
            </div>
          ) : null}

          {tab === 'info' ? (
            <>
              <Section title="Identidad" hint="Cómo se llama y dónde aparece la ficha en el sitio." signal={signal}>
              <div className="admin-grid">
                <Field label="Nombre">
                  <input
                    value={form.name}
                    onChange={(event) => update({ name: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Slug (URL)" hint={`/establecimiento/${form.slug}`}>
                  <input
                    value={form.slug}
                    onChange={(event) => update({ slug: event.target.value })}
                  />
                </Field>
                <Field label="Categoría">
                  <select
                    value={form.categoryId}
                    onChange={(event) =>
                      update({ categoryId: Number(event.target.value), typeId: null })
                    }
                  >
                    {(meta?.establishmentCategories ?? []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select
                    value={form.typeId ?? ''}
                    onChange={(event) =>
                      update({
                        typeId: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">Sin tipo</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Zona">
                  <select
                    value={form.zoneId ?? ''}
                    onChange={(event) =>
                      update({
                        zoneId: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">Sin zona</option>
                    {(meta?.zones ?? []).map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              </Section>

              <Section title="Descripción" hint="El resumen sale en tarjetas y listados; la descripción, en la ficha." signal={signal}>
              <Field label="Resumen" hint={`${form.summary.length}/320 caracteres`}>
                <textarea
                  rows={2}
                  maxLength={320}
                  value={form.summary}
                  onChange={(event) => update({ summary: event.target.value })}
                  required
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  rows={6}
                  value={form.description}
                  onChange={(event) => update({ description: event.target.value })}
                  required
                />
              </Field>
              </Section>

              <Section title="Ubicación" hint="Se usa para el mapa; las coordenadas con decimales (ej. 5.1234567)." signal={signal}>
              <div className="admin-grid">
                <Field label="Dirección">
                  <input
                    value={form.address ?? ''}
                    onChange={(event) => update({ address: event.target.value })}
                  />
                </Field>
                <Field label="Enlace de Google Maps (opcional)" hint="Si lo dejas vacío, el botón usa las coordenadas.">
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/… o https://www.google.com/maps/place/…"
                    value={form.mapsUrl ?? ''}
                    onChange={(event) => update({ mapsUrl: event.target.value })}
                  />
                </Field>
                <Field label="Latitud">
                  <CoordinateInput
                    data-field="latitude"
                    kind="lat"
                    onPair={(latitude, longitude) => update({ latitude, longitude })}
                    value={form.latitude}
                    onChange={(value) => update({ latitude: value === '' ? null : value })}
                  />
                </Field>
                <Field label="Longitud">
                  <CoordinateInput
                    kind="lng"
                    onPair={(latitude, longitude) => update({ latitude, longitude })}
                    value={form.longitude}
                    onChange={(value) => update({ longitude: value === '' ? null : value })}
                  />
                </Field>
              </div>
              <MapIconPicker
                value={form.mapIcon}
                automatic={automaticIcon}
                onChange={(mapIcon) => update({ mapIcon })}
              />
              </Section>

              <Section title="Contacto" hint="Cómo pueden comunicarse los visitantes." signal={signal}>
              <div className="admin-grid">
                <Field label="Teléfono">
                  <input
                    value={form.phone ?? ''}
                    onChange={(event) => update({ phone: event.target.value })}
                  />
                </Field>
                <Field label="WhatsApp">
                  <input
                    value={form.whatsapp ?? ''}
                    onChange={(event) => update({ whatsapp: event.target.value })}
                  />
                </Field>
                <Field label="Correo">
                  <input
                    type="email"
                    value={form.email ?? ''}
                    onChange={(event) => update({ email: event.target.value })}
                  />
                </Field>
              </div>
              <p className="admin-hint">El sitio web y las redes se agregan en «Redes sociales».</p>
              </Section>

              <Section
                title="Horario y pagos"
                hint="Elige cómo se ve el horario en la ficha y el rango de precios."
                signal={signal}
              >
                <h3 className="admin-hours__subtitle">Horario</h3>
                <div className="admin-segment" role="group" aria-label="Cómo se ve el horario">
                  {[
                    { key: 'text', label: 'Texto' },
                    { key: 'table', label: 'Cuadro por días' },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      aria-pressed={(form.hoursDisplay ?? 'text') === mode.key}
                      className={`admin-tab${(form.hoursDisplay ?? 'text') === mode.key ? ' is-active' : ''}`}
                      onClick={() => update({ hoursDisplay: mode.key })}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                {(form.hoursDisplay ?? 'text') === 'table' ? (
                  <OpeningHoursEditor
                    hours={form.openingHours ?? []}
                    exceptions={form.openingHoursExceptions ?? []}
                    onChange={(openingHours) => update({ openingHours })}
                    onExceptionsChange={(openingHoursExceptions) => update({ openingHoursExceptions })}
                  />
                ) : (
                  <div className="admin-grid">
                    <Field label="Horario" hint="Se lee tal cual en la franja de datos de la ficha.">
                      <input
                        value={form.hoursText ?? ''}
                        onChange={(event) => update({ hoursText: event.target.value })}
                        placeholder="Lunes a domingo, 8:00 a. m. – 6:00 p. m."
                      />
                    </Field>
                  </div>
                )}

                {isDormir ? (
                  <div className="admin-grid">
                    <Field label="Horario de entrada y salida" hint="Se muestra junto al horario en la ficha.">
                      <input
                        value={form.checkinText ?? ''}
                        onChange={(event) => update({ checkinText: event.target.value })}
                      />
                    </Field>
                  </div>
                ) : null}

                <h3 className="admin-hours__subtitle admin-hours__subtitle--fields">Precios</h3>
                <div className="admin-grid">
                  <Field label="Precios" hint="Se lee tal cual en la ficha, p. ej. $15.000 – $40.000 o Desde $30.000 por persona.">
                    <input
                      value={form.priceText ?? ''}
                      onChange={(event) => update({ priceText: event.target.value })}
                    />
                  </Field>
                </div>
              </Section>
            </>
          ) : null}

          {tab === 'images' ? (
            <div className="admin-media">
              <div className="admin-media__head">
                <div>
                  <h2>Imágenes de la ficha</h2>
                  <p className="note">
                    Portada: tarjetas y listados. Encabezado: foto ancha de la ficha (si falta,
                    se usa la portada). Se convierten a WebP al subir.
                  </p>
                  {galleryLimit ? (
                    <p className="note">
                      Galería: {galleryCount} de {galleryLimit} fotos
                      {galleryFull ? '. Las fotos nuevas entran como encabezado.' : '.'}
                    </p>
                  ) : null}
                </div>
                <div>
                  <input
                    ref={fileInput}
                    id="admin-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={handleUpload}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--accent"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? 'Subiendo…' : '+ Subir imágenes'}
                  </button>
                </div>
              </div>

              {form.images.length === 0 ? (
                <p className="empty">Todavía no hay imágenes. Sube la primera como portada.</p>
              ) : (
                <ul className="admin-media__grid">
                  {form.images.map((image, index) => (
                    <AdminImageCard
                      key={image.imageId}
                      image={image}
                      index={index}
                      total={form.images.length}
                      roles={Object.keys(ROLE_LABELS).filter(
                        (role) => role === image.role || (role !== 'logo' && !(image.role === 'cover' && role === 'gallery')),
                      )}
                      roleLabels={ROLE_LABELS}
                      isRoleDisabled={(role, img) => role === 'gallery' && img.role !== 'gallery' && galleryFull}
                      badgeOk={image.role === 'cover' || image.role === 'hero'}
                      busy={busyImage}
                      draftKey={image.imageId}
                      onDraftChange={imageDrafts.report}
                      onSave={(img, draft) => updateMediaAlt(img, draft.alt)}
                      onRole={(img, role) => patchImage(img, { role })}
                      onMove={moveImage}
                      onReplace={replaceImage}
                      onRemove={unlinkImage}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'extras' ? (
            <div className="admin-extras">
              {isDormir ? (
              <Section
                title="Servicios"
                hint={`${form.serviceIds.length} de ${meta?.services?.length ?? 0} seleccionados`}
                signal={signal}
                actions={
                  form.serviceIds.length ? (
                    <button
                      type="button"
                      className="admin-link-btn"
                      onClick={() => update({ serviceIds: [] })}
                    >
                      Quitar todos
                    </button>
                  ) : null
                }
              >
                <div className="admin-checks">
                  {(meta?.services ?? []).map((service) => (
                    <label key={service.id} className="admin-check">
                      <input
                        type="checkbox"
                        checked={form.serviceIds.includes(service.id)}
                        onChange={(event) =>
                          update({
                            serviceIds: event.target.checked
                              ? [...form.serviceIds, service.id]
                              : form.serviceIds.filter((value) => value !== service.id),
                          })
                        }
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
              </Section>
              ) : null}

              <Section
                title="Formas de pago"
                hint={`${form.paymentIds.length} de ${meta?.paymentMethods?.length ?? 0} seleccionadas`}
                signal={signal}
              >
                <div className="admin-checks">
                  {(meta?.paymentMethods ?? []).map((payment) => (
                    <label key={payment.id} className="admin-check">
                      <input
                        type="checkbox"
                        checked={form.paymentIds.includes(payment.id)}
                        onChange={(event) =>
                          update({
                            paymentIds: event.target.checked
                              ? [...form.paymentIds, payment.id]
                              : form.paymentIds.filter((value) => value !== payment.id),
                          })
                        }
                      />
                      {payment.name}
                    </label>
                  ))}
                </div>
              </Section>

              {!isDormir ? (
              <Section
                title="Productos"
                hint={`${form.products.length} ${form.products.length === 1 ? 'producto' : 'productos'}`}
                signal={signal}
                actions={
                  <button
                    type="button"
                    className="admin-btn admin-btn--accent-outline"
                    onClick={() =>
                      addToList('products', {
                        name: '',
                        description: '',
                        price: '',
                        sortOrder: (form.products.length + 1) * 10,
                      })
                    }
                  >
                    + Añadir producto
                  </button>
                }
              >
                {form.products.length === 0 ? (
                  <p className="admin-extras-empty">Sin productos todavía.</p>
                ) : null}
                <div className="admin-extras-cards">
                  {form.products.map((product, index) => (
                    <article key={index} className="admin-extras-card">
                      <header className="admin-extras-card__head">
                        <span className="admin-extras-card__index">{index + 1}</span>
                        <strong>{product.name || 'Producto sin nombre'}</strong>
                        <button
                          type="button"
                          className="admin-extras-card__remove"
                          onClick={() => removeFromList('products', index)}
                        >
                          Quitar
                        </button>
                      </header>
                      <Field label="Nombre">
                        <input
                          placeholder="P. ej. Sancocho"
                          value={product.name}
                          onChange={(event) =>
                            updateList('products', index, { name: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Precio (COP)">
                        <input
                          type="number"
                          placeholder="25000"
                          value={product.price ?? ''}
                          onChange={(event) =>
                            updateList('products', index, { price: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Descripción">
                        <textarea
                          rows={2}
                          placeholder="Qué incluye"
                          value={product.description ?? ''}
                          onChange={(event) =>
                            updateList('products', index, { description: event.target.value })
                          }
                        />
                      </Field>
                      <Field label="Foto">
                        <PhotoSelect
                          images={form.images}
                          value={product.mediaId}
                          onChange={(mediaId) => updateList('products', index, { mediaId })}
                        />
                      </Field>
                    </article>
                  ))}
                </div>
              </Section>
              ) : null}

              <Section
                title="Redes sociales"
                hint="Botones de contacto que salen en la cabecera de la ficha."
                signal={signal}
                actions={
                  <button
                    type="button"
                    className="admin-btn admin-btn--accent-outline"
                    onClick={() => addToList('social', { platform: 'instagram', url: '' })}
                  >
                    + Añadir red
                  </button>
                }
              >
                {form.social.length === 0 ? (
                  <p className="admin-extras-empty">Sin redes ni sitio web.</p>
                ) : null}
                <div className="admin-extras-links">
                  {form.social.map((link, index) => (
                    <div key={index} className="admin-extras-link">
                      <select
                        aria-label={`Red ${index + 1}`}
                        value={link.platform}
                        onChange={(event) =>
                          updateList('social', index, { platform: event.target.value })
                        }
                      >
                        {PLATFORMS.map((platform) => (
                          <option key={platform.key} value={platform.key}>
                            {platform.label}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="https://"
                        aria-label={`Enlace de ${link.platform}`}
                        value={link.url}
                        onChange={(event) =>
                          updateList('social', index, { url: event.target.value })
                        }
                      />
                      {link.url ? (
                        <a
                          className="admin-extras-link__open"
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir ↗
                        </a>
                      ) : null}
                      <button type="button" onClick={() => removeFromList('social', index)}>
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </Section>

              <Section
                title="También puedes visitar"
                hint={`${form.relatedIds.length} de ${RELATED_LIMIT} sugerencias; salen al final de la ficha y solo se ofrecen fichas publicadas.`}
                signal={signal}
              >
                {form.relatedIds.length ? (
                  <ul className="admin-extras-chips">
                    {form.relatedIds.map((relatedId) => {
                      const item = allEstablishments.find((entry) => entry.id === relatedId)
                      const label = item
                        ? `${item.name}${item.published ? '' : ' · borrador'}`
                        : `Ficha ${relatedId}`
                      return (
                        <li key={relatedId}>
                          <span>{label}</span>
                          <button
                            type="button"
                            aria-label={`Quitar ${label}`}
                            onClick={() =>
                              update({
                                relatedIds: form.relatedIds.filter((value) => value !== relatedId),
                              })
                            }
                          >
                            ×
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="admin-extras-empty">Todavía no hay sugerencias.</p>
                )}

                <input
                  type="search"
                  className="admin-extras-search"
                  placeholder="Buscar ficha por nombre o categoría…"
                  aria-label="Buscar ficha para sugerir"
                  value={relatedQuery}
                  onChange={(event) => setRelatedQuery(event.target.value)}
                />

                {relatedCandidates.length === 0 ? (
                  <p className="admin-extras-empty">Ninguna ficha coincide con la búsqueda.</p>
                ) : (
                  <div className="admin-extras-picks">
                    {relatedCandidates.map((item) => (
                      <label
                        key={item.id}
                        className={`admin-extras-pick${form.relatedIds.includes(item.id) ? ' is-on' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={form.relatedIds.includes(item.id)}
                          disabled={
                            !form.relatedIds.includes(item.id) &&
                            form.relatedIds.length >= RELATED_LIMIT
                          }
                          onChange={() => toggleRelated(item.id)}
                        />
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {item.category?.name ?? ''}
                            {item.zone?.name ? ` · ${item.zone.name}` : ''}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          ) : null}

          {tab === 'publish' ? (
            <div className="admin-publish">
              <h2>Estado de la ficha</h2>
              <p>
                {form.published
                  ? 'La ficha es visible en el sitio público.'
                  : 'La ficha no está publicada y no aparece en el sitio.'}
              </p>
              {!form.published && dirty ? (
                <p id="publish-unsaved" className="auth-error" role="status">
                  Tienes cambios sin guardar. Pulsa «Guardar cambios» antes de publicar.
                </p>
              ) : null}
              <div className="admin-publish__actions">
                <button
                  type="button"
                  className={`admin-btn ${form.published ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                  onClick={() => handlePublish(!form.published)}
                  disabled={!form.published && dirty}
                  aria-describedby={!form.published && dirty ? 'publish-unsaved' : undefined}
                >
                  {form.published ? 'Despublicar' : 'Publicar ficha'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger-outline"
                  onClick={handleDelete}
                  disabled={form.published}
                  title={form.published ? 'Despublica la ficha para poder borrarla' : undefined}
                >
                  Borrar
                </button>
              </div>
              {form.published ? (
                <p className="note">Para borrar la ficha, primero despublica.</p>
              ) : null}
              <div className={`note${cover?.alt?.trim() ? '' : ' note--warn'}`} role="status">
                {!cover ? (
                  <p>
                    Para publicar falta la <strong>portada</strong>: sube una imagen y márcala como «Portada» en la
                    pestaña Imágenes.
                  </p>
                ) : !cover.alt?.trim() ? (
                  <p>
                    La portada no tiene <strong>texto alternativo</strong>: escríbelo bajo la imagen, en la pestaña
                    Imágenes, y sal del campo para guardarlo.
                  </p>
                ) : (
                  <p>Portada con texto alternativo: lista para publicar.</p>
                )}
                {!cover || !cover.alt?.trim() ? (
                  <button type="button" className="admin-btn" onClick={() => setTab('images')}>
                    Ir a Imágenes
                  </button>
                ) : null}
              </div>

              <h2>Destacar</h2>
              <label className="admin-check admin-check--card">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => update({ featured: event.target.checked })}
                />
                <span>
                  <strong>Destacada en el inicio</strong>
                  <small>Aparece primero en los listados. Guarda para aplicar el cambio.</small>
                </span>
              </label>

            </div>
          ) : null}

          {tab === 'ratings' ? (
            <RatingsPanel
              kind="establishments"
              id={id}
              name={form.name}
              onNotify={(tone, title, message) => notify(tone, title, message)}
            />
          ) : null}

          {tab === 'history' ? (
            <div className="admin-publish">
              <h2>Historial</h2>
              <p className="note">Quién cambió qué en esta ficha y cuándo. </p>
              {form.audit.length === 0 ? (
                <p className="note">Sin cambios registrados todavía.</p>
              ) : (
                <AuditTimeline audit={form.audit} lookups={auditLookups} />
              )}
            </div>
          ) : null}
        </form>
      </div>
    </section>
  )
}
