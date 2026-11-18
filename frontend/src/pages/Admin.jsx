import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, ensureSession, getUser, subscribe } from '../lib/auth.js'

function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

const ICONS = {
  places: 'M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Zm0-8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  users: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9 8v-1.5a3.5 3.5 0 0 0-2.5-3.3M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  pages: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
}

// Tarjeta de acceso: bloque de icono + texto + flecha; toda la tarjeta es el enlace.
function Tile({ to, tone, icon, title, children }) {
  return (
    <Link className={`admin-tile admin-tile--${tone}`} to={to}>
      <span className="admin-tile__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS[icon]} />
        </svg>
      </span>
      <span className="admin-tile__text">
        <strong>{title}</strong>
        {children}
      </span>
      <svg className="admin-tile__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  )
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}

export default function Admin() {
  const navigate = useNavigate()
  // La sesión se resuelve después del primer render: hay que escucharla para
  // que Usuarios y Correo aparezcan sin recargar.
  const user = useSyncExternalStore(subscribe, getUser)
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
    navigate(
      term
        ? `/admin/lugares/establecimientos?q=${encodeURIComponent(term)}`
        : '/admin/lugares/establecimientos',
    )
  }

  // Buscador con resultados al escribir: agrupados por tipo y con la ruta de su ficha.
  const [groups, setGroups] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const requestId = useRef(0)
  const shownGroups = useMemo(() => (query.trim().length >= 2 ? groups : []), [groups, query])
  const flat = useMemo(() => shownGroups.flatMap((group) => group.items), [shownGroups])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return undefined
    const current = ++requestId.current
    const timer = window.setTimeout(async () => {
      try {
        const data = await apiRequest(`/admin/search?q=${encodeURIComponent(term)}`)
        if (current !== requestId.current) return
        setGroups(data?.groups ?? [])
        setActive(-1)
      } catch {
        if (current === requestId.current) setGroups([])
      }
    }, 220)
    return () => window.clearTimeout(timer)
  }, [query])

  function onSearchKey(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (flat.length === 0) return
      event.preventDefault()
      setOpen(true)
      setActive((index) => {
        const next = event.key === 'ArrowDown' ? index + 1 : index - 1
        return (next + flat.length) % flat.length
      })
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    } else if (event.key === 'Enter' && open && active >= 0 && flat[active]) {
      event.preventDefault()
      navigate(flat[active].to)
    }
  }

  const quotaPct =
    media?.quotaBytes > 0 ? Math.min(100, Math.round((media.usedBytes / media.quotaBytes) * 100)) : 0
  const dash = loading ? '…' : null

  return (
    <section className="admin-page admin-home">
      <div className="admin-wrap">
        <div className="admin-home__hero">
          <h1>Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>

          {error ? <p className="auth-error" role="alert">{error}</p> : null}

          <form className="admin-search" role="search" onSubmit={handleSearch}>
            <label className="visually-hidden" htmlFor="home-search">
              Buscar en el panel
            </label>
            <svg className="admin-search__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              id="home-search"
              type="search"
              role="combobox"
              aria-expanded={open && shownGroups.length > 0}
              aria-controls="home-search-results"
              aria-autocomplete="list"
              aria-activedescendant={active >= 0 ? `home-result-${active}` : undefined}
              autoComplete="off"
              placeholder="Busca una ficha, usuario…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
                setActive(-1)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => window.setTimeout(() => setOpen(false), 120)}
              onKeyDown={onSearchKey}
              autoFocus
            />
            <button type="submit" className="admin-btn admin-btn--primary">
              Buscar
            </button>

            {open && query.trim().length >= 2 ? (
              <div
                className="admin-search__results"
                id="home-search-results"
                role={shownGroups.length > 0 ? 'listbox' : 'status'}
                aria-label="Resultados"
              >
                {shownGroups.length === 0 ? (
                  <p className="admin-search__empty">Sin coincidencias para «{query.trim()}».</p>
                ) : (
                  shownGroups.map((group) => (
                    <div key={group.key} className="admin-search__group" role="group" aria-label={group.label}>
                      <p className="admin-search__label">{group.label}</p>
                      {group.items.map((item) => {
                        const index = flat.indexOf(item)
                        return (
                          <Link
                            key={`${group.key}-${item.id}`}
                            id={`home-result-${index}`}
                            role="option"
                            aria-selected={index === active}
                            className={`admin-search__item${index === active ? ' is-active' : ''}`}
                            to={item.to}
                            onMouseDown={(event) => event.preventDefault()}
                          >
                            <span className="admin-search__name">{item.name}</span>
                            <small>{item.sub}</small>
                            {item.published === false ? <em className="admin-search__draft">Sin publicar</em> : null}
                          </Link>
                        )
                      })}
                      {group.more ? (
                        <Link className="admin-search__more" to={group.more} onMouseDown={(event) => event.preventDefault()}>
                          Ver todos los resultados de {group.label.toLowerCase()} →
                        </Link>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </form>
        </div>

        <div className="admin-tiles">
          <Tile to="/admin/lugares/establecimientos" tone="places" icon="places" title="Lugares">
            <span className="admin-tile__sub">{dash ?? plural(summary.total, 'ficha', 'fichas')}</span>
            {!loading && summary.drafts > 0 ? (
              <em className="admin-tile__badge">{plural(summary.drafts, 'sin publicar', 'sin publicar')}</em>
            ) : null}
          </Tile>
          <Tile to="/admin/usuarios" tone="users" icon="users" title={isAdmin ? 'Usuarios' : 'Mi cuenta'}>
            <span className="admin-tile__sub">
              {isAdmin
                ? users
                  ? plural(users.filter((u) => u.isActive).length, 'cuenta activa', 'cuentas activas')
                  : 'Cuentas y roles'
                : 'Tu correo y tu contraseña'}
            </span>
          </Tile>
          {isAdmin ? (
            <Tile to="/admin/correo" tone="mail" icon="mail" title="Correo">
              <span className="admin-tile__sub">Avisos y plantillas</span>
            </Tile>
          ) : null}
          <Tile to="/admin/paginas" tone="pages" icon="pages" title="Páginas">
            <span className="admin-tile__sub">Inicio, Qué hacer y Dónde ir</span>
          </Tile>
        </div>

        <div className="admin-tile admin-storage-tile">
          <div
            className={`admin-ring${quotaPct > 85 ? ' is-warn' : ''}`}
            style={{ '--p': quotaPct }}
            role="progressbar"
            aria-label="Almacenamiento de imágenes usado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={quotaPct}
          >
            <b>{media ? `${quotaPct} %` : '…'}</b>
          </div>
          <div className="admin-storage-tile__text">
            <strong>Imágenes</strong>
            <span>
              {media
                ? `${formatBytes(media.usedBytes)} de ${formatBytes(media.quotaBytes)} · ${plural(
                    media.images,
                    'imagen',
                    'imágenes',
                  )}`
                : loading
                  ? 'Cargando…'
                  : 'No disponible.'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
