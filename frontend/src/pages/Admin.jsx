import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'

function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}

export default function Admin() {
  const navigate = useNavigate()
  const user = getUser()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [users, setUsers] = useState(null)
  const [media, setMedia] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      const session = await ensureSession()
      if (!alive || !session) return
      try {
        const [list, stats, accounts] = await Promise.all([
          apiRequest('/admin/establishments'),
          apiRequest('/admin/media/stats').catch(() => null),
          isAdmin ? apiRequest('/admin/users').catch(() => null) : null,
        ])
        if (!alive) return
        setItems(list ?? [])
        setMedia(stats)
        setUsers(accounts)
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [isAdmin])

  const summary = useMemo(() => {
    const published = items.filter((item) => item.published).length
    return {
      total: items.length,
      published,
      drafts: items.length - published,
      featured: items.filter((item) => item.featured).length,
    }
  }, [items])

  function handleSearch(event) {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/admin/establecimientos?q=${encodeURIComponent(term)}` : '/admin/establecimientos')
  }

  const quotaPct =
    media?.quotaBytes > 0 ? Math.min(100, Math.round((media.usedBytes / media.quotaBytes) * 100)) : 0
  const dash = loading ? '…' : null

  return (
    <section className="admin-page admin-home">
      <div className="admin-wrap">
        <div>
          <h1>Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="admin-lead">¿Qué ficha quieres editar?</p>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        <form className="admin-search" role="search" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="home-search">
            Buscar una ficha
          </label>
          <input
            id="home-search"
            type="search"
            placeholder="Buscar una ficha por nombre, zona o slug…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <button type="submit" className="admin-btn admin-btn--primary">
            Buscar
          </button>
        </form>

        <div className="admin-tiles">
          <Link className="admin-tile" to="/admin/establecimientos">
            <strong>Establecimientos</strong>
            <span>
              {dash ?? plural(summary.total, 'ficha', 'fichas')}
              {!loading && summary.drafts > 0 ? (
                <em className="is-warn"> · {plural(summary.drafts, 'no publicada', 'no publicadas')}</em>
              ) : null}
            </span>
            <span className="admin-tile__go">Abrir →</span>
          </Link>
          {isAdmin ? (
            <Link className="admin-tile" to="/admin/usuarios">
              <strong>Usuarios</strong>
              <span>
                {users ? plural(users.filter((u) => u.isActive).length, 'cuenta activa', 'cuentas activas') : 'Cuentas y roles'}
              </span>
              <span className="admin-tile__go">Abrir →</span>
            </Link>
          ) : null}
        </div>

        <div className="admin-tile admin-storage-tile">
          <div className="admin-storage-tile__head">
            <strong>Almacenamiento de imágenes</strong>
            <span>{media ? `${quotaPct} %` : ''}</span>
          </div>
          <div className="admin-meter" aria-hidden="true">
            <i className={quotaPct > 85 ? 'is-warn' : ''} style={{ width: `${quotaPct}%` }} />
          </div>
          <p className="admin-hint">
            {media
              ? `${formatBytes(media.usedBytes)} de ${formatBytes(media.quotaBytes)} · ${plural(
                  media.files,
                  'archivo',
                  'archivos',
                )} · máximo ${formatBytes(media.maxUploadBytes)} por imagen`
              : loading
                ? 'Cargando…'
                : 'No disponible.'}
          </p>
        </div>

        <p className="admin-foot">
          {loading
            ? ' '
            : `${plural(summary.total, 'ficha', 'fichas')} · ${plural(
                summary.published,
                'publicada',
                'publicadas',
              )} · ${plural(summary.drafts, 'no publicada', 'no publicadas')} · ${plural(
                summary.featured,
                'destacada',
                'destacadas',
              )}`}
        </p>
      </div>
    </section>
  )
}
