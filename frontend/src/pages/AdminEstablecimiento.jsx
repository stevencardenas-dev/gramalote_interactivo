import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'

const TABS = [
  { key: 'info', label: 'Información' },
  { key: 'images', label: 'Imágenes' },
  { key: 'extras', label: 'Servicios y extras' },
  { key: 'publish', label: 'Publicación' },
]

const PLATFORMS = ['facebook', 'instagram', 'whatsapp', 'tiktok', 'youtube', 'x', 'website']

function Field({ label, children, hint }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export default function AdminEstablecimiento() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getUser()
  const fileInput = useRef(null)

  const [tab, setTab] = useState('info')
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

  const types = useMemo(() => {
    if (!meta || !form) return []
    const category = meta.establishmentCategories.find(
      (item) => item.id === Number(form.categoryId),
    )
    return category?.types ?? []
  }, [meta, form])

  if (!form) {
    return (
      <section className="admin-page">
        <div className="container">
          {error ? <p className="auth-error">{error}</p> : <p className="note">Cargando ficha…</p>}
        </div>
      </section>
    )
  }

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
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-breadcrumb">
              <Link to="/admin">Panel</Link> /{' '}
              <Link to="/admin/establecimientos">Establecimientos</Link> / {form.name}
            </p>
            <h1>{form.name}</h1>
            <p className="admin-lead">
              {form.categoryName}
              {form.zoneName ? ` · ${form.zoneName}` : ''} ·{' '}
              {form.published ? 'publicada' : 'borrador'}
            </p>
          </div>
          <div className="admin-head__actions">
            <Link className="btn btn--ghost" to={`/establecimiento/${form.slug}`} target="_blank">
              Ver ficha
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
        {notice ? <p className="admin-notice">{notice}</p> : null}

        <nav className="admin-tabs">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`admin-tab ${tab === item.key ? 'is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <form onSubmit={handleSave} className="admin-panel">
          {tab === 'info' ? (
            <>
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
                <Field label="Detalle de ubicación">
                  <input
                    value={form.locationDetail ?? ''}
                    onChange={(event) => update({ locationDetail: event.target.value })}
                  />
                </Field>
              </div>

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

              <div className="admin-grid">
                <Field label="Dirección">
                  <input
                    value={form.address ?? ''}
                    onChange={(event) => update({ address: event.target.value })}
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
                <Field label="Sitio web">
                  <input
                    value={form.website ?? ''}
                    onChange={(event) => update({ website: event.target.value })}
                  />
                </Field>
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

              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => update({ featured: event.target.checked })}
                />
                Destacado en el inicio
              </label>
            </>
          ) : null}

          {tab === 'images' ? (
            <div className="admin-media">
              <div className="admin-media__head">
                <div>
                  <h2>Imágenes de la ficha</h2>
                  <p className="note">
                    La portada es la que se ve en tarjetas y listados. Se convierten a
                    WebP automáticamente y se guardan en el disco del servidor.
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
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? 'Subiendo…' : 'Subir imágenes'}
                  </Button>
                </div>
              </div>

              {form.images.length === 0 ? (
                <p className="empty">Todavía no hay imágenes. Sube la primera como portada.</p>
              ) : (
                <ul className="admin-media__grid">
                  {form.images.map((image, index) => (
                    <li key={image.imageId} className="admin-media__item">
                      <img src={image.url} alt={image.alt} loading="lazy" />
                      <div className="admin-media__meta">
                        <span
                          className={`admin-badge ${
                            image.role === 'cover' ? 'admin-badge--ok' : ''
                          }`}
                        >
                          {image.role === 'cover' ? 'Portada' : image.role}
                        </span>
                        <span className="admin-media__dims">
                          {image.width}×{image.height}
                        </span>
                      </div>
                      <input
                        className="admin-media__alt"
                        defaultValue={image.alt}
                        placeholder="Texto alternativo (accesibilidad)"
                        onBlur={(event) => {
                          if (event.target.value !== image.alt) {
                            updateMediaAlt(image, event.target.value)
                          }
                        }}
                      />
                      <div className="admin-media__actions">
                        {image.role !== 'cover' ? (
                          <button
                            type="button"
                            disabled={busyImage}
                            onClick={() => patchImage(image, { role: 'cover' })}
                          >
                            Hacer portada
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={busyImage || index === 0}
                          onClick={() => moveImage(index, -1)}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={busyImage || index === form.images.length - 1}
                          onClick={() => moveImage(index, 1)}
                        >
                          →
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          disabled={busyImage}
                          onClick={() => unlinkImage(image)}
                        >
                          Quitar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'extras' ? (
            <div className="admin-extras">
              <section>
                <h2>Servicios</h2>
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
              </section>

              <section>
                <h2>Formas de pago</h2>
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
              </section>

              <section>
                <div className="admin-section-head">
                  <h2>Tarjetas “Ten en cuenta”</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      addToList('features', {
                        title: '',
                        description: '',
                        icon: '',
                        sortOrder: (form.features.length + 1) * 10,
                      })
                    }
                  >
                    Añadir tarjeta
                  </Button>
                </div>
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
                    <button type="button" onClick={() => removeFromList('features', index)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </section>

              <section>
                <div className="admin-section-head">
                  <h2>Productos</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      addToList('products', {
                        name: '',
                        description: '',
                        price: '',
                        sortOrder: (form.products.length + 1) * 10,
                      })
                    }
                  >
                    Añadir producto
                  </Button>
                </div>
                {form.products.map((product, index) => (
                  <div key={index} className="admin-row">
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
                    <button type="button" onClick={() => removeFromList('products', index)}>
                      Quitar
                    </button>
                  </div>
                ))}
              </section>

              <section>
                <div className="admin-section-head">
                  <h2>Redes sociales</h2>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => addToList('social', { platform: 'instagram', url: '' })}
                  >
                    Añadir red
                  </Button>
                </div>
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
              </section>

              <section>
                <h2>También puedes visitar</h2>
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
              </section>
            </div>
          ) : null}

          {tab === 'publish' ? (
            <div className="admin-publish">
              <h2>Estado de la ficha</h2>
              <p>
                {form.published
                  ? 'La ficha es visible en el sitio público.'
                  : 'La ficha está en borrador y no aparece en el sitio.'}
              </p>
              <div className="admin-publish__actions">
                <Button
                  type="button"
                  variant={form.published ? 'ghost' : 'primary'}
                  onClick={() => handlePublish(!form.published)}
                  disabled={!form.published && user?.role !== 'admin'}
                >
                  {form.published ? 'Despublicar' : 'Publicar ficha'}
                </Button>
                {user?.role !== 'admin' ? (
                  <span className="note">Solo un administrador puede publicar.</span>
                ) : null}
              </div>
              <p className="note">
                Para publicar se exige al menos una portada con texto alternativo.
              </p>

              <h2>Historial reciente</h2>
              {form.audit.length === 0 ? (
                <p className="note">Sin cambios registrados todavía.</p>
              ) : (
                <ul className="admin-audit">
                  {form.audit.map((entry) => (
                    <li key={entry.id}>
                      <span className="admin-audit__action">{entry.action}</span>
                      <span>{entry.userName ?? 'Sistema'}</span>
                      <span className="admin-audit__date">{entry.createdAt}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <div className="admin-panel__footer">
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
            {notice ? <span className="admin-notice">{notice}</span> : null}
          </div>
        </form>
      </div>
    </section>
  )
}
