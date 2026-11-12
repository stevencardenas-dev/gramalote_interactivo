import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AdminLugaresTabs from '../components/admin/AdminLugaresTabs.jsx'
import { apiRequest, ensureSession } from '../lib/auth.js'

const STATUS_TABS = [
  { key: 'published', label: 'Publicadas' },
  { key: 'draft', label: 'No publicadas' },
]

function normalize(text) {
  return (text ?? '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminEstablecimientos() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [tab, setTab] = useState('published')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftCategory, setDraftCategory] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const session = await ensureSession()
      if (!alive || !session) return

      try {
        const meta = await apiRequest('/meta')
        if (alive) setCategories(meta?.establishmentCategories ?? [])
      } catch {
        // El catálogo es auxiliar: si falla, el listado sigue funcionando.
      }

      try {
        const data = await apiRequest('/admin/establishments')
        if (alive) setItems(data ?? [])
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  const counts = useMemo(
    () => ({
      published: items.filter((item) => item.published).length,
      draft: items.filter((item) => !item.published).length,
    }),
    [items],
  )

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    const filtered = items.filter((item) => {
      if (tab === 'published' && !item.published) return false
      if (tab === 'draft' && item.published) return false
      if (category && item.category.slug !== category) return false
      if (!needle) return true
      return normalize(`${item.name} ${item.slug} ${item.zone?.name ?? ''}`).includes(needle)
    })
    filtered.sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))
    return filtered
  }, [items, tab, category, query])

  const hasFilters = Boolean(query || category)

  function clearFilters() {
    setQuery('')
    setCategory('')
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!draftName.trim() || !draftCategory) return
    setCreating(true)
    setError('')
    try {
      const created = await apiRequest('/admin/establishments', {
        method: 'POST',
        body: { name: draftName.trim(), categoryId: Number(draftCategory) },
      })
      navigate(`/admin/lugares/establecimientos/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <AdminLugaresTabs />
        <div className="admin-bar">
          <h1>Establecimientos</h1>
          <label className="visually-hidden" htmlFor="admin-search">
            Buscar
          </label>
          <input
            id="admin-search"
            type="search"
            placeholder="Buscar por nombre, slug o zona…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="visually-hidden" htmlFor="admin-category">
            Categoría
          </label>
          <select
            id="admin-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => setShowNew((open) => !open)}
            aria-expanded={showNew}
          >
            {showNew ? 'Cerrar' : '+ Nueva ficha'}
          </button>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {showNew ? (
          <form className="admin-new" onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="new-name">Nombre</label>
              <input
                id="new-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Ej. Cafetería La Ceiba"
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label htmlFor="new-category">Categoría</label>
              <select
                id="new-category"
                value={draftCategory}
                onChange={(event) => setDraftCategory(event.target.value)}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
              {creating ? 'Creando…' : 'Crear ficha'}
            </button>
          </form>
        ) : null}

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
          {hasFilters ? (
            <button type="button" className="admin-results__clear" onClick={clearFilters}>
              Limpiar filtros
            </button>
          ) : null}
        </div>

        {loading ? (
          <p className="note">Cargando fichas…</p>
        ) : visible.length === 0 ? (
          <p className="empty">No hay fichas que coincidan con el filtro.</p>
        ) : (
          <ul className="admin-rows">
            {visible.map((item) => (
              <li key={item.id} className="admin-row-item">
                <span className="admin-row-item__thumb">
                  {item.cover ? (
                    <img src={item.cover.url} alt="" loading="lazy" />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </span>
                <div className="admin-row-item__main">
                  <Link to={`/admin/lugares/establecimientos/${item.id}`}>{item.name}</Link>
                  <small>
                    {item.category.name}
                    {item.zone ? ` · ${item.zone.name}` : ''}
                    {item.featured ? ' · ★ Destacada' : ''}
                    {item.cover ? '' : ' · sin portada'}
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
        )}
      </div>
    </section>
  )
}
