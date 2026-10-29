import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { apiRequest, ensureSession } from '../lib/auth.js'

const STATUS_TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'published', label: 'Publicadas' },
  { key: 'draft', label: 'Borradores' },
  { key: 'nocover', label: 'Sin portada' },
]

const SORTS = [
  { key: 'default', label: 'Destacadas primero' },
  { key: 'name', label: 'Nombre (A–Z)' },
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
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('default')
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
      if (category && item.category.slug !== category) return false
      if (!needle) return true
      return normalize(`${item.name} ${item.slug} ${item.zone?.name ?? ''}`).includes(needle)
    })
    if (sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    } else if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))
    }
    return filtered
  }, [items, tab, category, query, sort])

  const hasFilters = Boolean(query || category || tab !== 'all')

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
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-breadcrumb">
              <Link to="/admin">Panel</Link> / Establecimientos
            </p>
            <h1>Establecimientos</h1>
            <p className="admin-lead">
              Edita los datos y las imágenes de cada ficha. Los borradores no se ven en el
              sitio público hasta que los publiques.
            </p>
          </div>
          <div className="admin-head__actions">
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              Volver al panel
            </Button>
            <Button onClick={() => setShowNew((open) => !open)} aria-expanded={showNew}>
              {showNew ? 'Cerrar' : '+ Nueva ficha'}
            </Button>
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {showNew ? (
          <form className="admin-new" onSubmit={handleCreate}>
            <strong>Nueva ficha</strong>
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
            <Button type="submit" disabled={creating}>
              {creating ? 'Creando…' : 'Crear borrador'}
            </Button>
          </form>
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

        <div className="admin-filters">
          <div className="field">
            <label htmlFor="admin-search">Buscar</label>
            <input
              id="admin-search"
              type="search"
              placeholder="Nombre, slug o zona"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-category">Categoría</label>
            <select
              id="admin-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="admin-sort">Ordenar</label>
            <select id="admin-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORTS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="admin-results">
          {loading
            ? 'Cargando fichas…'
            : `${visible.length} de ${items.length} fichas`}
          {hasFilters ? (
            <button type="button" className="admin-results__clear" onClick={clearFilters}>
              Limpiar filtros
            </button>
          ) : null}
        </p>

        {loading ? null : visible.length === 0 ? (
          <p className="empty">No hay fichas que coincidan con el filtro.</p>
        ) : (
          <ul className="admin-cards">
            {visible.map((item) => (
              <li key={item.id} className="admin-ficha">
                <Link className="admin-ficha__thumb" to={`/admin/establecimientos/${item.id}`}>
                  {item.cover ? (
                    <img src={item.cover.url} alt={item.cover.alt} loading="lazy" />
                  ) : (
                    <span className="admin-list__placeholder">Sin foto de portada</span>
                  )}
                  <span
                    className={`admin-badge admin-ficha__status ${
                      item.published ? 'admin-badge--ok' : 'admin-badge--draft'
                    }`}
                  >
                    {item.published ? 'Publicado' : 'Borrador'}
                  </span>
                  {item.featured ? <span className="admin-ficha__star">★ Destacado</span> : null}
                </Link>
                <div className="admin-ficha__body">
                  <Link className="admin-ficha__name" to={`/admin/establecimientos/${item.id}`}>
                    {item.name}
                  </Link>
                  <p className="admin-list__meta">
                    {item.category.name}
                    {item.zone ? ` · ${item.zone.name}` : ''}
                  </p>
                  <p className="admin-list__meta">
                    {item.imagesCount} {item.imagesCount === 1 ? 'imagen' : 'imágenes'}
                    {item.updatedAt ? ` · editado ${formatDate(item.updatedAt)}` : ''}
                  </p>
                </div>
                <div className="admin-ficha__actions">
                  <Link className="btn btn--ghost" to={`/admin/establecimientos/${item.id}`}>
                    Editar
                  </Link>
                  {item.published ? (
                    <a
                      className="admin-link"
                      href={`/establecimiento/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver en el sitio ↗
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
