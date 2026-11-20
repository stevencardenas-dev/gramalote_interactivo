import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminSection from '../components/admin/AdminSection.jsx'
import AdminToast from '../components/admin/AdminToast.jsx'
import { focusLatitude, useNearbyCheck } from '../components/admin/NearbyCheck.jsx'
import AuditTimeline from '../components/admin/AuditTimeline.jsx'
import { MAP_ICONS, mapIconUrl } from '../data/mapIcons.js'
import { apiRequest, ensureSession } from '../lib/auth.js'
import { useDialog } from '../lib/dialog.jsx'

// Ficha editable de un Patrimonio o de un Extra (Panel › Lugares), con las mismas
// pestañas que una ficha de establecimiento: Información, Imágenes, Publicación e
// Historial. Una sola pantalla para los dos tipos; lo que cambia está en KINDS.

const STATUSES = ['Visitable', 'Con restricciones', 'Solo memoria']
const ZONES = [
  { value: 'gramalote-viejo', label: 'Gramalote Viejo' },
  { value: 'nuevo-gramalote', label: 'Nuevo Gramalote' },
  { value: 'caldereros', label: 'Caldereros' },
]
const HERITAGE_CATEGORIES = ['Histórico', 'Religioso', 'Espacio público', 'Institucional', 'Salud', 'Educativo', 'Monumento']
const FICHA_CATEGORIES = ['Patrimonio religioso', 'Edificio histórico', 'Espacio público', 'Monumento']
const EXTRA_CATEGORIES = [
  'Espacio público',
  'Espacio público / religioso',
  'Deportivo',
  'Religioso',
  'Religioso / cultural',
  'Cultural / institucional',
  'Institucional',
  'Salud / servicios',
  'Seguridad / servicios',
  'Servicios financieros',
]
const asOptions = (items) => items.map((value) => ({ value, label: value }))

const ROLE_LABELS = {
  cover: 'Portada',
  gallery: 'Galería',
  historic: 'Carrusel',
  // Usos anteriores a la migración 033: se muestran como galería.
  current: 'Galería',
  detail: 'Galería',
}
const ROLE_HELP = {
  cover: 'La que se ve en tarjetas, listados y el mapa. Solo una.',
  gallery: 'Fotos complementarias. Se muestran en la cuadrícula de la ficha con su pie de foto y crédito.',
  historic: 'Se muestra en el carrusel de la ficha, junto a la portada, con su pie de foto y crédito.',
}

const KINDS = {
  heritage: {
    api: '/admin/heritage',
    listPath: '/admin/lugares/patrimonio',
    listLabel: 'Patrimonio',
    noun: 'patrimonio',
    publicPath: (form) => `/historia/patrimonio/${form.slug}`,
    sections: [
      {
        title: 'Datos principales',
        hint: 'Nombre, tipo, estado y zona del bien.',
        fields: [
          { key: 'name', label: 'Nombre', required: true, max: 180 },
          { key: 'category', label: 'Subcategoría del mapa', type: 'select', options: asOptions(HERITAGE_CATEGORIES), empty: 'Elige una…', required: true },
          {
            key: 'fichaCategory',
            label: 'Categoría en la ficha',
            type: 'select',
            options: asOptions(FICHA_CATEGORIES),
            empty: 'La misma que la subcategoría',
          },
          { key: 'status', label: 'Estado', type: 'select', options: STATUSES.map((value) => ({ value, label: value })) },
          {
            key: 'zoneKey',
            label: 'Zona',
            type: 'select',
            options: ZONES,
            empty: 'Sin zona',
            help: 'La misma zona se usa en la ficha, el filtro y el mapa.',
          },
          {
            key: 'zoneTag',
            label: 'Etiqueta de zona (opcional)',
            placeholder: 'Gramalote Viejo — emplazamiento histórico',
            max: 120,
            help: 'Solo si la ficha necesita una frase distinta al nombre de la zona.',
          },
        ],
      },
      {
        title: 'Textos de la ficha',
        hint: 'Lo que se lee en Historia › Patrimonio.',
        fields: [
          { key: 'intro', label: 'Frase introductoria', type: 'textarea', rows: 2, max: 600, wide: true },
          { key: 'subtitle', label: 'Subtítulo', max: 200, wide: true },
          { key: 'summary', label: 'Resumen (tarjetas y mapa)', type: 'textarea', rows: 2, max: 320, wide: true },
          {
            key: 'description',
            label: 'Descripción histórica',
            type: 'textarea',
            rows: 10,
            max: 12000,
            wide: true,
            help: 'Separa los párrafos con una línea en blanco.',
          },
          { key: 'sources', label: 'Fuentes consultadas', type: 'textarea', rows: 3, max: 4000, wide: true },
        ],
      },
      {
        title: 'Información para visitarlo',
        hint: 'Ubicación, acceso, recomendación y horario. Si lo dejas vacío, la ficha no muestra este bloque.',
        fields: [
          { key: 'visitLocation', label: 'Ubicación', max: 500, wide: true },
          { key: 'visitAccess', label: 'Acceso', max: 300 },
          { key: 'hoursText', label: 'Horario de visita', max: 255 },
          { key: 'address', label: 'Dirección', max: 255 },
          { key: 'visitRecommendation', label: 'Recomendación', type: 'textarea', rows: 3, max: 1000, wide: true },
        ],
      },
      {
        title: 'Ubicación en el mapa',
        hint: 'Coordenadas, enlace y detalles técnicos.',
        fields: [
          { key: 'latitude', label: 'Latitud', type: 'number', required: true, step: 'any' },
          { key: 'longitude', label: 'Longitud', type: 'number', required: true, step: 'any' },
          { key: 'mapsUrl', label: 'Enlace de Google Maps', max: 500, wide: true },
          { key: 'mapIcon', label: 'Icono del mapa', type: 'icon' },
          { key: 'slug', label: 'Enlace (slug)', max: 160, help: 'Cambiarlo cambia la dirección pública de la ficha.' },
          { key: 'sortOrder', label: 'Orden', type: 'number', step: '1' },
        ],
      },
    ],
    publication: [
      { key: 'published', label: 'Publicada en Historia › Patrimonio', help: 'Muestra su ficha en el sitio.' },
      { key: 'showOnMap', label: 'Visible en el mapa', help: 'Muestra su pin en /mapa.' },
    ],
  },
  extras: {
    api: '/admin/extras',
    listPath: '/admin/lugares/extras',
    listLabel: 'Extras',
    noun: 'extra',
    publicPath: () => '/mapa',
    // Un extra no tiene ficha: se ve como ventana flotante en el mapa.
    publicLabel: 'Ver en el mapa',
    sections: [
      {
        title: 'Datos principales',
        hint: 'Nombre, categoría y la frase que se lee al abrir su punto en el mapa.',
        fields: [
          { key: 'name', label: 'Nombre', required: true, max: 180 },
          { key: 'category', label: 'Categoría', type: 'select', options: asOptions(EXTRA_CATEGORIES), empty: 'Elige una…', required: true },
          { key: 'zone', label: 'Zona o referencia', max: 120 },
          {
            key: 'summary',
            label: 'Resumen de la tarjeta del mapa',
            type: 'textarea',
            rows: 2,
            max: 320,
            wide: true,
            help: 'Se ve en /mapa al abrir este punto, debajo de la categoría y la zona.',
          },
        ],
      },
      {
        title: 'Ubicación en el mapa',
        hint: 'Coordenadas, enlace y detalles técnicos.',
        fields: [
          { key: 'latitude', label: 'Latitud', type: 'number', required: true, step: 'any' },
          { key: 'longitude', label: 'Longitud', type: 'number', required: true, step: 'any' },
          { key: 'mapsUrl', label: 'Enlace de Google Maps', max: 500, wide: true },
          { key: 'mapIcon', label: 'Icono del mapa', type: 'icon' },
          { key: 'sortOrder', label: 'Orden', type: 'number', step: '1' },
        ],
      },
    ],
    publication: [{ key: 'published', label: 'Visible en el mapa', help: 'Muestra su pin en /mapa.' }],
  },
}

const TABS = [
  { key: 'info', label: 'Información' },
  { key: 'images', label: 'Imágenes' },
  { key: 'publish', label: 'Publicación' },
  { key: 'history', label: 'Historial' },
]

const NO_LOOKUPS = { category: () => null, type: () => null, zone: () => null }

function editableKeys(kind) {
  return [...kind.sections.flatMap((section) => section.fields.map((field) => field.key)), ...kind.publication.map((field) => field.key)]
}

function pickFields(kind, data) {
  const result = {}
  for (const key of editableKeys(kind)) result[key] = data[key] ?? (typeof data[key] === 'boolean' ? data[key] : '')
  return result
}

function Field({ spec, value, onChange }) {
  const common = { required: spec.required, maxLength: spec.max }
  const style = spec.wide ? { gridColumn: '1 / -1' } : undefined

  if (spec.type === 'checkbox') {
    return (
      <label className="admin-field admin-field--check" style={style}>
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        <span>{spec.label}</span>
      </label>
    )
  }

  let control
  if (spec.type === 'textarea') {
    control = <textarea rows={spec.rows ?? 3} value={value ?? ''} onChange={(event) => onChange(event.target.value)} {...common} />
  } else if (spec.type === 'select') {
    control = (
      <select value={value ?? ''} onChange={(event) => onChange(event.target.value)} required={spec.required}>
        {spec.empty ? <option value="">{spec.empty}</option> : null}
        {/* Un valor guardado que no está en la lista (datos antiguos) se conserva. */}
        {value && !spec.options.some((option) => option.value === value) ? <option value={value}>{value}</option> : null}
        {spec.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else if (spec.type === 'icon') {
    control = (
      <span className="place-icon">
        <img src={mapIconUrl(value || 'monumento')} alt="" width="32" height="32" />
        <select value={value ?? ''} onChange={(event) => onChange(event.target.value)}>
          {MAP_ICONS.map((icon) => (
            <option key={icon.key} value={icon.key}>
              {icon.label}
            </option>
          ))}
        </select>
      </span>
    )
  } else {
    control = (
      <input
        data-field={spec.key}
        type={spec.type ?? 'text'}
        step={spec.step}
        placeholder={spec.placeholder}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        {...common}
      />
    )
  }

  return (
    <label className="admin-field" style={style}>
      <span>{spec.label}</span>
      {control}
      {spec.help ? <small className="admin-hint">{spec.help}</small> : null}
    </label>
  )
}

function ImageCard({ image, index, total, kindKey, roles, busy, onSave, onRemove, onMove }) {
  const [draft, setDraft] = useState({ role: image.role, eraLabel: image.eraLabel ?? '', altText: image.altText, caption: image.caption, credit: image.credit })
  // Un extra no tiene ficha: su única foto es la portada, sin uso que elegir.
  const single = kindKey === 'extras'
  const dirty =
    draft.role !== image.role ||
    draft.eraLabel !== (image.eraLabel ?? '') ||
    draft.altText !== image.altText ||
    draft.caption !== image.caption ||
    draft.credit !== image.credit
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }))

  return (
    <li className="place-img">
      <div className="place-img__thumb">
        <img src={image.url} alt="" loading="lazy" />
        <span className={`place-img__role place-img__role--${image.role}`}>{ROLE_LABELS[image.role] ?? 'Portada'}</span>
      </div>
      <div className="place-img__body">
        <div className="admin-grid">
          {!single ? (
            <label className="admin-field">
              <span>Uso</span>
              <select value={draft.role} onChange={set('role')}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {/* Un extra solo muestra la foto en su tarjeta del mapa: no usa texto
              alternativo, pie ni crédito, así que no se piden. */}
          {!single ? (
            <>
              <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
                <span>Texto alternativo (describe la foto)</span>
                <input value={draft.altText} onChange={set('altText')} maxLength={255} />
              </label>
              <label className="admin-field">
                <span>Pie de foto (se ve sobre la foto)</span>
                <input value={draft.caption} onChange={set('caption')} maxLength={120} placeholder="Templo en 1950" />
              </label>
              <label className="admin-field">
                <span>Crédito o fuente</span>
                <input value={draft.credit} onChange={set('credit')} maxLength={255} />
              </label>
            </>
          ) : null}
        </div>
        <div className="place-img__actions">
          {!single ? (
            <button type="button" className="admin-btn admin-btn--primary" disabled={!dirty || busy} onClick={() => onSave(image, draft)}>
              Guardar foto
            </button>
          ) : null}
          {!single ? (
            <>
              <button type="button" className="admin-btn" disabled={index === 0 || busy} onClick={() => onMove(index, -1)} aria-label="Subir">
                ↑
              </button>
              <button type="button" className="admin-btn" disabled={index === total - 1 || busy} onClick={() => onMove(index, 1)} aria-label="Bajar">
                ↓
              </button>
            </>
          ) : null}
          <button type="button" className="admin-btn admin-btn--danger-outline" disabled={busy} onClick={() => onRemove(image)}>
            Quitar
          </button>
        </div>
      </div>
    </li>
  )
}

export default function AdminLugarFicha({ kind: kindKey }) {
  const kind = KINDS[kindKey]
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirm } = useDialog()
  const fileInput = useRef(null)

  const [form, setForm] = useState(null)
  const [baseline, setBaseline] = useState('')
  const [tab, setTab] = useState('info')
  const nearby = useNearbyCheck({
    onReview: () => {
      setTab('info')
      focusLatitude()
    },
  })
  const [saving, setSaving] = useState(false)
  const [busyImage, setBusyImage] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [upload, setUpload] = useState(() => ({
    // Vacío = automático: la primera foto de un patrimonio es la portada (sin ella
    // no aparece en tarjetas ni en el mapa); las siguientes, galería.
    role: kindKey === 'extras' ? 'cover' : '',
    eraLabel: '',
    altText: '',
    caption: '',
    credit: '',
  }))

  const notify = (tone, title, message) => setToast({ key: Date.now(), tone, title, message, close: () => setToast(null) })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const session = await ensureSession()
      if (!alive || !session) return
      try {
        const detail = await apiRequest(`${kind.api}/${id}`)
        if (!alive) return
        setForm(detail)
        setBaseline(JSON.stringify(pickFields(kind, detail)))
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [id, kind])

  const dirty = useMemo(() => (form ? JSON.stringify(pickFields(kind, form)) !== baseline : false), [form, baseline, kind])
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))

  async function save(event) {
    event?.preventDefault()
    const proceed = await nearby.check({
      lat: form.latitude,
      lng: form.longitude,
      type: kindKey === 'extras' ? 'extra' : 'heritage',
      id: form.id,
    })
    if (!proceed) return
    setSaving(true)
    setError('')
    try {
      const detail = await apiRequest(`${kind.api}/${id}`, { method: 'PATCH', body: pickFields(kind, form) })
      setForm(detail)
      setBaseline(JSON.stringify(pickFields(kind, detail)))
      notify('ok', dirty ? 'Cambios guardados' : 'Sin cambios', dirty ? 'La ficha quedó actualizada.' : 'No había nada nuevo que guardar.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Las fotos se guardan al instante y no tocan lo que se esté editando en el texto.
  function applyImages(detail) {
    setForm((current) => ({ ...current, images: detail.images, audit: detail.audit, updatedAt: detail.updatedAt }))
  }

  async function uploadImage(event) {
    event.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setError('Elige una foto para subir.')
      return
    }
    setBusyImage(true)
    setError('')
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('role', uploadRole)
      // Un extra no pide texto alternativo, pie ni crédito: se usa su nombre.
      const fields = kindKey === 'extras' ? { altText: form.name } : upload
      for (const key of ['eraLabel', 'altText', 'caption', 'credit']) data.append(key, fields[key] ?? '')
      const detail = await apiRequest(`${kind.api}/${id}/images`, { method: 'POST', formData: data })
      applyImages(detail)
      if (fileInput.current) fileInput.current.value = ''
      setUpload((current) => ({ ...current, eraLabel: '', altText: '', caption: '', credit: '' }))
      notify('ok', 'Foto subida', 'Ya forma parte de la ficha.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function saveImage(image, draft) {
    setBusyImage(true)
    setError('')
    try {
      applyImages(await apiRequest(`${kind.api}/${id}/images/${image.id}`, { method: 'PATCH', body: draft }))
      notify('ok', 'Foto actualizada', 'Los cambios de la foto quedaron guardados.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function moveImage(index, delta) {
    const order = form.images.map((image) => image.id)
    const [moved] = order.splice(index, 1)
    order.splice(index + delta, 0, moved)
    setBusyImage(true)
    try {
      applyImages(await apiRequest(`${kind.api}/${id}/images/order`, { method: 'PUT', body: { ids: order } }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function removeImage(image) {
    const ok = await confirm({
      title: '¿Quitar esta foto de la ficha?',
      message: 'Dejará de verse en el sitio.',
      confirmLabel: 'Quitar foto',
      danger: true,
    })
    if (!ok) return
    setBusyImage(true)
    try {
      applyImages(await apiRequest(`${kind.api}/${id}/images/${image.id}`, { method: 'DELETE' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  async function removePlace() {
    const ok = await confirm({
      title: `¿Borrar «${form.name}»?`,
      message: 'Se borra la ficha con sus fotos. No se puede deshacer.',
      confirmLabel: 'Borrar',
      danger: true,
    })
    if (!ok) return
    try {
      await apiRequest(`${kind.api}/${id}`, { method: 'DELETE' })
      navigate(kind.listPath)
    } catch (err) {
      setError(err.message)
    }
  }

  // Publicar y despublicar se guardan al instante, igual que en las fichas de
  // establecimientos: el botón de la pestaña Publicación hace el cambio solo.
  async function updatePublication(patch, title, message) {
    setError('')
    try {
      const detail = await apiRequest(`${kind.api}/${id}`, { method: 'PATCH', body: patch })
      // No se pisa el formulario: puede haber texto sin guardar. Solo cambian los
      // interruptores de publicación, también en la base del cálculo de cambios.
      setForm((current) => ({
        ...current,
        published: detail.published,
        showOnMap: detail.showOnMap,
        audit: detail.audit,
        updatedAt: detail.updatedAt,
      }))
      setBaseline((current) => {
        try {
          const parsed = JSON.parse(current)
          parsed.published = detail.published
          parsed.showOnMap = detail.showOnMap
          return JSON.stringify(parsed)
        } catch {
          return current
        }
      })
      notify('ok', title, message)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!form) {
    return (
      <section className="admin-page">
        <div className="admin-wrap">
          {error ? <p className="auth-error" role="alert">{error}</p> : <p className="note">Cargando ficha…</p>}
          <Link className="admin-btn" to={kind.listPath}>
            ← {kind.listLabel}
          </Link>
        </div>
      </section>
    )
  }

  const roles = form.imageRoles ?? (kindKey === 'extras' ? ['cover'] : ['cover', 'gallery'])
  // Uso de la foto que se sube: el elegido o, si no se eligió, portada cuando aún
  // no hay una y galería cuando ya existe.
  const uploadRole = upload.role || (form.images.some((image) => image.role === 'cover') ? 'gallery' : 'cover')
  const cover = form.images.find((image) => image.role === 'cover') ?? form.images[0] ?? null

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-head2">
          <Link className="admin-back" to={kind.listPath}>
            ← {kind.listLabel}
          </Link>
          <div className="admin-head2__cover">
            {cover ? <img src={cover.url} alt="" /> : <span aria-hidden="true" />}
          </div>
          <div className="admin-head2__body">
            <h1>{form.name || 'Sin nombre'}</h1>
            <p>
              <span className={`admin-badge ${form.published ? 'admin-badge--ok' : 'admin-badge--draft'}`}>
                {form.published ? 'Publicado' : 'No publicado'}
              </span>
              <small>
                {form.category}
                {form.zone ? ` · ${form.zone}` : ''}
              </small>
            </p>
          </div>
          <div className="admin-head2__actions">
            <Link className="admin-btn" to={kind.publicPath(form)} target="_blank" rel="noreferrer">
              {kind.publicLabel ?? 'Ver ficha'} ↗
            </Link>
            <button type="button" className="admin-btn admin-btn--primary" onClick={save} disabled={saving || !dirty}>
              {saving ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
            </button>
          </div>
        </div>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <nav className="admin-tabs" aria-label="Secciones de la ficha">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-current={tab === item.key ? 'true' : undefined}
              className={`admin-tab ${tab === item.key ? 'is-active' : ''}`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
              {item.key === 'images' ? <span className="admin-tab__count">{form.images.length}</span> : null}
            </button>
          ))}
        </nav>

        <form onSubmit={save} className="admin-panel">
          {tab === 'info' ? (
            <>
              {kind.sections.map((section, index) => (
                <AdminSection key={section.title} title={section.title} hint={section.hint} defaultOpen={index === 0}>
                  <div className="admin-grid">
                    {section.fields.map((spec) => (
                      <Field key={spec.key} spec={spec} value={form[spec.key]} onChange={set(spec.key)} />
                    ))}
                  </div>
                </AdminSection>
              ))}
            </>
          ) : null}

          {tab === 'images' ? (
            <div className="place-images">
              {kindKey === 'extras' && form.images.length > 0 ? (
                <p className="note">
                  Los extras llevan una sola foto: la portada. Para cambiarla, quita la actual y sube otra.
                </p>
              ) : (
                <AdminSection title="Subir una foto" hint={kindKey === 'extras' ? 'Elige el archivo: será la foto de su tarjeta en el mapa.' : 'Elige el archivo y dile a la ficha para qué sirve.'} defaultOpen>
                  <div className="admin-grid">
                    <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
                      <span>Archivo (JPG, PNG o WebP, mínimo 200 × 200 px)</span>
                      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" />
                    </label>
                    {kindKey === 'heritage' ? (
                      <label className="admin-field">
                        <span>Uso</span>
                        <select value={uploadRole} onChange={(event) => setUpload({ ...upload, role: event.target.value })}>
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                        <small className="admin-hint">{ROLE_HELP[uploadRole]}</small>
                      </label>
                    ) : null}
                    {/* Un extra solo necesita la foto: sin texto alternativo, pie ni crédito. */}
                    {kindKey === 'heritage' ? (
                      <>
                        <label className="admin-field" style={{ gridColumn: '1 / -1' }}>
                          <span>Texto alternativo (describe la foto)</span>
                          <input value={upload.altText} onChange={(event) => setUpload({ ...upload, altText: event.target.value })} maxLength={255} />
                        </label>
                        <label className="admin-field">
                          <span>Pie de foto (se ve sobre la foto)</span>
                          <input value={upload.caption} onChange={(event) => setUpload({ ...upload, caption: event.target.value })} maxLength={120} placeholder="Templo en 1950" />
                        </label>
                        <label className="admin-field">
                          <span>Crédito o fuente</span>
                          <input value={upload.credit} onChange={(event) => setUpload({ ...upload, credit: event.target.value })} maxLength={255} />
                        </label>
                      </>
                    ) : null}
                  </div>
                  <div>
                    <button type="button" className="admin-btn admin-btn--primary" onClick={uploadImage} disabled={busyImage}>
                      {busyImage ? 'Subiendo…' : 'Subir foto'}
                    </button>
                  </div>
                </AdminSection>
              )}

              {form.images.length === 0 ? (
                <p className="note">Esta ficha todavía no tiene fotos.</p>
              ) : (
                <ul className="place-img-list">
                  {form.images.map((image, index) => (
                    <ImageCard
                      key={`${image.id}-${image.role}-${image.eraLabel}-${image.altText}-${image.caption}-${image.credit}`}
                      image={image}
                      index={index}
                      total={form.images.length}
                      kindKey={kindKey}
                      roles={roles}
                      busy={busyImage}
                      onSave={saveImage}
                      onRemove={removeImage}
                      onMove={moveImage}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {tab === 'publish' ? (
            <div className="admin-publish">
              <h2>Estado de la ficha</h2>
              <p>
                {form.published
                  ? kindKey === 'heritage'
                    ? 'La ficha es visible en Historia › Patrimonio.'
                    : 'El punto es visible en el mapa.'
                  : kindKey === 'heritage'
                    ? 'La ficha no está publicada y no aparece en Historia › Patrimonio.'
                    : 'El punto no está publicado y no aparece en el mapa.'}
              </p>
              <div className="admin-publish__actions">
                <button
                  type="button"
                  className={`admin-btn ${form.published ? 'admin-btn--danger' : 'admin-btn--primary'}`}
                  onClick={() =>
                    updatePublication(
                      { published: !form.published },
                      form.published ? 'Despublicado' : 'Publicado',
                      form.published
                        ? kindKey === 'heritage'
                          ? 'La ficha dejó de verse en el sitio.'
                          : 'El punto dejó de verse en el mapa.'
                        : kindKey === 'heritage'
                          ? 'La ficha ya se ve en el sitio.'
                          : 'El punto ya se ve en el mapa.',
                    )
                  }
                >
                  {form.published ? 'Despublicar' : kindKey === 'heritage' ? 'Publicar ficha' : 'Publicar en el mapa'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger-outline"
                  onClick={removePlace}
                  disabled={form.published}
                  title={form.published ? 'Despublica la ficha para poder borrarla' : undefined}
                >
                  Borrar
                </button>
              </div>
              {form.published ? <p className="note">Para borrar la ficha, primero despublica.</p> : null}

              {kindKey === 'heritage' ? (
                <>
                  <h2>Mapa</h2>
                  <p>{form.showOnMap ? 'Su pin aparece en /mapa.' : 'Su pin no aparece en /mapa.'}</p>
                  <div className="admin-publish__actions">
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() =>
                        updatePublication(
                          { showOnMap: !form.showOnMap },
                          form.showOnMap ? 'Quitado del mapa' : 'Añadido al mapa',
                          form.showOnMap ? 'El pin dejó de verse en /mapa.' : 'El pin ya se ve en /mapa.',
                        )
                      }
                    >
                      {form.showOnMap ? 'Quitar del mapa' : 'Mostrar en el mapa'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {tab === 'history' ? (
            <div className="admin-publish">
              <h2>Historial</h2>
              <p className="note">Quién cambió qué en esta ficha y cuándo. Solo se registra cuando hay algo nuevo.</p>
              {form.audit.length === 0 ? <p className="note">Sin cambios registrados todavía.</p> : <AuditTimeline audit={form.audit} lookups={NO_LOOKUPS} />}
            </div>
          ) : null}
        </form>
      </div>

      {nearby.element}
      {toast ? <AdminToast key={toast.key} tone={toast.tone} title={toast.title} message={toast.message} onClose={toast.close} /> : null}
    </section>
  )
}
