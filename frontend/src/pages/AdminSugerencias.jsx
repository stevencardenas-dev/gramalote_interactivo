import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminToast from '../components/admin/AdminToast.jsx'
import AdminLugaresTabs from '../components/admin/AdminLugaresTabs.jsx'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'

// Panel › Sugerencias: lo que llega del formulario «Sugerir un establecimiento»
// del sitio (/sugerir). Se marca como revisada, agregada o descartada.

const STATUS = {
  nueva: { label: 'Nueva', badge: 'admin-badge--draft' },
  revisada: { label: 'Revisada', badge: '' },
  agregada: { label: 'Agregada', badge: 'admin-badge--ok' },
  descartada: { label: 'Descartada', badge: '' },
}
const FILTERS = [['', 'Todas'], ...Object.entries(STATUS).map(([key, value]) => [key, value.label])]

// Conmutadores de estado (Todas y los cuatro estados de la sugerencia).

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function linkify(value) {
  if (!value) return '—'
  return value.split(/[\s,]+/).filter(Boolean).map((part, index) =>
    /^https?:\/\//i.test(part) ? (
      <a key={index} href={part} target="_blank" rel="noreferrer">
        {part}{' '}
      </a>
    ) : (
      <span key={index}>{part} </span>
    ),
  )
}

export default function AdminSugerencias() {
  const isAdmin = getUser()?.role === 'admin'
  const [items, setItems] = useState(null)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const notify = (tone, title, message) => setToast({ key: Date.now(), tone, title, message })

  // Se cargan todas para que los conmutadores muestren cuántas hay de cada estado.
  const load = useCallback(async () => {
    setItems(await apiRequest('/admin/suggestions'))
  }, [])

  useEffect(() => {
    let alive = true
    ensureSession().then((session) => {
      if (session && alive) load().catch((err) => notify('error', 'No se pudo cargar', err.message))
    })
    return () => {
      alive = false
    }
  }, [load])

  async function update(item, changes) {
    setBusy(true)
    try {
      const next = await apiRequest(`/admin/suggestions/${item.id}`, { method: 'PATCH', body: changes })
      setItems((current) => current.map((entry) => (entry.id === item.id ? next : entry)))
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`¿Borrar la sugerencia «${item.businessName}»? No se puede deshacer.`)) return
    setBusy(true)
    try {
      await apiRequest(`/admin/suggestions/${item.id}`, { method: 'DELETE' })
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (err) {
      notify('error', 'No se pudo borrar', err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <AdminLugaresTabs />
        <div className="admin-bar">
          <h1>Sugerencias</h1>
          <p className="admin-lead admin-bar__lead">
            Establecimientos que los visitantes sugieren desde <Link to="/sugerir">/sugerir</Link>.
            {isAdmin ? (
              <>
                {' '}Quién recibe el aviso por correo se configura en <Link to="/admin/correo">Correo</Link>.
              </>
            ) : null}
          </p>
        </div>

        <div className="admin-segment" role="tablist" aria-label="Filtrar por estado">
          {FILTERS.map(([value, label]) => (
            <button
              key={value || 'todas'}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={`admin-tab${filter === value ? ' is-active' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}{' '}
              <span className="admin-tab__count">
                {value ? (items ?? []).filter((entry) => entry.status === value).length : (items ?? []).length}
              </span>
            </button>
          ))}
        </div>

        {items === null ? (
          <p className="note">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="note">Todavía no llegan sugerencias.</p>
        ) : items.filter((entry) => !filter || entry.status === filter).length === 0 ? (
          <p className="note">No hay sugerencias con ese estado.</p>
        ) : (
          <ul className="admin-suggest">
            {items
              .filter((entry) => !filter || entry.status === filter)
              .map((item) => (
              <li key={item.id} className={`admin-suggest__item is-${item.status}`}>
                <div className="admin-suggest__head">
                  <div>
                    <strong>{item.businessName}</strong>
                    <small>
                      {item.businessType ?? 'Sin tipo'} · {formatStamp(item.submittedAt)}
                    </small>
                  </div>
                  <span className={`admin-badge ${STATUS[item.status]?.badge ?? ''}`}>
                    {STATUS[item.status]?.label ?? item.status}
                  </span>
                </div>
                <dl className="admin-suggest__data">
                  <dt>Dirección</dt>
                  <dd>{item.address || '—'}</dd>
                  <dt>Teléfono</dt>
                  <dd>{item.phone || '—'}</dd>
                  <dt>Redes / web</dt>
                  <dd>{linkify(item.links)}</dd>
                  <dt>¿Es el dueño?</dt>
                  <dd>{item.isOwner || '—'}</dd>
                  <dt>Sugerido por</dt>
                  <dd>
                    {item.suggesterName || 'Anónimo'}
                    {item.suggesterEmail ? (
                      <>
                        {' · '}
                        <a href={`mailto:${item.suggesterEmail}`}>{item.suggesterEmail}</a>
                      </>
                    ) : null}
                  </dd>
                </dl>
                {item.reason ? <p className="admin-suggest__reason">{item.reason}</p> : null}
                <div className="admin-suggest__actions">
                  <select
                    aria-label={`Estado de ${item.businessName}`}
                    value={item.status}
                    disabled={busy}
                    onChange={(event) => update(item, { status: event.target.value })}
                  >
                    {Object.entries(STATUS).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    className="admin-suggest__note"
                    defaultValue={item.adminNote ?? ''}
                    maxLength={500}
                    placeholder="Nota interna (se guarda al salir del campo)"
                    aria-label={`Nota interna de ${item.businessName}`}
                    onBlur={(event) => {
                      if (event.target.value !== (item.adminNote ?? '')) update(item, { adminNote: event.target.value })
                    }}
                  />
                  {isAdmin ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger-outline"
                      onClick={() => remove(item)}
                      disabled={busy}
                    >
                      Borrar
                    </button>
                  ) : null}
                </div>
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
