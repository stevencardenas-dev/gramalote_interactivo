import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminSection from '../components/admin/AdminSection.jsx'
import { useAdminToast } from '../lib/useAdminToast.jsx'
import CoordinateInput from '../components/admin/CoordinateInput.jsx'
import { focusLatitude, useNearbyCheck } from '../components/admin/NearbyCheck.jsx'
import AuditTimeline from '../components/admin/AuditTimeline.jsx'
import { MAP_ICONS, mapIconUrl } from '../data/mapIcons.js'
import { apiRequest, ensureSession } from '../lib/auth.js'
import { useDialog } from '../lib/dialog.jsx'
import { useUnsavedChanges } from '../lib/useUnsavedChanges.js'
import AdminImageCard from '../components/admin/AdminImageCard.jsx'
import ImageFraming from '../components/admin/ImageFraming.jsx'
import { framesForExtraImage, framesForHeritageImage } from '../lib/photoFrames.js'
import { IMAGE_ACCEPT, IMAGE_RULES, checkImageFiles } from '../lib/imageUpload.js'
import { PHOTO_NOTICE } from '../lib/photoMessages.js'
import { useImageDrafts } from '../lib/useImageDrafts.js'

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
  cover: 'Sale en la lista, el mapa y, si no hay carrusel, junto al texto de la ficha. Solo una.',
  gallery: 'Fotos complementarias. Se muestran en la cuadrícula de la ficha con su pie de foto y crédito.',
  historic: 'Forma el carrusel de la ficha (no incluye la portada; súbela también aquí si la quieres en él).',
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
          { key: 'latitude', label: 'Latitud', type: 'coordinate', coordinate: 'lat', required: true },
          { key: 'longitude', label: 'Longitud', type: 'coordinate', coordinate: 'lng', required: true },
          { key: 'mapsUrl', label: 'Enlace de Google Maps', max: 500, wide: true },
          { key: 'mapIcon', label: 'Icono del mapa', type: 'icon' },
          { key: 'slug', label: 'Enlace (slug)', max: 160, help: 'Cambiarlo cambia la dirección pública de la ficha.' },
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
          { key: 'latitude', label: 'Latitud', type: 'coordinate', coordinate: 'lat', required: true },
          { key: 'longitude', label: 'Longitud', type: 'coordinate', coordinate: 'lng', required: true },
          { key: 'mapsUrl', label: 'Enlace de Google Maps', max: 500, wide: true },
          { key: 'mapIcon', label: 'Icono del mapa', type: 'icon' },
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

function Field({ spec, value, onChange, onPair }) {
  const common = { required: spec.required, maxLength: spec.max }

  if (spec.type === 'checkbox') {
    return (
      <label className={`admin-field admin-field--check${spec.wide ? ' admin-field--wide' : ''}`}>
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
  } else if (spec.type === 'coordinate') {
    control = <CoordinateInput data-field={spec.key} kind={spec.coordinate} onPair={onPair} value={value} onChange={onChange} required={spec.required} />
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
    <label className={`admin-field${spec.wide ? ' admin-field--wide' : ''}`}>
      <span>{spec.label}</span>
      {control}
      {spec.help ? <small className="admin-hint">{spec.help}</small> : null}
    </label>
  )
}

const ALT_SUGGESTED = 125

// Campo de texto alternativo con contador y guía (WCAG 1.1.1). La portada lo necesita
// para publicar la ficha, por eso se marca como pendiente cuando está vacío.
function AltTextField({ value, onChange, required = false }) {
  const text = value ?? ''
  const missing = required && !text.trim()
  const prefixed = /^\s*(foto|imagen|fotograf[ií]a)\s+de\b/i.test(text)
  const long = text.length > ALT_SUGGESTED
  return (
    <label className="admin-field admin-field--wide">
      <span>Texto alternativo (describe la foto)</span>
      <input
        value={text}
        onChange={onChange}
        maxLength={255}
        aria-invalid={missing || undefined}
        placeholder="Torre de la iglesia de Gramalote Viejo al atardecer"
      />
      <small className={`admin-hint${missing || prefixed || long ? ' admin-hint--error' : ''}`}>
        {missing
          ? 'La portada necesita este texto para publicar la ficha. '
          : 'Describe lo que se ve, para quien no puede verlo. '}
        {prefixed ? 'No empieces con «Foto de»: el lector ya anuncia que es una imagen. ' : ''}
        {text.length} / {ALT_SUGGESTED} recomendados
      </small>
    </label>
  )
}

// Tarjeta de foto de Patrimonio: miniatura a un lado y campos con etiqueta.
function PlaceImageCard({ image, index, total, roles, busy, frames = [], onSave, onRemove, onMove, onReplace, onDraftChange }) {
  const fileInput = useRef(null)
  const [framing, setFraming] = useState(false)
  const [draft, setDraft] = useState({ role: image.role, eraLabel: image.eraLabel ?? '', altText: image.altText, caption: image.caption, credit: image.credit })
  const dirty =
    draft.role !== image.role ||
    draft.eraLabel !== (image.eraLabel ?? '') ||
    draft.altText !== image.altText ||
    draft.caption !== image.caption ||
    draft.credit !== image.credit
  const set = (key) => (event) => setDraft((current) => ({ ...current, [key]: event.target.value }))

  useEffect(() => {
    onDraftChange(image.id, dirty)
  }, [dirty, image.id, onDraftChange])
  useEffect(() => () => onDraftChange(image.id, false), [image.id, onDraftChange])

  return (
    <li className="place-img">
      <div className="place-img__thumb">
        {frames.length > 0 ? (
          <button type="button" className="admin-frame-btn" aria-label="Ajustar el encuadre de la foto" onClick={() => setFraming(true)}>
            <img src={image.url} alt="" loading="lazy" data-no-crop="" />
            <span className="admin-frame-btn__hint">Encuadre</span>
          </button>
        ) : (
          <img src={image.url} alt="" loading="lazy" />
        )}
        <span className={`place-img__role place-img__role--${image.role}`}>{ROLE_LABELS[image.role] ?? 'Portada'}</span>
      </div>
      <div className="place-img__body">
        <div className="admin-grid">
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
          <AltTextField value={draft.altText} onChange={set('altText')} required={draft.role === 'cover'} />
          <label className="admin-field">
            <span>Pie de foto (se ve sobre la foto)</span>
            <input value={draft.caption} onChange={set('caption')} maxLength={120} placeholder="Templo en 1950" />
          </label>
          <label className="admin-field">
            <span>Crédito o fuente</span>
            <input value={draft.credit} onChange={set('credit')} maxLength={255} />
          </label>
        </div>
        <div className="place-img__actions">
          <button type="button" className="admin-btn admin-btn--primary" disabled={!dirty || busy} onClick={() => onSave(image, draft)}>
            Guardar foto
          </button>
          <button type="button" className="admin-btn" disabled={index === 0 || busy} onClick={() => onMove(index, -1)} aria-label="Subir">
            ↑
          </button>
          <button type="button" className="admin-btn" disabled={index === total - 1 || busy} onClick={() => onMove(index, 1)} aria-label="Bajar">
            ↓
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_ACCEPT}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) onReplace(image, file)
            }}
          />
          <button type="button" className="admin-btn" disabled={busy} onClick={() => fileInput.current?.click()}>
            Cambiar foto
          </button>
          <button type="button" className="admin-btn admin-btn--danger-outline" disabled={busy} onClick={() => onRemove(image)}>
            Quitar
          </button>
        </div>
      </div>
      {framing ? <ImageFraming image={{ url: image.url, alt: image.altText }} frames={frames} onClose={() => setFraming(false)} /> : null}
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
  const { notify, toast } = useAdminToast()
  const [upload, setUpload] = useState(() => ({
    // Vacío = automático: la primera foto de un patrimonio es la portada (sin ella
    // no aparece en tarjetas ni en el mapa); las siguientes, galería.
    role: kindKey === 'extras' ? 'cover' : '',
    eraLabel: '',
    altText: '',
    caption: '',
    credit: '',
  }))


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
  const imageDrafts = useImageDrafts()
  const { allowLeave } = useUnsavedChanges(dirty || imageDrafts.anyDirty)
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
      const detail = await apiRequest(`${kind.api}/${id}`, { method: 'PATCH', body: { ...pickFields(kind, form), updatedAt: form.updatedAt } })
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
    setForm((current) => ({ ...current, images: detail.images, audit: detail.audit }))
  }

  async function uploadImage(event) {
    event.preventDefault()
    const file = fileInput.current?.files?.[0]
    if (!file) {
      setError('Elige una foto para subir.')
      return
    }
    const problem = checkImageFiles([file])
    if (problem) {
      setError(problem)
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
      notify('ok', ...PHOTO_NOTICE.uploaded())
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
      notify('ok', ...PHOTO_NOTICE.updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyImage(false)
    }
  }

  // Cambia el archivo de una foto y conserva su uso, orden y textos.
  async function replaceImage(image, file) {
    const problem = checkImageFiles([file])
    if (problem) {
      setError(problem)
      return
    }
    setBusyImage(true)
    setError('')
    try {
      const data = new FormData()
      data.append('file', file)
      applyImages(await apiRequest(`${kind.api}/${id}/images/${image.id}/file`, { method: 'PUT', formData: data }))
      notify('ok', ...PHOTO_NOTICE.replaced)
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

  // En Extras la confirmación la pide la tarjeta (AdminImageCard); en Patrimonio, esta función.
  async function confirmRemoveImage(image) {
    const ok = await confirm({
      title: '¿Quitar esta foto de la ficha?',
      message: 'Dejará de verse en el sitio.',
      confirmLabel: 'Quitar foto',
      danger: true,
    })
    if (ok) await removeImage(image)
  }

  async function removeImage(image) {
    setBusyImage(true)
    try {
      applyImages(await apiRequest(`${kind.api}/${id}/images/${image.id}`, { method: 'DELETE' }))
      notify('ok', ...PHOTO_NOTICE.removed)
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
      allowLeave()
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
      const detail = await apiRequest(`${kind.api}/${id}`, { method: 'PATCH', body: { ...patch, updatedAt: form.updatedAt } })
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
                      <Field
                        key={spec.key}
                        spec={spec}
                        value={form[spec.key]}
                        onChange={set(spec.key)}
                        onPair={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))}
                      />
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
                  Los extras llevan una sola foto: la portada. Usa «Cambiar foto» para sustituirla.
                </p>
              ) : (
                <AdminSection title="Subir una foto" hint={kindKey === 'extras' ? 'Elige el archivo: será la foto de su tarjeta en el mapa.' : 'Elige el archivo y dile a la ficha para qué sirve.'} defaultOpen>
                  <div className="admin-grid">
                    <label className="admin-field admin-field--wide">
                      <span>Archivo ({IMAGE_RULES.replace(/.$/, '')})</span>
                      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} />
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
                        <AltTextField
                          value={upload.altText}
                          onChange={(event) => setUpload({ ...upload, altText: event.target.value })}
                          required={uploadRole === 'cover'}
                        />
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
                <ul className={kindKey === 'extras' ? 'admin-media__grid' : 'place-img-list'}>
                  {form.images.map((image, index) =>
                    kindKey === 'extras' ? (
                      <AdminImageCard
                        key={image.id}
                        image={image}
                        index={index}
                        total={form.images.length}
                        single
                        frames={framesForExtraImage()}
                        busy={busyImage}
                        onReplace={replaceImage}
                        onRemove={removeImage}
                      />
                    ) : (
                      <PlaceImageCard
                        key={`${image.id}-${image.role}-${image.eraLabel}-${image.altText}-${image.caption}-${image.credit}`}
                        image={image}
                        index={index}
                        total={form.images.length}
                        roles={roles}
                        frames={framesForHeritageImage({
                          role: image.role,
                          hasCarousel: form.images.some((entry) => entry.role === 'historic'),
                        })}
                        busy={busyImage}
                        onSave={saveImage}
                        onReplace={replaceImage}
                        onRemove={confirmRemoveImage}
                        onMove={moveImage}
                        onDraftChange={imageDrafts.report}
                      />
                    ),
                  )}
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
      {toast}
    </section>
  )
}
