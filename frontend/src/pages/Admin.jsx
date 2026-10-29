import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { apiRequest, ensureSession, getUser, logout } from '../lib/auth.js'

const MODULES = [
  {
    key: 'establecimientos',
    name: 'Establecimientos',
    hint: 'Datos e imágenes de comer, dormir y comprar',
    path: '/admin/establecimientos',
  },
  { key: 'experiencias', name: 'Experiencias', hint: 'Qué hacer en Gramalote', path: null },
  { key: 'curiosidades', name: 'Curiosidades', hint: 'Contenido editorial', path: null },
]

function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Admin() {
  const navigate = useNavigate()
  const user = getUser()
  const [pending, setPending] = useState(false)
  const [items, setItems] = useState([])
  const [media, setMedia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const session = await ensureSession()
      if (!alive || !session) return
      try {
        const [list, stats] = await Promise.all([
          apiRequest('/admin/establishments'),
          apiRequest('/admin/media/stats').catch(() => null),
        ])
        if (!alive) return
        setItems(list ?? [])
        setMedia(stats)
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

  const summary = useMemo(() => {
    const published = items.filter((item) => item.published)
    const drafts = items.filter((item) => !item.published)
    const noCover = items.filter((item) => !item.cover)
    const byCategory = new Map()
    for (const item of items) {
      const key = item.category.name
      const entry = byCategory.get(key) ?? { name: key, total: 0, published: 0 }
      entry.total += 1
      if (item.published) entry.published += 1
      byCategory.set(key, entry)
    }
    const categories = [...byCategory.values()].sort((a, b) => b.total - a.total)
    const recent = [...items]
      .filter((item) => item.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
    return {
      total: items.length,
      published: published.length,
      drafts,
      noCover,
      featured: items.filter((item) => item.featured).length,
      categories,
      recent,
      maxCategory: categories[0]?.total ?? 1,
    }
  }, [items])

  async function handleLogout() {
    setPending(true)
    await logout()
    navigate('/acceder', { replace: true })
  }

  const quotaPct =
    media?.quotaBytes > 0 ? Math.min(100, Math.round((media.usedBytes / media.quotaBytes) * 100)) : 0
  const attention = [
    ...summary.drafts.map((item) => ({ item, reason: 'Borrador sin publicar' })),
    ...summary.noCover
      .filter((item) => item.published)
      .map((item) => ({ item, reason: 'Publicado sin foto de portada' })),
  ].slice(0, 6)

  return (
    <section className="admin-page">
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-breadcrumb">Panel</p>
            <h1>Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
            <p className="admin-lead">
              {user?.email ? `${user.email} · ` : ''}Resumen del contenido de Gramalote
              Interactivo.
            </p>
          </div>
          <div className="admin-head__actions">
            <Button to="/" variant="ghost">
              Ver sitio público
            </Button>
            <Button onClick={handleLogout} disabled={pending}>
              {pending ? 'Cerrando…' : 'Cerrar sesión'}
            </Button>
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat__value">{loading ? '—' : summary.total}</span>
            <span className="admin-stat__label">Fichas en total</span>
          </div>
          <div className="admin-stat admin-stat--ok">
            <span className="admin-stat__value">{loading ? '—' : summary.published}</span>
            <span className="admin-stat__label">Publicadas</span>
          </div>
          <div className="admin-stat admin-stat--draft">
            <span className="admin-stat__value">{loading ? '—' : summary.drafts.length}</span>
            <span className="admin-stat__label">Borradores</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__value">{loading ? '—' : summary.featured}</span>
            <span className="admin-stat__label">Destacadas</span>
          </div>
        </div>

        <div className="admin-dash">
          <div className="admin-card-box">
            <div className="admin-section-head">
              <h2>Requieren atención</h2>
              <Link className="admin-link" to="/admin/establecimientos">
                Ver todas
              </Link>
            </div>
            {loading ? (
              <p className="note">Cargando…</p>
            ) : attention.length === 0 ? (
              <p className="empty">Todo al día: no hay borradores ni fichas sin portada.</p>
            ) : (
              <ul className="admin-todo">
                {attention.map(({ item, reason }) => (
                  <li key={`${item.id}-${reason}`}>
                    <div>
                      <Link to={`/admin/establecimientos/${item.id}`}>{item.name}</Link>
                      <small>
                        {item.category.name} · {reason}
                      </small>
                    </div>
                    <Link className="admin-list__edit" to={`/admin/establecimientos/${item.id}`}>
                      Editar
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card-box">
            <h2>Por categoría</h2>
            {loading ? (
              <p className="note">Cargando…</p>
            ) : summary.categories.length === 0 ? (
              <p className="empty">Aún no hay fichas.</p>
            ) : (
              <ul className="admin-bars">
                {summary.categories.map((category) => (
                  <li key={category.name}>
                    <div className="admin-bars__label">
                      <span>{category.name}</span>
                      <span>
                        {category.published}/{category.total}
                      </span>
                    </div>
                    <div className="admin-bars__track">
                      <div
                        className="admin-bars__fill"
                        style={{ width: `${(category.total / summary.maxCategory) * 100}%` }}
                      >
                        <div
                          className="admin-bars__fill-ok"
                          style={{ width: `${(category.published / category.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="admin-hint">Publicadas / total por categoría.</p>
          </div>

          <div className="admin-card-box">
            <h2>Editado recientemente</h2>
            {loading ? (
              <p className="note">Cargando…</p>
            ) : summary.recent.length === 0 ? (
              <p className="empty">Sin actividad todavía.</p>
            ) : (
              <ul className="admin-todo">
                {summary.recent.map((item) => (
                  <li key={item.id}>
                    <div>
                      <Link to={`/admin/establecimientos/${item.id}`}>{item.name}</Link>
                      <small>{formatDate(item.updatedAt)}</small>
                    </div>
                    <span
                      className={`admin-badge ${
                        item.published ? 'admin-badge--ok' : 'admin-badge--draft'
                      }`}
                    >
                      {item.published ? 'Publicado' : 'Borrador'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-card-box">
            <h2>Almacenamiento de imágenes</h2>
            {media ? (
              <>
                <p className="admin-storage">
                  <strong>{formatBytes(media.usedBytes)}</strong> de {formatBytes(media.quotaBytes)}{' '}
                  · {media.files} {media.files === 1 ? 'archivo' : 'archivos'}
                </p>
                <div className="admin-bars__track">
                  <div
                    className={`admin-bars__fill-ok${quotaPct > 85 ? ' is-warn' : ''}`}
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>
                <p className="admin-hint">
                  {quotaPct}% usado · máximo {formatBytes(media.maxUploadBytes)} por imagen.
                </p>
              </>
            ) : (
              <p className="note">{loading ? 'Cargando…' : 'No disponible.'}</p>
            )}
          </div>
        </div>

        <h2 className="admin-title-sm">Módulos</h2>
        <ul className="admin-modules-grid">
          {MODULES.map((module) => (
            <li key={module.key}>
              {module.path ? (
                <Link className="admin-module-card" to={module.path}>
                  <span className="admin-module__name">{module.name}</span>
                  <span className="admin-module__hint">{module.hint}</span>
                  <span className="admin-list__edit">Abrir →</span>
                </Link>
              ) : (
                <div className="admin-module-card is-disabled">
                  <span className="admin-module__name">{module.name}</span>
                  <span className="admin-module__hint">{module.hint}</span>
                  <span className="admin-badge">Próximamente</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
