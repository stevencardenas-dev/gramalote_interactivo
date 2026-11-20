import { useEffect, useRef, useState } from 'react'
import { useDialog } from '../../lib/dialog.jsx'

// Tarjeta de imagen de las fichas del panel (Establecimientos, Experiencias y Extras).
// El texto alternativo se edita en un borrador y se guarda con «Guardar foto»; el uso,
// el orden y «Quitar» se aplican al instante. Patrimonio usa su propia tarjeta
// (PlaceImageCard, en AdminLugarFicha.jsx) porque pide más campos.
//
// image: { url, alt, role, width?, height? }
// single: ficha con una sola foto (Extras): solo miniatura y «Quitar».

export default function AdminImageCard({
  image,
  index,
  total,
  roles = [],
  roleLabels = {},
  roleValue,
  isRoleDisabled,
  showDims = true,
  single = false,
  canMove = true,
  busy = false,
  badgeOk = false,
  draftKey,
  onDraftChange,
  onSave,
  onRole,
  onMove,
  onRemove,
  onReplace,
}) {
  const { confirm } = useDialog()
  const fileInput = useRef(null)
  const [edits, setEdits] = useState({})
  const changed = edits.alt !== undefined && edits.alt !== (image.alt ?? '')

  useEffect(() => {
    onDraftChange?.(draftKey ?? image.imageId ?? image.id, changed)
  }, [changed, draftKey, image.imageId, image.id, onDraftChange])
  useEffect(() => () => onDraftChange?.(draftKey ?? image.imageId ?? image.id, false), [draftKey, image.imageId, image.id, onDraftChange])

  const value = (key) => edits[key] ?? image[key] ?? ''
  const setField = (key) => (event) => setEdits((current) => ({ ...current, [key]: event.target.value }))

  async function save() {
    const ok = await onSave(image, { alt: value('alt') })
    if (ok !== false) setEdits({})
  }

  async function remove() {
    const ok = await confirm({
      title: '¿Quitar esta foto de la ficha?',
      message: 'Dejará de verse en el sitio.',
      confirmLabel: 'Quitar foto',
      danger: true,
    })
    if (ok) onRemove(image)
  }

  const roleName = roleLabels[image.role] ?? image.role

  return (
    <li className="admin-media__item">
      <div className="admin-media__shot">
        <img src={image.url} alt={image.alt ?? ''} loading="lazy" />
        {single ? null : <span className={`admin-badge ${badgeOk ? 'admin-badge--ok' : ''}`}>{roleName}</span>}
        {showDims && image.width ? (
          <span className="admin-media__dims">
            {image.width}×{image.height}
          </span>
        ) : null}
      </div>
      {single ? null : (
        <div className="admin-media__fields">
          <input
            className="admin-media__alt"
            aria-label="Texto alternativo"
            value={value('alt')}
            onChange={setField('alt')}
            placeholder="Texto alternativo (accesibilidad)"
            maxLength={255}
          />
        </div>
      )}
      <div className="admin-media__actions admin-media__actions--wrap">
        {!single && roles.length > 0 ? (
          <select
            aria-label="Uso de la imagen"
            value={roleValue ?? image.role}
            disabled={busy}
            onChange={(event) => onRole(image, event.target.value)}
          >
            {roles.map((role) => (
              <option key={role} value={role} disabled={isRoleDisabled?.(role, image)}>
                {roleLabels[role] ?? role}
              </option>
            ))}
          </select>
        ) : null}
        {!single && canMove ? (
          <>
            <button type="button" aria-label="Mover antes" disabled={busy || index === 0} onClick={() => onMove(index, -1)}>
              ←
            </button>
            <button type="button" aria-label="Mover después" disabled={busy || index === total - 1} onClick={() => onMove(index, 1)}>
              →
            </button>
          </>
        ) : null}
        {single ? null : (
          <button type="button" className="is-primary" disabled={busy || !changed} onClick={save}>
            Guardar foto
          </button>
        )}
        {onReplace ? (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) onReplace(image, file)
              }}
            />
            <button type="button" disabled={busy} onClick={() => fileInput.current?.click()}>
              Cambiar foto
            </button>
          </>
        ) : null}
        <button type="button" className="is-danger" disabled={busy} onClick={remove}>
          Quitar
        </button>
      </div>
    </li>
  )
}
