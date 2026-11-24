import EditedDate from '../components/admin/EditedDate.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminToast } from '../lib/useAdminToast.jsx'
import CoordinateInput from '../components/admin/CoordinateInput.jsx'
import AdminLugaresTabs from '../components/admin/AdminLugaresTabs.jsx'
import Pagination from '../components/admin/Pagination.jsx'
import { usePaged } from '../lib/usePaged.js'
import { MAP_ICONS, mapIconUrl } from '../data/mapIcons.js'
import { apiRequest, ensureSession } from '../lib/auth.js'

// Panel › Lugares › Patrimonio: bienes que tendrán ficha pública. Mientras la
// ficha se completa, estos datos ya alimentan el pin y la tarjeta del mapa.

const STATUS_TABS = [
  { key: 'published', label: 'Publicados' },
  { key: 'draft', label: 'No publicados' },
]

// Subcategorías dentro de Patrimonio (las de la Matriz del mapa).
const CATEGORIES = [
  'Histórico',
  'Religioso',
  'Espacio público',
  'Institucional',
  'Salud',
  'Educativo',
  'Monumento',
]

const ZONES = [
  { value: 'gramalote-viejo', label: 'Gramalote Viejo' },
  { value: 'nuevo-gramalote', label: 'Nuevo Gramalote' },
  { value: 'caldereros', label: 'Caldereros' },
]

const EMPTY = {
  name: '',
  category: 'Histórico',
  zoneKey: '',
  latitude: '',
  longitude: '',
  mapsUrl: '',
  mapIcon: 'monumento',
  summary: '',
  description: '',
  published: false,
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export default function AdminPatrimonio() {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [tab, setTab] = useState('published')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { notify, toast } = useAdminToast()


  useEffect(() => {
    let alive = true
    ensureSession().then(async (session) => {
      if (!session || !alive) return
      try {
        const data = await apiRequest('/admin/heritage')
        if (alive) setItems(data ?? [])
      } catch (err) {
        if (alive) setError(err.message)
      }
    })
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

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    return (items ?? []).filter((item) => {
      if (tab === 'published' ? !item.published : item.published) return false
      if (!needle) return true
      return normalize(
        `${item.name} ${item.category} ${item.zone ?? ''}`,
      ).includes(needle)
    })
  }, [items, tab, query])

  const paged = usePaged(visible)
  // Las flechas solo aparecen en la lista completa de publicados (sin búsqueda).
  const canOrder = tab === 'published' && query.trim() === ''

  // Flechas ↑ ↓: solo entre los publicados (son los que se ven en Historia › Patrimonio).
  // Los no publicados quedan detrás, en su orden actual.
  async function moveItem(item, delta) {
    const list = items ?? []
    const published = list.filter((entry) => entry.published)
    const drafts = list.filter((entry) => !entry.published)
    const from = published.findIndex((entry) => entry.id === item.id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= published.length) return
    const next = [...published]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const ordered = [...next, ...drafts]
    setBusy(true)
    try {
      await apiRequest('/admin/heritage/order', { method: 'PUT', body: { ids: ordered.map((entry) => entry.id) } })
      setItems(ordered)
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusy(false)
    }
  }

  function startNew() {
    setEditing('new')
    setForm(EMPTY)
    setError('')
  }

  // Cada fila abre su ficha completa (datos, imágenes, publicación e historial).
  function startEdit(item) {
    navigate(`/admin/lugares/patrimonio/${item.id}`)
  }

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await apiRequest('/admin/heritage', { method: 'POST', body: form })
      setItems((current) => [...(current ?? []), created])
      setEditing(null)
      navigate(`/admin/lugares/patrimonio/${created.id}`)
      notify('ok', 'Patrimonio creado', `${created.name} ya aparece en el panel.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function togglePublished(item) {
    setBusy(true)
    try {
      const updated = await apiRequest(`/admin/heritage/${item.id}`, {
        method: 'PATCH',
        body: { published: !item.published },
      })
      setItems((current) => (current ?? []).map((entry) => (entry.id === updated.id ? { ...updated, coverUrl: entry.coverUrl } : entry)))
      notify('ok', updated.published ? 'Publicado' : 'Despublicado', `${updated.name} ${updated.published ? 'ya se ve' : 'dejó de verse'} en el mapa.`)
    } catch (err) {
      notify('error', 'No se pudo publicar', err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <AdminLugaresTabs />
        <div className="admin-bar">
          <div className="admin-bar__heading">
            <h1>Patrimonio</h1>
            <p className="admin-bar__lead">
              Bienes con ficha en preparación. Por ahora se muestran en el mapa; aquí se completan sus datos.
            </p>
          </div>
          <label className="visually-hidden" htmlFor="patrimonio-search">
            Buscar
          </label>
          <input
            id="patrimonio-search"
            type="search"
            placeholder="Buscar por nombre, referencia o zona…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="admin-btn admin-btn--primary" onClick={startNew}>
            + Nuevo patrimonio
          </button>
        </div>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <div className="admin-segment" role="group" aria-label="Filtrar por estado">
          {STATUS_TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-pressed={tab === entry.key}
              className={`admin-tab${tab === entry.key ? ' is-active' : ''}`}
              onClick={() => setTab(entry.key)}
            >
              {entry.label} <span className="admin-tab__count">{counts[entry.key]}</span>
            </button>
          ))}
        </div>

        {editing ? (
          <form className="admin-extras__form" onSubmit={save}>
            <div className="admin-extras__form-head">
              <strong>Nuevo patrimonio</strong>
              <button type="button" className="admin-btn" onClick={() => setEditing(null)}>
                Cerrar
              </button>
            </div>
            <div className="admin-grid">
              <label className="admin-field">
                <span>Nombre</span>
                <input value={form.name} onChange={set('name')} required maxLength={180} />
              </label>
              <label className="admin-field">
                <span>Subcategoría</span>
                <select value={form.category} onChange={set('category')} required>
                  {form.category && !CATEGORIES.includes(form.category) ? (
                    <option value={form.category}>{form.category}</option>
                  ) : null}
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Zona</span>
                <select value={form.zoneKey} onChange={set('zoneKey')}>
                  <option value="">Sin zona</option>
                  {ZONES.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Icono del mapa</span>
                <select value={form.mapIcon} onChange={set('mapIcon')}>
                  {MAP_ICONS.map((icon) => (
                    <option key={icon.key} value={icon.key}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Latitud</span>
                <CoordinateInput kind="lat" onPair={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} value={form.latitude} onChange={(value) => setForm((current) => ({ ...current, latitude: value }))} required />
              </label>
              <label className="admin-field">
                <span>Longitud</span>
                <CoordinateInput kind="lng" onPair={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} value={form.longitude} onChange={(value) => setForm((current) => ({ ...current, longitude: value }))} required />
              </label>
              <label className="admin-field admin-extras__wide">
                <span>Enlace de Google Maps</span>
                <input value={form.mapsUrl} onChange={set('mapsUrl')} placeholder="https://maps.app.goo.gl/…" />
              </label>
              <label className="admin-field admin-extras__wide">
                <span>Resumen para la ficha</span>
                <input value={form.summary} onChange={set('summary')} maxLength={320} />
              </label>
              <label className="admin-field admin-extras__wide">
                <span>Descripción para la ficha</span>
                <textarea rows={4} value={form.description} onChange={set('description')} maxLength={8000} />
              </label>
            </div>
            <p className="admin-hint">
              La ficha pública todavía no se muestra; estos textos quedan guardados para cuando se habilite.
            </p>
            <label className="admin-check">
              <input type="checkbox" checked={form.published} onChange={set('published')} />
              Publicado en el mapa
            </label>
            <div className="admin-extras__actions">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                {busy ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        ) : null}

        {canOrder && items !== null ? (
          <p className="note">El orden de esta lista es el que se ve en Historia › Patrimonio. Usa las flechas para subir o bajar un lugar.</p>
        ) : null}

        {items === null ? (
          <p className="note">Cargando patrimonio…</p>
        ) : visible.length === 0 ? (
          <p className="empty">No hay lugares que coincidan con el filtro.</p>
        ) : (
          <ul className="admin-rows">
            {paged.pageItems.map((item) => {
              const position = visible.indexOf(item)
              return (
              <li key={item.id} className={`admin-row-item${canOrder ? ' admin-row-item--orderable' : ''}`} onClick={() => startEdit(item)}>
                <span className="admin-row-item__thumb">
                  <img src={item.coverUrl ?? mapIconUrl(item.mapIcon)} alt="" loading="lazy" />
                </span>
                <div className="admin-row-item__main">
                  <button
                    type="button"
                    className="admin-row-item__link"
                    onClick={(event) => {
                      event.stopPropagation()
                      startEdit(item)
                    }}
                  >
                    {item.name}
                  </button>
                  <small>
                    {item.category}
                    {item.zone ? ` · ${item.zone}` : ''}
                  </small>
                </div>
                {canOrder ? (
                  <span className="admin-row-item__order">
                    <button
                      type="button"
                      className="admin-btn"
                      aria-label={`Subir ${item.name}`}
                      disabled={busy || position === 0}
                      onClick={(event) => {
                        event.stopPropagation()
                        moveItem(item, -1)
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin-btn"
                      aria-label={`Bajar ${item.name}`}
                      disabled={busy || position === visible.length - 1}
                      onClick={(event) => {
                        event.stopPropagation()
                        moveItem(item, 1)
                      }}
                    >
                      ↓
                    </button>
                  </span>
                ) : null}
                <EditedDate value={item.updatedAt} />
                <button
                  type="button"
                  className={`admin-badge ${item.published ? 'admin-badge--ok' : 'admin-badge--draft'}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    togglePublished(item)
                  }}
                  disabled={busy}
                  title={item.published ? 'Despublicar' : 'Publicar'}
                >
                  {item.published ? 'Publicado' : 'No publicado'}
                </button>
                <span className="admin-row-item__go" aria-hidden="true">
                  ›
                </span>
              </li>
              )
            })}
          </ul>
        )}
        <Pagination {...paged} label="lugares" />
      </div>
      {toast}
    </section>
  )
}
