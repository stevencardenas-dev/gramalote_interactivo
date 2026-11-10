import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminSection from '../components/admin/AdminSection.jsx'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'

const TABS = [
  { key: 'info', label: 'Información' },
  { key: 'images', label: 'Imágenes' },
]

// Iconos de los consejos de la ficha (public/brand/icons/icono-*.svg).
const TIP_ICONS = ['huellas', 'camino', 'bolso', 'info', 'alerta', 'horario', 'ubicacion', 'billetera', 'telefono']

const EMPTY = {
  title: '',
  slug: '',
  category: 'naturaleza',
  summary: '',
  cardText: '',
  meta: '',
  description: '',
  hours: '',
  address: '',
  access: '',
  difficulty: '',
  price: '',
  phone: '',
  latitude: '',
  longitude: '',
  mapsUrl: '',
  mapIcon: '',
  openDaily: true,
  published: true,
  sortOrder: 0,
  tips: [],
  images: [],
}

function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function AdminExperiencias() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!(await ensureSession())) return
      try {
        const data = await apiRequest('/admin/experiences')
        if (alive) setItems(data ?? [])
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <h1>Experiencias</h1>
          <Link className="admin-btn admin-btn--primary" to="/admin/experiencias/nueva">
            + Nueva experiencia
          </Link>
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {items === null && !error ? <p className="note">Cargando experiencias…</p> : null}
        {items !== null && items.length === 0 ? (
          <p className="empty">Aún no hay experiencias.</p>
        ) : null}
        <ul className="admin-rows">
          {(items ?? []).map((item) => (
            <li key={item.id} className="admin-row-item">
              <span className="admin-row-item__thumb">
                {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : <span aria-hidden="true" />}
              </span>
              <div className="admin-row-item__main">
                <Link to={`/admin/experiencias/${item.id}`}>{item.title}</Link>
                <small>
                  {item.category ?? 'Sin categoría'}
                  {item.onMap ? ' · En el mapa' : ' · Sin coordenadas'}
                </small>
              </div>
              <span
                className={`admin-badge ${item.published ? 'admin-badge--ok' : 'admin-badge--draft'}`}
              >
                {item.published ? 'Publicada' : 'No publicada'}
              </span>
              <span className="admin-row-item__go" aria-hidden="true">
                ›
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function AdminExperiencia() {
  const { id } = useParams()
  const isNew = id === 'nueva'
  const navigate = useNavigate()
  const isAdmin = getUser()?.role === 'admin'
  const [form, setForm] = useState(isNew ? EMPTY : null)
  const [meta, setMeta] = useState({ categories: [], mapIcons: [] })
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('info')
  const [signal, setSignal] = useState({ open: true, n: 0 })

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!(await ensureSession())) return
      try {
        const [m, data] = await Promise.all([
          apiRequest('/admin/experiences/meta'),
          isNew ? null : apiRequest(`/admin/experiences/${id}`),
        ])
        if (!alive) return
        setMeta(m)
        if (data) setForm(data)
      } catch (err) {
        if (alive) setNotice(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, isNew])

  if (!form) {
    return (
      <section className="admin-page">
        <div className="admin-wrap">{notice || 'Cargando…'}</div>
      </section>
    )
  }

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }
  const setTip = (index, key, value) =>
    setForm((current) => ({
      ...current,
      tips: current.tips.map((tip, i) => (i === index ? { ...tip, [key]: value } : tip)),
    }))

  async function run(task, ok) {
    setBusy(true)
    setNotice('')
    try {
      await task()
      if (ok) setNotice(ok)
    } catch (err) {
      setNotice(err.message)
    } finally {
      setBusy(false)
    }
  }

  const save = (event) => {
    event.preventDefault()
    run(async () => {
      if (isNew) {
        const created = await apiRequest('/admin/experiences', { method: 'POST', body: form })
        navigate(`/admin/experiencias/${created.id}`, { replace: true })
      } else {
        setForm(await apiRequest(`/admin/experiences/${id}`, { method: 'PUT', body: form }))
      }
    }, 'Cambios guardados.')
  }

  const remove = () => {
    if (!window.confirm(`¿Borrar «${form.title}»? Dejará de verse en el sitio y en el mapa.`)) return
    run(async () => {
      await apiRequest(`/admin/experiences/${id}`, { method: 'DELETE' })
      navigate('/admin/experiencias')
    })
  }

  const uploadImage = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    data.append('role', form.images.length ? 'gallery' : 'cover')
    data.append('altText', form.title)
    run(async () => {
      setForm(await apiRequest(`/admin/experiences/${id}/images`, { method: 'POST', formData: data }))
    }, 'Foto subida.')
  }

  const imageAction = (image, method, body) =>
    run(async () => {
      setForm(await apiRequest(`/admin/experiences/${id}/images/${image.imageId}`, { method, body }))
    })

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-head2">
          <Link className="admin-back" to="/admin/experiencias">
            ← Experiencias
          </Link>
          <div className="admin-head2__body">
            <h1>{isNew ? 'Nueva experiencia' : form.title}</h1>
            {!isNew ? (
              <p>
                <span
                  className={`admin-badge ${form.published ? 'admin-badge--ok' : 'admin-badge--draft'}`}
                >
                  {form.published ? 'Publicada' : 'No publicada'}
                </span>
              </p>
            ) : null}
          </div>
          {!isNew && form.published ? (
            <div className="admin-head2__actions">
              <Link className="admin-btn" to={`/que-hacer/${form.slug}`} target="_blank">
                Ver en el sitio ↗
              </Link>
            </div>
          ) : null}
        </div>

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
              {item.key === 'images' && !isNew ? (
                <span className="admin-tab__count">{form.images.length}</span>
              ) : null}
            </button>
          ))}
        </nav>

        {tab === 'info' ? (
          <form className="admin-panel" onSubmit={save}>
            <div className="admin-panel__tools">
              <button type="button" className="admin-tool-btn" onClick={() => setSignal((p) => ({ open: true, n: p.n + 1 }))}>
                Expandir todo
              </button>
              <button type="button" className="admin-tool-btn" onClick={() => setSignal((p) => ({ open: false, n: p.n + 1 }))}>
                Contraer todo
              </button>
            </div>

            <AdminSection title="Tarjeta" hint="Cómo se ve en «Qué hacer» y en el inicio." defaultOpen signal={signal}>
              <div className="admin-grid">
                <Field label="Título">
                  <input required value={form.title} onChange={set('title')} maxLength={180} />
                </Field>
                <Field label="Categoría (etiqueta)">
                  <select value={form.category} onChange={set('category')}>
                    {meta.categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Datos de la tarjeta" hint="Ej.: 15 min en vehículo · Dificultad media alta">
                  <input value={form.meta} onChange={set('meta')} maxLength={255} />
                </Field>
                <Field label="Texto de la tarjeta" hint="Qué se puede hacer, en 1–2 frases.">
                  <textarea rows={3} value={form.cardText} onChange={set('cardText')} maxLength={600} />
                </Field>
              </div>
            </AdminSection>

            <AdminSection title="Ficha" hint="Contenido de la página de la experiencia." signal={signal}>
              <div className="admin-grid">
                <Field label="Resumen (bajo el título)">
                  <textarea rows={3} value={form.summary} onChange={set('summary')} maxLength={320} />
                </Field>
                <Field label="Descripción">
                  <textarea rows={6} value={form.description} onChange={set('description')} />
                </Field>
                <Field label="Cómo llegar">
                  <input value={form.access} onChange={set('access')} />
                </Field>
                <Field label="Dificultad">
                  <input value={form.difficulty} onChange={set('difficulty')} placeholder="Media alta" />
                </Field>
                <Field label="Horario">
                  <input value={form.hours} onChange={set('hours')} />
                </Field>
                <Field label="Ubicación">
                  <input value={form.address} onChange={set('address')} />
                </Field>
                <Field label="Tarifa">
                  <input value={form.price} onChange={set('price')} placeholder="$5.000 / Entrada libre" />
                </Field>
                <Field label="Teléfono">
                  <input value={form.phone} onChange={set('phone')} />
                </Field>
              </div>
            </AdminSection>

            <AdminSection title="Ten en cuenta" hint="Consejos con icono que salen en la ficha." signal={signal}>
              {form.tips.map((tip, index) => (
                <div key={index} className="admin-row admin-row--tip">
                  <select value={tip.icon} onChange={(e) => setTip(index, 'icon', e.target.value)} aria-label="Icono">
                    {TIP_ICONS.map((icon) => (
                      <option key={icon}>{icon}</option>
                    ))}
                  </select>
                  <input
                    value={tip.title}
                    onChange={(e) => setTip(index, 'title', e.target.value)}
                    placeholder="Título"
                    aria-label="Título del consejo"
                  />
                  <input
                    value={tip.text}
                    onChange={(e) => setTip(index, 'text', e.target.value)}
                    placeholder="Texto"
                    aria-label="Texto del consejo"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((c) => ({ ...c, tips: c.tips.filter((_, i) => i !== index) }))}
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn"
                onClick={() => setForm((c) => ({ ...c, tips: [...c.tips, { icon: 'info', title: '', text: '' }] }))}
              >
                + Consejo
              </button>
            </AdminSection>

            <AdminSection title="Mapa" hint="Sin coordenadas no aparece en el mapa." signal={signal}>
              <div className="admin-grid">
                <Field label="Latitud">
                  <input inputMode="decimal" value={form.latitude} onChange={set('latitude')} placeholder="7.9174" />
                </Field>
                <Field label="Longitud">
                  <input inputMode="decimal" value={form.longitude} onChange={set('longitude')} placeholder="-72.7879" />
                </Field>
                <Field label="Icono del pin">
                  <select value={form.mapIcon} onChange={set('mapIcon')}>
                    <option value="">Automático</option>
                    {meta.mapIcons.map((icon) => (
                      <option key={icon}>{icon}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Enlace de Google Maps" hint="Opcional; si falta se usan las coordenadas.">
                  <input value={form.mapsUrl} onChange={set('mapsUrl')} placeholder="https://maps.app.goo.gl/…" />
                </Field>
              </div>
            </AdminSection>

            <AdminSection title="Publicación" hint="Visibilidad, orden y dirección." signal={signal}>
              <div className="admin-checks">
                <label className="admin-check">
                  <input type="checkbox" checked={form.published} onChange={set('published')} /> Publicada
                </label>
                <label className="admin-check">
                  <input type="checkbox" checked={form.openDaily} onChange={set('openDaily')} /> Abre todos los
                  días (filtro «Abierto hoy»)
                </label>
              </div>
              <div className="admin-grid">
                <Field label="Orden">
                  <input type="number" value={form.sortOrder} onChange={set('sortOrder')} />
                </Field>
                <Field label="Slug (dirección)" hint={`/que-hacer/${form.slug || '…'}`}>
                  <input value={form.slug} onChange={set('slug')} placeholder="se genera del título" />
                </Field>
              </div>
            </AdminSection>

            <div className="admin-publish__actions">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
              {!isNew && isAdmin ? (
                <button type="button" className="admin-btn admin-btn--accent-outline" onClick={remove} disabled={busy}>
                  Borrar experiencia
                </button>
              ) : null}
            </div>
            {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
          </form>
        ) : isNew ? (
          <p className="empty">Guarda la experiencia para poder subir fotos.</p>
        ) : (
          <div className="admin-media">
            <div className="admin-media__head">
              <div>
                <h2>Imágenes</h2>
                <p className="note">
                  La portada se usa en la tarjeta, el encabezado de la ficha y el mapa. Elige otra foto y pulsa
                  «Hacer portada».
                </p>
              </div>
              <label className="admin-btn admin-btn--accent">
                {busy ? 'Subiendo…' : '+ Subir imagen'}
                <input type="file" accept="image/*" hidden onChange={uploadImage} disabled={busy} />
              </label>
            </div>
            {notice ? <p className="admin-notice" role="status">{notice}</p> : null}
            {form.images.length === 0 ? (
              <p className="empty">Todavía no hay imágenes. Sube la primera como portada.</p>
            ) : (
              <ul className="admin-media__grid">
                {form.images.map((image) => (
                  <li key={image.imageId} className="admin-media__item">
                    <div className="admin-media__shot">
                      <img src={image.url} alt={image.alt} loading="lazy" />
                      <span className={`admin-badge ${image.role === 'cover' ? 'admin-badge--ok' : ''}`}>
                        {image.role === 'cover' ? 'Portada' : 'Galería'}
                      </span>
                    </div>
                    <input
                      className="admin-media__alt"
                      aria-label="Texto alternativo"
                      defaultValue={image.alt}
                      placeholder="Texto alternativo (accesibilidad)"
                      onBlur={(e) => e.target.value !== image.alt && imageAction(image, 'PATCH', { altText: e.target.value })}
                    />
                    <div className="admin-media__actions">
                      {image.role !== 'cover' ? (
                        <button type="button" disabled={busy} onClick={() => imageAction(image, 'PATCH', { role: 'cover' })}>
                          Hacer portada
                        </button>
                      ) : null}
                      <button type="button" disabled={busy} onClick={() => imageAction(image, 'DELETE')}>
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
