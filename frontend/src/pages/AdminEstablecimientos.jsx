import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { apiRequest, ensureSession } from '../lib/auth.js'

export default function AdminEstablecimientos() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftCategory, setDraftCategory] = useState('')

  async function load(filters = {}) {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.query) params.set('q', filters.query)
      if (filters.status) params.set('status', filters.status)
      const data = await apiRequest(`/admin/establishments?${params.toString()}`)
      setItems(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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

  async function handleSubmit(event) {
    event.preventDefault()
    await load({ query, status })
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
              Edita los datos y las imágenes de cada ficha. Los cambios se guardan en
              MySQL y las fotos en el disco del servidor.
            </p>
          </div>
          <Link className="btn btn--ghost" to="/admin">
            Volver al panel
          </Link>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <form className="admin-toolbar" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="admin-search">Buscar</label>
            <input
              id="admin-search"
              type="search"
              placeholder="Nombre, slug o dirección"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="admin-status">Estado</label>
            <select
              id="admin-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Buscando…' : 'Filtrar'}
          </Button>
        </form>

        <form className="admin-new" onSubmit={handleCreate}>
          <strong>Nueva ficha</strong>
          <div className="field">
            <label htmlFor="new-name">Nombre</label>
            <input
              id="new-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Ej. Cafetería La Ceiba"
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
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="ghost" disabled={creating}>
            {creating ? 'Creando…' : 'Crear borrador'}
          </Button>
        </form>

        {loading ? (
          <p className="note">Cargando fichas…</p>
        ) : items.length === 0 ? (
          <p className="empty">No hay fichas que coincidan con el filtro.</p>
        ) : (
          <ul className="admin-list">
            {items.map((item) => (
              <li key={item.id} className="admin-list__item">
                <div className="admin-list__thumb">
                  {item.cover ? (
                    <img src={item.cover.url} alt={item.cover.alt} loading="lazy" />
                  ) : (
                    <span className="admin-list__placeholder">Sin foto</span>
                  )}
                </div>
                <div className="admin-list__body">
                  <div className="admin-list__title">
                    <Link to={`/admin/establecimientos/${item.id}`}>{item.name}</Link>
                    <span
                      className={`admin-badge ${
                        item.published ? 'admin-badge--ok' : 'admin-badge--draft'
                      }`}
                    >
                      {item.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="admin-list__meta">
                    {item.category.name}
                    {item.zone ? ` · ${item.zone.name}` : ''} · {item.imagesCount}{' '}
                    {item.imagesCount === 1 ? 'imagen' : 'imágenes'}
                  </p>
                  <p className="admin-list__slug">/establecimiento/{item.slug}</p>
                </div>
                <Link className="admin-list__edit" to={`/admin/establecimientos/${item.id}`}>
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
