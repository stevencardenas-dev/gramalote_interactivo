import { useEffect, useMemo, useState } from 'react'
import AdminToast from '../components/admin/AdminToast.jsx'
import AdminLugaresTabs from '../components/admin/AdminLugaresTabs.jsx'
import { MAP_ICONS, mapIconUrl } from '../data/mapIcons.js'
import { apiRequest, ensureSession } from '../lib/auth.js'

// Panel › Lugares › Extras: puntos complementarios del mapa. No tienen ficha
// pública; aquí se editan el nombre, la categoría, la zona, el pin y el enlace
// que muestra su tarjeta en el mapa.

const STATUS_TABS = [
  { key: 'published', label: 'Publicadas' },
  { key: 'draft', label: 'No publicadas' },
]

const CATEGORIES = [
  'Institucional',
  'Cultural / institucional',
  'Seguridad / servicios',
  'Salud / servicios',
  'Servicios financieros',
  'Espacio público',
  'Espacio público / religioso',
  'Deportivo',
  'Religioso',
  'Religioso / cultural',
]

const EMPTY = {
  name: '',
  category: 'Institucional',
  zone: 'Casco urbano nuevo',
  latitude: '',
  longitude: '',
  mapsUrl: '',
  mapIcon: 'parque',
  published: false,
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export default function AdminExtras() {
  const [items, setItems] = useState(null)
  const [tab, setTab] = useState('published')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const notify = (tone, title, message) => setToast({ key: Date.now(), tone, title, message })

  useEffect(() => {
    let alive = true
    ensureSession().then(async (session) => {
      if (!session || !alive) return
      try {
        const data = await apiRequest('/admin/extras')
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
      return normalize(`${item.name} ${item.category} ${item.zone ?? ''}`).includes(needle)
    })
  }, [items, tab, query])

  function startNew() {
    setEditing('new')
    setForm(EMPTY)
    setError('')
  }

  function startEdit(item) {
    setEditing(item.id)
    setForm({
      name: item.name,
      category: item.category,
      zone: item.zone ?? '',
      latitude: String(item.latitude ?? ''),
      longitude: String(item.longitude ?? ''),
      mapsUrl: item.mapsUrl ?? '',
      mapIcon: item.mapIcon ?? 'parque',
      published: item.published,
    })
    setError('')
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
      if (editing === 'new') {
        const created = await apiRequest('/admin/extras', { method: 'POST', body: form })
        setItems((current) => [...(current ?? []), created])
        setEditing(null)
        notify('ok', 'Extra creado', `${created.name} ya aparece en el panel.`)
      } else {
        const updated = await apiRequest(`/admin/extras/${editing}`, { method: 'PATCH', body: form })
        setItems((current) => (current ?? []).map((item) => (item.id === updated.id ? updated : item)))
        setEditing(null)
        notify('ok', 'Cambios guardados', `${updated.name} quedó actualizado.`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function togglePublished(item) {
    setBusy(true)
    try {
      const updated = await apiRequest(`/admin/extras/${item.id}`, {
        method: 'PATCH',
        body: { published: !item.published },
      })
      setItems((current) => (current ?? []).map((entry) => (entry.id === updated.id ? updated : entry)))
    } catch (err) {
      notify('error', 'No se pudo publicar', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`¿Borrar el extra «${item.name}»? No se puede deshacer.`)) return
    setBusy(true)
    try {
      await apiRequest(`/admin/extras/${item.id}`, { method: 'DELETE' })
      setItems((current) => (current ?? []).filter((entry) => entry.id !== item.id))
      if (editing === item.id) setEditing(null)
    } catch (err) {
      notify('error', 'No se pudo borrar', err.message)
    } finally {
      setBusy(false)
    }
  }

  const editingItem = editing && editing !== 'new' ? (items ?? []).find((item) => item.id === editing) : null

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <AdminLugaresTabs />
        <div className="admin-bar">
          <div className="admin-bar__heading">
            <h1>Extras</h1>
            <p className="admin-bar__lead">Puntos del mapa sin ficha. En el mapa son una categoría más.</p>
          </div>
          <label className="visually-hidden" htmlFor="extras-search">
            Buscar
          </label>
          <input
            id="extras-search"
            type="search"
            placeholder="Buscar por nombre, categoría o zona…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" className="admin-btn admin-btn--primary" onClick={startNew}>
            + Nuevo extra
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="admin-segment" role="tablist" aria-label="Filtrar por estado">
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

        {editing ? (
          <form className="admin-extras__form" onSubmit={save}>
            <div className="admin-extras__form-head">
              <strong>{editing === 'new' ? 'Nuevo extra' : editingItem?.name}</strong>
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
                <span>Categoría</span>
                <input
                  value={form.category}
                  onChange={set('category')}
                  list="extras-categorias"
                  required
                  maxLength={80}
                />
                <datalist id="extras-categorias">
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </label>
              <label className="admin-field">
                <span>Zona o referencia</span>
                <input value={form.zone} onChange={set('zone')} maxLength={120} />
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
                <input value={form.latitude} onChange={set('latitude')} required inputMode="decimal" />
              </label>
              <label className="admin-field">
                <span>Longitud</span>
                <input value={form.longitude} onChange={set('longitude')} required inputMode="decimal" />
              </label>
              <label className="admin-field admin-extras__wide">
                <span>Enlace de Google Maps</span>
                <input value={form.mapsUrl} onChange={set('mapsUrl')} placeholder="https://maps.app.goo.gl/…" />
              </label>
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={set('published')}
              />
              Publicado en el mapa
            </label>
            <div className="admin-extras__actions">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
              {editingItem ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--danger-outline"
                  onClick={() => remove(editingItem)}
                  disabled={busy}
                >
                  Borrar
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        {items === null ? (
          <p className="note">Cargando extras…</p>
        ) : visible.length === 0 ? (
          <p className="empty">No hay extras que coincidan con el filtro.</p>
        ) : (
          <ul className="admin-rows">
            {visible.map((item) => (
              <li key={item.id} className="admin-row-item" onClick={() => startEdit(item)}>
                <span className="admin-row-item__thumb">
                  <img src={mapIconUrl(item.mapIcon)} alt="" loading="lazy" />
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
                    {item.matrixRef ? ` · ${item.matrixRef}` : ''}
                  </small>
                </div>
                <span className="admin-row-item__date">{formatDate(item.updatedAt)}</span>
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
                  {item.published ? 'Publicada' : 'No publicada'}
                </button>
                <span className="admin-row-item__go" aria-hidden="true">
                  ›
                </span>
              </li>
            ))}
          </ul>
        )}
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
    </section>
  )
}
