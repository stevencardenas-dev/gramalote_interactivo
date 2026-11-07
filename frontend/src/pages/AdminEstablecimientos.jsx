import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiRequest, ensureSession } from '../lib/auth.js'

const STATUS_TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'published', label: 'Publicadas' },
  { key: 'draft', label: 'Borradores' },
  { key: 'nocover', label: 'Sin portada' },
  { key: 'recent', label: 'Editadas recientemente' },
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
  const [tab, setTab] = useState('all')
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
      all: items.length,
      published: items.filter((item) => item.published).length,
      draft: items.filter((item) => !item.published).length,
      nocover: items.filter((item) => !item.cover).length,
    }),
    [items],
  )

  const visible = useMemo(() => {
    const needle = normalize(query.trim())
    const filtered = items.filter((item) => {
      if (tab === 'published' && !item.published) return false
      if (tab === 'draft' && item.published) return false
      if (tab === 'nocover' && item.cover) return false
      if (tab === 'recent' && !item.updatedAt) return false
      if (category && item.category.slug !== category) return false
      if (!needle) return true
      return normalize(`${item.name} ${item.slug} ${item.zone?.name ?? ''}`).includes(needle)
    })
    if (tab === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))
    }
    return filtered
  }, [items, tab, category, query])

  const hasFilters = Boolean(query || category || tab !== 'all')
  const pendingCover = items.filter((item) => item.published && !item.cover).length

  function clearFilters() {
    setQuery('')
    setCategory('')
    setTab('all')
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
      navigate(`/admin/establecimientos/${created.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
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
            className="admin-btn"
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
              {creating ? 'Creando…' : 'Crear borrador'}
            </button>
          </form>
        ) : null}

        {!loading && (counts.draft > 0 || pendingCover > 0) ? (
          <div className="admin-alert" role="status">
            <strong>Por revisar:</strong>
            {counts.draft > 0 ? (
              <button type="button" onClick={() => setTab('draft')}>
                {counts.draft} {counts.draft === 1 ? 'borrador' : 'borradores'}
              </button>
            ) : null}
            {pendingCover > 0 ? (
              <button type="button" onClick={() => setTab('nocover')}>
                {pendingCover} {pendingCover === 1 ? 'publicada' : 'publicadas'} sin portada
              </button>
            ) : null}
          </div>
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
              {entry.label}
              {entry.key === 'recent' ? null : (
                <span className="admin-tab__count">{counts[entry.key]}</span>
              )}
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
                <Link className="admin-row-item__thumb" to={`/admin/establecimientos/${item.id}`}>
                  {item.cover ? (
                    <img src={item.cover.url} alt="" loading="lazy" />
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </Link>
                <div className="admin-row-item__main">
                  <Link to={`/admin/establecimientos/${item.id}`}>{item.name}</Link>
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
                  {item.published ? 'Publicado' : 'Borrador'}
                </span>
                <Link className="admin-btn" to={`/admin/establecimientos/${item.id}`}>
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
