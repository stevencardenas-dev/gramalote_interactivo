import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import OpeningHoursEditor from '../components/admin/OpeningHoursEditor.jsx'
import MapIconPicker from '../components/admin/MapIconPicker.jsx'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'
import { resolveMapIcon } from '../data/mapIcons.js'

const TABS = [
  { key: 'info', label: 'Información' },
  { key: 'images', label: 'Imágenes' },
  { key: 'extras', label: 'Servicios y extras' },
  { key: 'publish', label: 'Publicación' },
  { key: 'history', label: 'Historial' },
]

const AUDIT_PAGE = 8

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value ?? ''
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const PLATFORMS = ['facebook', 'instagram', 'whatsapp', 'tiktok', 'youtube', 'x', 'website']
const ROLE_LABELS = { cover: 'Portada', hero: 'Encabezado', gallery: 'Galería', logo: 'Logo' }

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

export default function AdminEstablecimiento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getUser()
  const fileInput = useRef(null)

  const [tab, setTab] = useState('info')
  const [signal, setSignal] = useState({ open: false, n: 0 })
  const [auditPage, setAuditPage] = useState(0)
  const [form, setForm] = useState(null)
  const [meta, setMeta] = useState(null)
  const [allEstablishments, setAllEstablishments] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busyImage, setBusyImage] = useState(false)

  async function load() {
    setError('')
    try {
      const [detail, metaData, list] = await Promise.all([
        apiRequest(`/admin/establishments/${id}`),
        apiRequest('/meta'),
        apiRequest('/admin/establishments'),
      ])
      setForm(detail)
      setMeta(metaData)
      setAllEstablishments(list ?? [])
    } catch (err) {
      setError(err.message)
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

  const category = meta && form
    ? meta.establishmentCategories.find((item) => item.id === Number(form.categoryId))
    : null
  const types = useMemo(() => category?.types ?? [], [category])
  // Icono que tendría la ficha en "Automático", según su categoría y tipo.
  const automaticIcon = resolveMapIcon({
    type: types.find((type) => type.id === form?.typeId)?.name,
    group: category?.slug,
  })

  if (!form) {
    return (
      <section className="admin-page">
        <div className="container">
          {error ? <p className="auth-error">{error}</p> : <p className="note">Cargando ficha…</p>}
        </div>
      </section>
    )
  }

  const cover = form.images.find((image) => image.role === 'cover') ?? null

  function update(patch) {
    setForm((current) => ({ ...current, ...patch }))
    setNotice('')
  }

  function updateList(key, index, patch) {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    }))
    setNotice('')
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

  async function handleSave(event) {
    event?.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const result = await apiRequest(`/admin/establishments/${id}`, {
        method: 'PATCH',
        body: { ...form, updatedAt: form.updatedAt },
      })
      setForm((current) => ({ ...current, updatedAt: result.updatedAt }))
      setNotice('Cambios guardados.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(published) {
    setError('')
    setNotice('')
    try {
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
      setNotice(published ? 'Ficha publicada.' : 'Ficha despublicada.')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`¿Borrar «${form.name}»? Deja de verse en el sitio y en el mapa.`)) return
    setError('')
    setNotice('')
    try {
      await apiRequest(`/admin/establishments/${id}`, { method: 'DELETE' })
      navigate('/admin/establecimientos', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpload(event) {
    const files = [...(event.target.files ?? [])]
    if (files.length === 0) return

    setUploading(true)
    setError('')
    try {
      // La primera foto de una ficha sin imágenes entra como portada; el resto,
      // como galería (si ya hay portada, todas van a la galería).
      const needsCover = !form.images.some((image) => image.role === 'cover')
      for (const [index, file] of files.entries()) {
        const data = new FormData()
        data.append('file', file)
        data.append('establishmentId', id)
        data.append('role', needsCover && index === 0 ? 'cover' : 'gallery')
        await apiRequest('/admin/media', { method: 'POST', formData: data })
      }
      await reloadImages()
      setNotice('Imágenes subidas.')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  // Refresca solo las imágenes para no descartar cambios de texto sin guardar.
  async function reloadImages() {
    const detail = await apiRequest(`/admin/establishments/${id}`)
    setForm((current) => ({ ...current, images: detail.images, updatedAt: detail.updatedAt }))
  }

  async function patchImage(image, patch) {
    setBusyImage(true)
    setError('')
    try {
      await apiRequest(`/admin/establishments/${id}/images/${image.imageId}`, {
        method: 'PATCH',
        body: patch,
      })
      await reloadImages()
    } catch (err) {
      setError(err.message)
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
    } catch (err) {
      setError(err.message)
    }
  }

  async function moveImage(index, direction) {
    const target = index + direction
    if (target < 0 || target >= form.images.length) return
    const reordered = [...form.images]
    const [item] = reordered.splice(index, 1)
    reordered.splice(target, 0, item)

    setBusyImage(true)
    setError('')
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
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function unlinkImage(image) {
    setBusyImage(true)
    setError('')
    try {
      await apiRequest(`/admin/establishments/${id}/images/${image.imageId}`, {
        method: 'DELETE',
      })
      await reloadImages()
      setNotice('Imagen quitada de la ficha. Sigue en la biblioteca de medios.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-head2">
          <Link className="admin-back" to="/admin/establecimientos">
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
                {form.zoneName ? ` · ${form.zoneName}` : ''} · {form.images.length}{' '}
                {form.images.length === 1 ? 'imagen' : 'imágenes'}
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
              className={`admin-btn ${form.published ? 'admin-btn--danger' : 'admin-btn--accent'}`}
              onClick={() => handlePublish(!form.published)}
              disabled={!form.published && user?.role !== 'admin'}
            >
              {form.published ? 'Despublicar' : 'Publicar'}
            </button>
            {user?.role === 'admin' ? (
              <button
                type="button"
                className="admin-btn admin-btn--danger-outline"
                onClick={handleDelete}
              >
                Borrar
              </button>
            ) : null}
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
        {notice ? <p className="admin-notice">{notice}</p> : null}

        <nav className="admin-tabs" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
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
                <Field label="Detalle de ubicación">
                  <input
                    value={form.locationDetail ?? ''}
                    onChange={(event) => update({ locationDetail: event.target.value })}
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
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.latitude ?? ''}
                    onChange={(event) =>
                      update({ latitude: event.target.value === '' ? null : event.target.value })
                    }
                  />
                </Field>
                <Field label="Longitud">
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.longitude ?? ''}
                    onChange={(event) =>
                      update({ longitude: event.target.value === '' ? null : event.target.value })
                    }
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
                <Field label="Teléfono secundario">
                  <input
                    value={form.phoneSecondary ?? ''}
                    onChange={(event) => update({ phoneSecondary: event.target.value })}
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

              <Section title="Horarios y precios" hint="Textos libres para la ficha y rangos numéricos para ordenar y filtrar." signal={signal}>
              <div className="admin-grid">
                <Field label="Horario (texto de la ficha)">
                  <input
                    value={form.hoursText ?? ''}
                    onChange={(event) => update({ hoursText: event.target.value })}
                  />
                </Field>
                <Field label="Check-in / check-out">
                  <input
                    value={form.checkinText ?? ''}
                    onChange={(event) => update({ checkinText: event.target.value })}
                  />
                </Field>
                <Field label="Rango de precio (texto)">
                  <input
                    value={form.priceText ?? ''}
                    onChange={(event) => update({ priceText: event.target.value })}
                  />
                </Field>
                <Field label="Precio mínimo (COP)">
                  <input
                    type="number"
                    value={form.priceMin ?? ''}
                    onChange={(event) =>
                      update({ priceMin: event.target.value === '' ? null : event.target.value })
                    }
                  />
                </Field>
                <Field label="Precio máximo (COP)">
                  <input
                    type="number"
                    value={form.priceMax ?? ''}
                    onChange={(event) =>
                      update({ priceMax: event.target.value === '' ? null : event.target.value })
                    }
                  />
                </Field>
                <Field label="Orden en el listado">
                  <input
                    type="number"
                    value={form.sortOrder ?? 0}
                    onChange={(event) => update({ sortOrder: Number(event.target.value) })}
                  />
                </Field>
              </div>
              </Section>

              <Section
                title="Horario por día"
                hint="Calcula “Abierto hoy”; el texto de arriba es el que se lee en la ficha."
                signal={signal}
              >
                <OpeningHoursEditor
                  hours={form.openingHours ?? []}
                  exceptions={form.openingHoursExceptions ?? []}
                  onChange={(openingHours) => update({ openingHours })}
                  onExceptionsChange={(openingHoursExceptions) => update({ openingHoursExceptions })}
                  onUseText={(hoursText) => update({ hoursText })}
                />
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
                  {form.images.map((image, index) => {
                    const roles = Object.keys(ROLE_LABELS).filter(
                      (role) => role === image.role || (role !== 'logo' && !(image.role === 'cover' && role === 'gallery')),
                    )
                    return (
                      <li key={image.imageId} className="admin-media__item">
                        <div className="admin-media__shot">
                          <img src={image.url} alt={image.alt} loading="lazy" />
                          <span
                            className={`admin-badge ${
                              image.role === 'cover' || image.role === 'hero' ? 'admin-badge--ok' : ''
                            }`}
                          >
                            {ROLE_LABELS[image.role] ?? image.role}
                          </span>
                          <span className="admin-media__dims">
                            {image.width}×{image.height}
                          </span>
                        </div>
                        <input
                          className="admin-media__alt"
                          aria-label="Texto alternativo"
                          defaultValue={image.alt}
                          placeholder="Texto alternativo (accesibilidad)"
                          onBlur={(event) => {
                            if (event.target.value !== image.alt) {
                              updateMediaAlt(image, event.target.value)
                            }
                          }}
                        />
                        <div className="admin-media__actions">
                          <select
                            aria-label="Uso de la imagen"
                            value={image.role}
                            disabled={busyImage}
                            onChange={(event) => patchImage(image, { role: event.target.value })}
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            aria-label="Mover antes"
                            disabled={busyImage || index === 0}
                            onClick={() => moveImage(index, -1)}
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            aria-label="Mover después"
                            disabled={busyImage || index === form.images.length - 1}
                            onClick={() => moveImage(index, 1)}
                          >
                            →
                          </button>
                          <button
                            type="button"
                            className="is-danger"
                            aria-label="Quitar de la ficha"
                            disabled={busyImage}
                            onClick={() => unlinkImage(image)}
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'extras' ? (
            <div className="admin-extras">
              <Section title="Servicios" signal={signal}>
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

              <Section title="Formas de pago" signal={signal}>
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

              <Section title="Platos y servicios destacados" signal={signal}
                actions={
                  <button
                    type="button"
                    className="admin-btn admin-btn--accent-outline"
                    onClick={() =>
                      addToList('features', {
                        title: '',
                        description: '',
                        icon: '',
                        sortOrder: (form.features.length + 1) * 10,
                      })
                    }
                  >
                    + Añadir tarjeta
                  </button>
                }>
                {form.features.map((feature, index) => (
                  <div key={index} className="admin-row">
                    <input
                      placeholder="Título"
                      value={feature.title}
                      onChange={(event) =>
                        updateList('features', index, { title: event.target.value })
                      }
                    />
                    <input
                      placeholder="Descripción"
                      value={feature.description ?? ''}
                      onChange={(event) =>
                        updateList('features', index, { description: event.target.value })
                      }
                    />
                    <PhotoSelect
                      images={form.images}
                      value={feature.mediaId}
                      onChange={(mediaId) => updateList('features', index, { mediaId })}
                    />
                    <button type="button" onClick={() => removeFromList('features', index)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </Section>

              <Section title="Productos" signal={signal}
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
                }>
                {form.products.map((product, index) => (
                  <div key={index} className="admin-row admin-row--product">
                    <input
                      placeholder="Nombre"
                      value={product.name}
                      onChange={(event) =>
                        updateList('products', index, { name: event.target.value })
                      }
                    />
                    <input
                      placeholder="Precio COP"
                      type="number"
                      value={product.price ?? ''}
                      onChange={(event) =>
                        updateList('products', index, { price: event.target.value })
                      }
                    />
                    <input
                      placeholder="Descripción"
                      value={product.description ?? ''}
                      onChange={(event) =>
                        updateList('products', index, { description: event.target.value })
                      }
                    />
                    <PhotoSelect
                      images={form.images}
                      value={product.mediaId}
                      onChange={(mediaId) => updateList('products', index, { mediaId })}
                    />
                    <button type="button" onClick={() => removeFromList('products', index)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </Section>

              <Section title="Redes sociales" signal={signal}
                actions={
                  <button
                    type="button"
                    className="admin-btn admin-btn--accent-outline"
                    onClick={() => addToList('social', { platform: 'instagram', url: '' })}
                  >
                    + Añadir red
                  </button>
                }>
                {form.social.map((link, index) => (
                  <div key={index} className="admin-row">
                    <select
                      value={link.platform}
                      onChange={(event) =>
                        updateList('social', index, { platform: event.target.value })
                      }
                    >
                      {PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="https://"
                      value={link.url}
                      onChange={(event) =>
                        updateList('social', index, { url: event.target.value })
                      }
                    />
                    <button type="button" onClick={() => removeFromList('social', index)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </Section>

              <Section title="También puedes visitar" signal={signal}>
                <select
                  multiple
                  className="admin-multiselect"
                  value={form.relatedIds.map(String)}
                  onChange={(event) =>
                    update({
                      relatedIds: [...event.target.selectedOptions].map((option) =>
                        Number(option.value),
                      ),
                    })
                  }
                >
                  {allEstablishments
                    .filter((item) => item.id !== form.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
                <p className="note">Ctrl/Cmd + clic para elegir varias.</p>
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
              <div className="admin-publish__actions">
                <button
                  type="button"
                  className={`admin-btn ${form.published ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                  onClick={() => handlePublish(!form.published)}
                  disabled={!form.published && user?.role !== 'admin'}
                >
                  {form.published ? 'Despublicar' : 'Publicar ficha'}
                </button>
                {user?.role !== 'admin' ? (
                  <span className="note">Solo un administrador puede publicar.</span>
                ) : null}
              </div>
              <p className="note">
                Para publicar se exige al menos una portada con texto alternativo.
              </p>

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

          {tab === 'history' ? (
            <div className="admin-publish">
              <h2>Historial</h2>
              <p className="note">Últimos cambios guardados en esta ficha.</p>
              {form.audit.length === 0 ? (
                <p className="note">Sin cambios registrados todavía.</p>
              ) : (
                <>
                  <ul className="admin-audit">
                    {form.audit
                      .slice(auditPage * AUDIT_PAGE, (auditPage + 1) * AUDIT_PAGE)
                      .map((entry) => (
                        <li key={entry.id}>
                          <span className="admin-audit__action">{entry.action}</span>
                          <span>{entry.userName ?? 'Sistema'}</span>
                          <span className="admin-audit__date">{formatStamp(entry.createdAt)}</span>
                        </li>
                      ))}
                  </ul>
                  {form.audit.length > AUDIT_PAGE ? (
                    <div className="admin-pager">
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={auditPage === 0}
                        onClick={() => setAuditPage((page) => page - 1)}
                      >
                        ← Anterior
                      </button>
                      <span>
                        Página {auditPage + 1} de {Math.ceil(form.audit.length / AUDIT_PAGE)}
                      </span>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={(auditPage + 1) * AUDIT_PAGE >= form.audit.length}
                        onClick={() => setAuditPage((page) => page + 1)}
                      >
                        Siguiente →
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div className="admin-panel__footer">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {notice ? <span className="admin-notice">{notice}</span> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
