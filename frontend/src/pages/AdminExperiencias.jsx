import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminSection from '../components/admin/AdminSection.jsx'
import AdminDialog from '../components/admin/AdminDialog.jsx'
import AdminToast from '../components/admin/AdminToast.jsx'
import RatingsPanel from '../components/admin/RatingsPanel.jsx'
import MapIconPicker from '../components/admin/MapIconPicker.jsx'
import ScheduleEditor from '../components/admin/ScheduleEditor.jsx'
import IconMask from '../components/ui/IconMask.jsx'
import { resolveMapIcon } from '../data/mapIcons.js'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'

const TABS = [
  { key: 'info', label: 'Información' },
  { key: 'images', label: 'Imágenes' },
  { key: 'tips', label: 'Ten en cuenta' },
  { key: 'publish', label: 'Publicación' },
  { key: 'ratings', label: 'Calificaciones' },
  { key: 'history', label: 'Historial' },
]

// Iconos de los consejos de la ficha (public/brand/icons/icono-*.svg).
const TIP_ICONS = ['huellas', 'camino', 'bolso', 'info', 'alerta', 'horario', 'ubicacion', 'billetera', 'telefono']

const AUDIT_PAGE = 8

const STATUS_TABS = [
  { key: 'published', label: 'Publicadas' },
  { key: 'draft', label: 'No publicadas' },
]

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value ?? ''
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Datos mínimos de una experiencia, los mismos que exige la API: título,
// categoría y resumen. Para publicar hace falta además una portada con texto
// alternativo. Se usa tanto para avisar antes de enviar como en el modal.
const MINIMUM_HINT =
  'Mínimo para guardar: título, categoría y resumen. Para publicar, además, una portada con texto alternativo.'

function missingFields(form, { publishing = false } = {}) {
  const missing = []
  if (!String(form.title ?? '').trim()) missing.push('Título')
  if (!form.category) missing.push('Categoría')
  if (!String(form.summary ?? '').trim()) missing.push('Resumen')
  if (publishing) {
    const cover = (form.images ?? []).some(
      (image) => image.role === 'cover' && String(image.alt ?? '').trim(),
    )
    if (!cover) missing.push('Portada con texto alternativo (obligatoria para publicar)')
  }
  return missing
}

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
  schedule: null,
  openDaily: true,
  published: false,
  sortOrder: 0,
  tips: [],
  images: [],
  audit: [],
}

// `icon` es el nombre del SVG de la ficha (public/brand/icons/icono-*.svg):
// en la sección «Visita» ilustra cómo se verá ese dato en la ficha final.
function Field({ label, hint, icon, children }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">
        {icon ? <IconMask icon={`icono-${icon}`} size={18} className="admin-field__icon" /> : null}
        {label}
      </span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function AdminExperiencias() {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [categories, setCategories] = useState([])
  const [tab, setTab] = useState('published')
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftCategory, setDraftCategory] = useState('')
  const [draftSummary, setDraftSummary] = useState('')
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)
  const toastSeq = useRef(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!(await ensureSession())) return
      try {
        const [meta, data] = await Promise.all([
          apiRequest('/admin/experiences/meta'),
          apiRequest('/admin/experiences'),
        ])
        if (!alive) return
        setCategories(meta?.categories ?? [])
        setItems(data ?? [])
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const counts = useMemo(
    () => ({
      published: (items ?? []).filter((item) => item.published).length,
      draft: (items ?? []).filter((item) => !item.published).length,
    }),
    [items],
  )

  const visible = useMemo(
    () => (items ?? []).filter((item) => (tab === 'published' ? item.published : !item.published)),
    [items, tab],
  )

  // Igual que en establecimientos: se crea con los datos mínimos y se abre el
  // editor; la ficha nace sin publicar.
  async function handleCreate(event) {
    event.preventDefault()
    const missing = missingFields({
      title: draftTitle,
      category: draftCategory,
      summary: draftSummary,
    })
    if (missing.length) {
      setDialog({
        title: 'Faltan datos para crear la experiencia',
        message: 'Completa estos datos mínimos y vuelve a intentarlo.',
        items: missing,
      })
      return
    }
    setCreating(true)
    setError('')
    try {
      const created = await apiRequest('/admin/experiences', {
        method: 'POST',
        body: {
          title: draftTitle.trim(),
          category: draftCategory,
          summary: draftSummary.trim(),
          published: false,
        },
      })
      navigate(`/admin/experiencias/${created.id}`)
    } catch (err) {
      toastSeq.current += 1
      setToast({
        tone: 'error',
        title: 'No se pudo crear la experiencia',
        message: err.message,
        key: toastSeq.current,
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <h1>Experiencias</h1>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => setShowNew((open) => !open)}
            aria-expanded={showNew}
          >
            {showNew ? 'Cerrar' : '+ Nueva experiencia'}
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {showNew ? (
          <>
            <form className="admin-new admin-new--experience" onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="new-experience-title">Título</label>
                <input
                  id="new-experience-title"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Ej. Cascadas Arco Iris"
                  autoFocus
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="new-experience-category">Categoría</label>
                <select
                  id="new-experience-category"
                  value={draftCategory}
                  onChange={(event) => setDraftCategory(event.target.value)}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="new-experience-summary">Resumen</label>
                <input
                  id="new-experience-summary"
                  value={draftSummary}
                  onChange={(event) => setDraftSummary(event.target.value)}
                  placeholder="Una frase para la tarjeta y el encabezado"
                  maxLength={320}
                  required
                />
              </div>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
                {creating ? 'Creando…' : 'Crear experiencia'}
              </button>
            </form>
            <p className="note">{MINIMUM_HINT}</p>
          </>
        ) : null}

        <div className="admin-tabs" role="tablist" aria-label="Filtrar por estado">
          {STATUS_TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={tab === entry.key}
              className={`admin-tab${tab === entry.key ? ' is-active' : ''}`}
              onClick={() => setTab(entry.key)}
            >
              {entry.label} <span className="admin-tab__count">{counts[entry.key]}</span>
            </button>
          ))}
        </div>

        {items === null && !error ? <p className="note">Cargando experiencias…</p> : null}
        {items !== null && visible.length === 0 ? (
          <p className="empty">
            {items.length === 0
              ? 'Aún no hay experiencias.'
              : 'No hay experiencias en esta pestaña.'}
          </p>
        ) : null}
        <ul className="admin-rows">
          {visible.map((item) => (
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
              <span className="admin-row-item__date">{formatDate(item.updatedAt)}</span>
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

      {toast ? (
        <AdminToast
          key={toast.key}
          tone={toast.tone}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}

      {dialog ? <AdminDialog {...dialog} onClose={() => setDialog(null)} /> : null}
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
  const [toast, setToast] = useState(null)
  const toastSeq = useRef(0)
  const [busy, setBusy] = useState(false)
  const [published, setPublished] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [tab, setTab] = useState('info')
  const [auditPage, setAuditPage] = useState(0)
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
        if (data) {
          setForm(data)
          setPublished(Boolean(data.published))
        }
      } catch (err) {
        if (alive) {
          setToast({ tone: 'error', title: 'No se pudo cargar la experiencia', message: err.message })
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [id, isNew])

  if (!form) {
    return (
      <section className="admin-page">
        <div className="admin-wrap">Cargando…</div>
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

  // Todo aviso del editor pasa por el mismo popup con barra de 8 segundos. El
  // contador hace que cada aviso se monte de nuevo y reinicie su barra.
  const notify = (tone, title, message) => {
    toastSeq.current += 1
    setToast({ tone, title, message, key: toastSeq.current })
  }

  async function run(task, ok) {
    setBusy(true)
    try {
      await task()
      if (ok) notify('ok', ok)
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusy(false)
    }
  }

  const save = (event) => {
    event.preventDefault()
    const publishing = Boolean(form.published) && !published
    const missing = missingFields(form, { publishing })
    if (missing.length) {
      setDialog({
        title: 'Faltan datos mínimos',
        message: 'Completa estos datos antes de guardar la experiencia.',
        items: missing,
      })
      return
    }
    run(async () => {
      if (isNew) {
        const created = await apiRequest('/admin/experiences', { method: 'POST', body: form })
        navigate(`/admin/experiencias/${created.id}`, { replace: true })
      } else {
        const saved = await apiRequest(`/admin/experiences/${id}`, { method: 'PUT', body: form })
        setForm(saved)
        setPublished(Boolean(saved.published))
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
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    if (!files.length) return
    run(async () => {
      let count = form.images.length
      for (const file of files) {
        const data = new FormData()
        data.append('file', file)
        data.append('role', count ? 'gallery' : 'cover')
        data.append('altText', form.title)
        setForm(await apiRequest(`/admin/experiences/${id}/images`, { method: 'POST', formData: data }))
        count += 1
      }
    }, files.length === 1 ? 'Imagen subida.' : `${files.length} imágenes subidas.`)
  }

  const imageAction = (image, method, body) =>
    run(async () => {
      setForm(await apiRequest(`/admin/experiences/${id}/images/${image.imageId}`, { method, body }))
    })

  const togglePublish = () => {
    const next = !form.published
    if (next) {
      const missing = missingFields(form, { publishing: true })
      if (missing.length) {
        setDialog({
          title: 'No se puede publicar todavía',
          message: 'Para publicar la experiencia faltan estos datos.',
          items: missing,
        })
        return
      }
    }
    run(async () => {
      const saved = await apiRequest(`/admin/experiences/${id}`, {
        method: 'PUT',
        body: { ...form, published: next },
      })
      setForm(saved)
      setPublished(Boolean(saved.published))
    }, next ? 'Experiencia publicada.' : 'Experiencia despublicada.')
  }

  const cover = form.images.find((image) => image.role === 'cover') ?? form.images[0]
  const onMap = form.latitude !== '' && form.latitude != null && form.longitude !== '' && form.longitude != null
  const automaticIcon = resolveMapIcon({ mapIcon: null, slug: form.slug, group: 'experiencia' })
  const categoryName = meta.categories.find((c) => c.slug === form.category)?.name ?? form.category

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-head2">
          <Link className="admin-back" to="/admin/experiencias">
            ← Experiencias
          </Link>
          <div className="admin-head2__cover">
            {cover ? <img src={cover.url} alt={cover.alt} /> : <span aria-hidden="true" />}
          </div>
          <div className="admin-head2__body">
            <h1>{isNew ? 'Nueva experiencia' : form.title}</h1>
            <p>
              <span className={`admin-badge ${form.published ? 'admin-badge--ok' : 'admin-badge--draft'}`}>
                {form.published ? 'Publicada' : 'No publicada'}
              </span>
              {onMap ? <span className="admin-badge">En el mapa</span> : null}
              <small>
                {categoryName} · {form.images.length} {form.images.length === 1 ? 'imagen' : 'imágenes'}
              </small>
            </p>
          </div>
          <div className="admin-head2__actions">
            {!isNew ? (
              <Link className="admin-btn" to={`/que-hacer/${form.slug}`} target="_blank" rel="noreferrer">
                Ver ficha ↗
              </Link>
            ) : null}
            <button type="button" className="admin-btn admin-btn--primary" onClick={save} disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
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
              {item.key === 'images' ? <span className="admin-tab__count">{form.images.length}</span> : null}
              {item.key === 'tips' ? <span className="admin-tab__count">{form.tips.length}</span> : null}
            </button>
          ))}
        </nav>

        <form onSubmit={save} className="admin-panel">
          {tab === 'info' || tab === 'tips' ? (
            <div className="admin-panel__tools">
              <button type="button" className="admin-tool-btn" onClick={() => setSignal((p) => ({ open: true, n: p.n + 1 }))}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 3.5 4 4 4-4M4 8.5l4 4 4-4" />
                </svg>
                Expandir todo
              </button>
              <button type="button" className="admin-tool-btn" onClick={() => setSignal((p) => ({ open: false, n: p.n + 1 }))}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 7.5 4-4 4 4M4 12.5l4-4 4 4" />
                </svg>
                Contraer todo
              </button>
            </div>
          ) : null}

          {tab === 'info' ? (
            <>
              <AdminSection title="Identidad" hint="Cómo se llama y dónde aparece la experiencia en el sitio." signal={signal}>
                <div className="admin-grid">
                  <Field label="Título">
                    <input required value={form.title} onChange={set('title')} maxLength={180} />
                  </Field>
                  <Field label="Slug (URL)" hint={`/que-hacer/${form.slug || '…'}`}>
                    <input value={form.slug} onChange={set('slug')} placeholder="se genera del título" />
                  </Field>
                  <Field label="Categoría">
                    <select value={form.category} onChange={set('category')}>
                      {meta.categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </AdminSection>

              <AdminSection title="Tarjeta" hint="Lo que se ve en «Qué hacer» y en el inicio." signal={signal}>
                <div className="admin-grid">
                  <Field label="Texto de la tarjeta" hint="Qué se puede hacer, en 1–2 frases.">
                    <textarea rows={3} value={form.cardText} onChange={set('cardText')} maxLength={600} />
                  </Field>
                  <Field label="Datos de la tarjeta" hint="Ej.: 15 min en vehículo · Dificultad media alta">
                    <input value={form.meta} onChange={set('meta')} maxLength={255} />
                  </Field>
                </div>
              </AdminSection>

              <AdminSection title="Descripción" hint="El resumen sale bajo el título; la descripción, en la ficha." signal={signal}>
                <div className="admin-grid">
                  <Field label="Resumen">
                    <textarea rows={3} value={form.summary} onChange={set('summary')} maxLength={320} />
                  </Field>
                  <Field label="Descripción">
                    <textarea rows={6} value={form.description} onChange={set('description')} />
                  </Field>
                </div>
              </AdminSection>

              <AdminSection
                title="Ubicación"
                hint="Coordenadas y pin del mapa; el texto que se lee en la ficha se escribe en «Visita»."
                signal={signal}
              >
                <div className="admin-grid">
                  <Field label="Enlace de Google Maps (opcional)" hint="Si lo dejas vacío, el botón usa las coordenadas.">
                    <input value={form.mapsUrl} onChange={set('mapsUrl')} placeholder="https://maps.app.goo.gl/…" />
                  </Field>
                  <Field label="Latitud">
                    <input inputMode="decimal" value={form.latitude ?? ''} onChange={set('latitude')} placeholder="7.9174" />
                  </Field>
                  <Field label="Longitud">
                    <input inputMode="decimal" value={form.longitude ?? ''} onChange={set('longitude')} placeholder="-72.7879" />
                  </Field>
                </div>
                <MapIconPicker
                  value={form.mapIcon}
                  automatic={automaticIcon}
                  onChange={(mapIcon) => setForm((c) => ({ ...c, mapIcon: mapIcon ?? '' }))}
                />
              </AdminSection>

              <AdminSection
                title="Visita"
                hint="Los cuatro datos de la franja; «Cómo llegar» y «Dificultad» salen en «Ten en cuenta»."
                signal={signal}
              >
                <div className="admin-grid">
                  <Field label="Horario" icon="horario">
                    <input value={form.hours} onChange={set('hours')} placeholder="9:00 a. m. – 6:00 p. m." />
                  </Field>
                  <Field label="Ubicación" icon="ubicacion">
                    <input value={form.address} onChange={set('address')} placeholder="Finca Limoncito, vereda Valderrama" />
                  </Field>
                  <Field label="Tarifa" icon="billetera">
                    <input value={form.price} onChange={set('price')} placeholder="$5.000 / Entrada libre" />
                  </Field>
                  <Field label="Teléfono" icon="telefono">
                    <input value={form.phone} onChange={set('phone')} placeholder="310 7881532" />
                  </Field>
                  <Field label="Cómo llegar" icon="huellas" hint="Opcional: aparece como tarjeta en «Ten en cuenta».">
                    <input value={form.access} onChange={set('access')} placeholder="15 min en vehículo" />
                  </Field>
                  <Field label="Dificultad" icon="camino" hint="Opcional, en texto libre.">
                    <input value={form.difficulty} onChange={set('difficulty')} placeholder="Media alta" />
                  </Field>
                </div>
              </AdminSection>

              <AdminSection
                title="Horario de apertura"
                hint="Días y horas: con esto se calcula «Abierto hoy»."
                signal={signal}
              >
                <ScheduleEditor
                  value={form.schedule ?? null}
                  fallbackDaily={form.openDaily}
                  onChange={(schedule) => setForm((current) => ({ ...current, schedule }))}
                  onUseText={(hours) => setForm((current) => ({ ...current, hours }))}
                />
              </AdminSection>
            </>
          ) : null}

          {tab === 'images' ? (
            isNew ? (
              <p className="empty">Guarda la experiencia para poder subir imágenes.</p>
            ) : (
              <div className="admin-media">
                <div className="admin-media__head">
                  <div>
                    <h2>Imágenes de la experiencia</h2>
                    <p className="note">
                      La portada se usa en la tarjeta, el encabezado de la ficha y el mapa. Se convierten a WebP al subir.
                    </p>
                  </div>
                  <div>
                    <label className="admin-btn admin-btn--accent">
                      {busy ? 'Subiendo…' : '+ Subir imágenes'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={uploadImage} disabled={busy} />
                    </label>
                  </div>
                </div>

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
                          {image.width ? (
                            <span className="admin-media__dims">
                              {image.width}×{image.height}
                            </span>
                          ) : null}
                        </div>
                        <input
                          className="admin-media__alt"
                          aria-label="Texto alternativo"
                          defaultValue={image.alt}
                          placeholder="Texto alternativo (accesibilidad)"
                          onBlur={(e) => e.target.value !== image.alt && imageAction(image, 'PATCH', { altText: e.target.value })}
                        />
                        <div className="admin-media__actions">
                          <select
                            aria-label="Uso de la imagen"
                            value={image.role === 'cover' ? 'cover' : 'gallery'}
                            disabled={busy || image.role === 'cover'}
                            onChange={(e) => e.target.value === 'cover' && imageAction(image, 'PATCH', { role: 'cover' })}
                          >
                            <option value="cover">Portada</option>
                            <option value="gallery">Galería</option>
                          </select>
                          <button type="button" aria-label="Quitar imagen" disabled={busy} onClick={() => imageAction(image, 'DELETE')}>
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          ) : null}

          {tab === 'tips' ? (
            <AdminSection
              title="Ten en cuenta"
              hint="Consejos con icono que salen en la ficha."
              signal={signal}
            >
              {form.tips.length === 0 ? <p className="empty">Sin consejos todavía.</p> : null}
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
          ) : null}

          {tab === 'publish' ? (
            <div className="admin-publish">
              <h2>Estado de la experiencia</h2>
              <p>
                {form.published
                  ? 'La experiencia es visible en «Qué hacer» y en el mapa.'
                  : 'La experiencia no está publicada y no aparece en el sitio.'}
              </p>
              {!isNew ? (
                <div className="admin-publish__actions">
                  <button
                    type="button"
                    className={`admin-btn ${form.published ? 'admin-btn--danger' : 'admin-btn--accent'}`}
                    onClick={togglePublish}
                    disabled={busy}
                  >
                    {form.published ? 'Despublicar' : 'Publicar'}
                  </button>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger-outline"
                      onClick={remove}
                      disabled={busy || form.published}
                      title={form.published ? 'Despublica la experiencia para poder borrarla' : undefined}
                    >
                      Borrar
                    </button>
                  ) : null}
                </div>
              ) : null}
              {form.published ? (
                <p className="note">Para borrar la experiencia, primero despublica.</p>
              ) : null}
              <p className="note">
                «Abierto hoy» se calcula con el horario de la pestaña Información.
              </p>
              <p className="note">{MINIMUM_HINT}</p>

              <h2>Orden</h2>
              <p className="note">
                El orden y la foto de la tarjeta en «Qué hacer» se cambian en{' '}
                <Link to="/admin/paginas?pagina=que-hacer">Páginas › Qué hacer</Link>.
              </p>
            </div>
          ) : null}

          {tab === 'ratings' ? (
            isNew ? (
              <p className="empty">Guarda la experiencia para ver sus calificaciones.</p>
            ) : (
              <RatingsPanel kind="experiences" id={id} name={form.title} onNotify={notify} />
            )
          ) : null}

          {tab === 'history' ? (
            <div className="admin-publish">
              <h2>Historial</h2>
              <p className="note">Últimos cambios guardados en esta experiencia.</p>
              {(form.audit ?? []).length === 0 ? (
                <p className="note">Sin cambios registrados todavía.</p>
              ) : (
                <>
                  <ul className="admin-audit">
                    {(form.audit ?? [])
                      .slice(auditPage * AUDIT_PAGE, (auditPage + 1) * AUDIT_PAGE)
                      .map((entry) => (
                        <li key={entry.id}>
                          <span className="admin-audit__action">{entry.action}</span>
                          <span>{entry.userName ?? 'Sistema'}</span>
                          <span className="admin-audit__date">{formatStamp(entry.createdAt)}</span>
                        </li>
                      ))}
                  </ul>
                  {(form.audit ?? []).length > AUDIT_PAGE ? (
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
                        Página {auditPage + 1} de {Math.ceil((form.audit ?? []).length / AUDIT_PAGE)}
                      </span>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={(auditPage + 1) * AUDIT_PAGE >= (form.audit ?? []).length}
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
            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {toast ? (
        <AdminToast
          key={toast.key}
          tone={toast.tone}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}

      {dialog ? <AdminDialog {...dialog} onClose={() => setDialog(null)} /> : null}
    </section>
  )
}
