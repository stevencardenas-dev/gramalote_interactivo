import { useEffect, useState } from 'react'
import { apiRequest } from '../../lib/auth.js'
import { useDialog } from '../../lib/dialog.jsx'

// Pestaña «Calificaciones» de una ficha: quién votó, cuándo y cuántas
// estrellas. Cada voto se puede borrar, o todos a la vez (con confirmación).
// kind: 'establishments' | 'experiences'.

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Stars({ value }) {
  return (
    <span className="admin-stars" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'is-on' : ''} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

export default function RatingsPanel({ kind, id, name, onNotify }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { confirm } = useDialog()

  useEffect(() => {
    let alive = true
    apiRequest(`/admin/${kind}/${id}/ratings`)
      .then((result) => alive && setData(result))
      .catch((err) => alive && setError(err.message))
    return () => {
      alive = false
    }
  }, [kind, id])

  async function remove(path, ok) {
    setBusy(true)
    try {
      setData(await apiRequest(path, { method: 'DELETE' }))
      onNotify?.('ok', ok)
    } catch (err) {
      onNotify?.('error', 'No se pudo borrar', err.message)
    } finally {
      setBusy(false)
    }
  }

  const removeOne = async (rating) => {
    const ok = await confirm({
      title: `¿Borrar la calificación de ${rating.name}?`,
      message: `${rating.stars} de 5 estrellas. No se puede deshacer.`,
      confirmLabel: 'Borrar calificación',
      danger: true,
    })
    if (!ok) return
    remove(`/admin/${kind}/${id}/ratings/${rating.id}`, 'Calificación borrada.')
  }

  const removeAll = async () => {
    const count = data?.items.length ?? 0
    const ok = await confirm({
      title: `¿Borrar las ${count} calificaciones de «${name}»?`,
      message: 'El promedio vuelve a cero y no se puede deshacer.',
      confirmLabel: 'Borrar todas',
      danger: true,
    })
    if (!ok) return
    remove(`/admin/${kind}/${id}/ratings`, 'Se borraron todas las calificaciones.')
  }

  return (
    <div className="admin-publish admin-ratings">
      <div className="admin-ratings__head">
        <div>
          <h2>Calificaciones</h2>
          <p className="note">
            {data
              ? data.votes
                ? `Promedio ${(Math.round(data.average * 10) / 10).toFixed(1).replace('.', ',')} de 5 · ${data.votes} ${data.votes === 1 ? 'voto' : 'votos'}`
                : 'Todavía nadie ha calificado esta ficha.'
              : error || 'Cargando…'}
          </p>
        </div>
        {data?.items.length ? (
          <button type="button" className="admin-btn admin-btn--danger-outline" onClick={removeAll} disabled={busy}>
            Borrar todas
          </button>
        ) : null}
      </div>

      {data?.items.length ? (
        <div className="admin-ratings__table" role="table" aria-label="Calificaciones">
          <div className="admin-ratings__row admin-ratings__row--head" role="row">
            <span role="columnheader">Fecha</span>
            <span role="columnheader">Nombre</span>
            <span role="columnheader">Correo</span>
            <span role="columnheader">Calificación</span>
            <span role="columnheader">
              <span className="visually-hidden">Acciones</span>
            </span>
          </div>
          {data.items.map((rating) => (
            <div key={rating.id} className="admin-ratings__row" role="row">
              <span role="cell" title={rating.updatedAt !== rating.createdAt ? `Primera vez: ${formatStamp(rating.createdAt)}` : undefined}>
                {formatStamp(rating.updatedAt)}
              </span>
              <span role="cell">{rating.name}</span>
              <span role="cell">
                <a href={`mailto:${rating.email}`}>{rating.email}</a>
              </span>
              <span role="cell">
                <Stars value={rating.stars} />
                {rating.pending ? (
                  <span className="admin-badge admin-badge--draft" title="Aún no abre el enlace del correo; no cuenta en el promedio">
                    Sin confirmar
                  </span>
                ) : rating.pendingStars ? (
                  <span className="admin-badge admin-badge--draft" title="Volvió a calificar y falta confirmar el voto nuevo">
                    → {rating.pendingStars} ★ sin confirmar
                  </span>
                ) : null}
              </span>
              <span role="cell">
                <button
                  type="button"
                  className="admin-btn admin-btn--danger-outline"
                  onClick={() => removeOne(rating)}
                  disabled={busy}
                  aria-label={`Borrar la calificación de ${rating.name}`}
                >
                  Borrar
                </button>
              </span>
              {rating.comment || rating.pendingComment ? (
                <span className="admin-ratings__comment" role="cell">
                  «{rating.comment ?? rating.pendingComment}»
                  {rating.comment ? '' : ' · sin confirmar'}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      <p className="note">
        Si alguien vuelve a calificar con el mismo correo, se actualiza su voto, su comentario y su
        fecha. Con el correo activo, cada voto cuenta solo cuando la persona lo confirma desde su
        bandeja.
      </p>
    </div>
  )
}
