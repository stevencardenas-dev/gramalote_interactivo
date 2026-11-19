import { useId, useMemo, useState } from 'react'

// Historial legible de una ficha: qué se hizo, quién, cuándo y qué cambió
// exactamente (campo, valor anterior y valor nuevo), agrupado por día.

const PAGE = 8

const FIELD_LABELS = {
  name: 'Nombre',
  slug: 'Enlace (slug)',
  category_id: 'Categoría',
  type_id: 'Tipo',
  zone_id: 'Zona',
  location_detail: 'Ubicación',
  summary: 'Resumen',
  description: 'Descripción',
  address: 'Dirección',
  latitude: 'Latitud',
  longitude: 'Longitud',
  map_icon: 'Icono del mapa',
  maps_url: 'Enlace de Google Maps',
  phone: 'Teléfono',
  phone_secondary: 'Teléfono secundario',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  website: 'Sitio web',
  hours_text: 'Horario (texto)',
  hours_display: 'Vista del horario',
  checkin_text: 'Check-in',
  price_text: 'Rango de precio',
  price_min_cop: 'Precio mínimo',
  price_max_cop: 'Precio máximo',
  is_featured: 'Destacada',
  sort_order: 'Orden',
  is_published: 'Publicación',
  category: 'Categoría',
  zone: 'Zona',
  zone_key: 'Zona de la ficha',
  zone_tag: 'Etiqueta de zona',
  ficha_category: 'Categoría en la ficha',
  status: 'Estado',
  subtitle: 'Subtítulo',
  intro: 'Frase introductoria',
  visit_location: 'Ubicación (visita)',
  visit_access: 'Acceso',
  visit_recommendation: 'Recomendación',
  historical_period: 'Época',
  sources: 'Fuentes consultadas',
  coords_approx: 'Ubicación aproximada',
  show_on_map: 'Se ve en el mapa',
  matrix_ref: 'Referencia de la matriz',
}

const LIST_LABELS = {
  features: 'Tarjetas destacadas',
  products: 'Productos',
  services: 'Servicios',
  payments: 'Medios de pago',
  social: 'Redes sociales',
  hours: 'Horario por día',
  exceptions: 'Excepciones de horario',
  related: 'Fichas relacionadas',
}

const ROLE_LABELS = { cover: 'portada', hero: 'encabezado', gallery: 'galería', logo: 'logo' }

// tone: color de la paleta (mismo orden que las bandas del panel).
const ACTIONS = {
  create: { tone: 'green', icon: 'plus', title: 'Creó la ficha' },
  update: { tone: 'navy', icon: 'edit', title: 'Editó la ficha' },
  publish: { tone: 'green', icon: 'eye', title: 'Publicó la ficha' },
  unpublish: { tone: 'gold', icon: 'eyeoff', title: 'Despublicó la ficha' },
  delete: { tone: 'brick', icon: 'trash', title: 'Eliminó la ficha' },
  upload_media: { tone: 'coral', icon: 'image', title: 'Subió una imagen' },
  link_media: { tone: 'coral', icon: 'image', title: 'Agregó una foto a la ficha' },
  unlink_media: { tone: 'gold', icon: 'image', title: 'Quitó una foto de la ficha' },
  update_media: { tone: 'coral', icon: 'image', title: 'Editó una foto' },
  delete_media: { tone: 'brick', icon: 'trash', title: 'Eliminó una imagen' },
  reorder_media: { tone: 'coral', icon: 'image', title: 'Reordenó las fotos' },
}

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4l10-10-4-4L4 16v4zM13.5 6.5l4 4',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeoff: 'M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.500 4.200 9.500 6a12.600 12.600 0 0 1-2.600 3.100M6.500 7.500A12.600 12.600 0 0 0 2.500 12C3.500 13.800 7 18 12 18c1.500 0 2.800-.4 4-.9',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  image: 'M4 5h16v14H4zM4 16l4.500-4.500 3.500 3.500 3-3L20 17',
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.edit} />
    </svg>
  )
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function dayLabel(date) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(date) === dayKey(today)) return 'Hoy'
  if (dayKey(date) === dayKey(yesterday)) return 'Ayer'
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function timeLabel(date) {
  return date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}

const SHORT = 90

function Entry({ entry, formatValue, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()
  const timeValid = !Number.isNaN(entry.date.getTime())
  const total = entry.fields.length + entry.lists.length
  const names = [
    ...entry.fields.map((field) => FIELD_LABELS[field.column]),
    ...entry.lists.map((list) => LIST_LABELS[list.group]),
  ]
  const preview =
    total > 0
      ? `${total} ${total === 1 ? 'cambio' : 'cambios'}: ${names.slice(0, 3).join(', ')}${names.length > 3 ? ` y ${names.length - 3} más` : ''}`
      : (entry.detail ??
        (entry.action === 'update'
          ? 'Guardó la ficha sin cambios en sus datos principales (por ejemplo, solo orden o fotos).'
          : ''))
  const expandable = total > 0

  const head = (
    <>
      <span className={`audit__icon audit__icon--${entry.meta.tone}`}>
        <Icon name={entry.meta.icon} />
      </span>
      <span className="audit__text">
        <strong>{entry.meta.title}</strong>
        <small>{preview}</small>
      </span>
      <span className="audit__rt">
        <strong>{timeValid ? timeLabel(entry.date) : ''}</strong>
        <small>{entry.userName ?? 'Sistema'}</small>
      </span>
      {expandable ? <span className="audit__chevron" aria-hidden="true" /> : null}
    </>
  )

  return (
    <li className={`audit__ev${open && expandable ? ' is-open' : ''}`}>
      {expandable ? (
        <button type="button" className="audit__hd" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((value) => !value)}>
          {head}
        </button>
      ) : (
        <div className="audit__hd audit__hd--flat">{head}</div>
      )}

      {expandable && open ? (
        <dl className="audit__grid" id={bodyId}>
          {entry.fields.map((field) => {
            const before = formatValue(field.column, field.from)
            const after = formatValue(field.column, field.to)
            const long = (before?.length ?? 0) > SHORT || (after?.length ?? 0) > SHORT
            return (
              <div key={field.column} className={`audit__cell${long ? ' audit__cell--wide' : ''}`}>
                <dt>{FIELD_LABELS[field.column]}</dt>
                <dd>
                  <span className="audit__before">{before ?? 'vacío'}</span>
                  <span className="audit__arrow" aria-label="cambió a">→</span>
                  <span className="audit__after">{after ?? 'vacío'}</span>
                </dd>
              </div>
            )
          })}
          {entry.lists.map((list) => (
            <div key={list.group} className="audit__cell audit__cell--wide">
              <dt>{LIST_LABELS[list.group]}</dt>
              <dd className="audit__lists">
                {list.added.length > 0 ? (
                  <span className="audit__set">
                    <em>Agregó</em>
                    {list.added.map((item, index) => (
                      <span key={`${item}-${index}`} className="audit__after">
                        {item}
                      </span>
                    ))}
                  </span>
                ) : null}
                {list.removed.length > 0 ? (
                  <span className="audit__set">
                    <em>Quitó</em>
                    {list.removed.map((item, index) => (
                      <span key={`${item}-${index}`} className="audit__before">
                        {item}
                      </span>
                    ))}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  )
}

export default function AuditTimeline({ audit, lookups }) {
  const [page, setPage] = useState(0)

  function formatValue(column, value) {
    if (value === null || value === undefined || value === '') return null
    if (['is_featured', 'is_published', 'show_on_map', 'coords_approx'].includes(column)) return value ? 'Sí' : 'No'
    if (column === 'zone_key') return { caldereros: 'Caldereros', 'gramalote-viejo': 'Gramalote Viejo', 'nuevo-gramalote': 'Nuevo Gramalote' }[value] ?? String(value)
    if (column === 'category_id') return lookups.category(value) ?? `#${value}`
    if (column === 'type_id') return lookups.type(value) ?? `#${value}`
    if (column === 'zone_id') return lookups.zone(value) ?? `#${value}`
    if (column === 'price_min_cop' || column === 'price_max_cop') {
      const number = Number(value)
      return Number.isFinite(number) ? `$ ${number.toLocaleString('es-CO')}` : String(value)
    }
    return String(value)
  }

  const entries = useMemo(
    () =>
      audit.map((entry) => {
        const date = new Date(entry.createdAt)
        const meta = ACTIONS[entry.action] ?? { tone: 'navy', icon: 'edit', title: entry.action }
        const raw = entry.changes && typeof entry.changes === 'object' ? entry.changes : {}
        let fields = []
        let lists = []
        let detail = null

        if (entry.action === 'update') {
          fields = Object.entries(raw)
            .filter(([column]) => FIELD_LABELS[column])
            .map(([column, change]) => ({ column, from: change?.from ?? null, to: change?.to ?? null }))
          lists = Object.entries(raw)
            .filter(([key]) => key.startsWith('list:') && LIST_LABELS[key.slice(5)])
            .map(([key, change]) => ({
              group: key.slice(5),
              added: Array.isArray(change?.added) ? change.added : [],
              removed: Array.isArray(change?.removed) ? change.removed : [],
            }))
        } else if (entry.action === 'create') {
          detail = raw.name ? `Con el nombre «${raw.name}».` : null
        } else if (typeof raw.note === 'string') {
          detail = raw.note
        } else if (entry.action === 'link_media' || entry.action === 'reorder_media') {
          detail = raw.role ? `Rol: ${ROLE_LABELS[raw.role] ?? raw.role}.` : null
        } else if (entry.action === 'update_media') {
          detail = raw.altText ? `Nuevo texto alternativo: «${raw.altText}».` : 'Texto alternativo vaciado.'
        }

        return { ...entry, date, meta, fields, lists, detail }
      }),
    [audit],
  )

  const visible = entries.slice(page * PAGE, (page + 1) * PAGE)
  const groups = []
  visible.forEach((entry) => {
    const valid = !Number.isNaN(entry.date.getTime())
    const key = valid ? dayKey(entry.date) : 'sin-fecha'
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(entry)
    else groups.push({ key, label: valid ? dayLabel(entry.date) : 'Sin fecha', items: [entry] })
  })

  return (
    <div className="audit">
      {groups.map((group) => (
        <section key={group.key} className="audit__day">
          <h3>{group.label}</h3>
          <ul>
            {group.items.map((entry) => (
              <Entry key={entry.id} entry={entry} formatValue={formatValue} defaultOpen={page === 0 && entry.id === entries[0]?.id} />
            ))}
          </ul>
        </section>
      ))}

      {entries.length > PAGE ? (
        <div className="admin-pager">
          <button type="button" className="admin-btn" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            ← Anterior
          </button>
          <span>
            Página {page + 1} de {Math.ceil(entries.length / PAGE)}
          </span>
          <button
            type="button"
            className="admin-btn"
            disabled={(page + 1) * PAGE >= entries.length}
            onClick={() => setPage((value) => value + 1)}
          >
            Siguiente →
          </button>
        </div>
      ) : null}
    </div>
  )
}
