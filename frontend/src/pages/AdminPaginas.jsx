import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminSection from '../components/admin/AdminSection.jsx'
import AdminToast from '../components/admin/AdminToast.jsx'
import AdminNavSelect from '../components/admin/AdminNavSelect.jsx'
import ImagePicker from '../components/admin/ImagePicker.jsx'
import {
  CAROUSEL_LIMITS,
  PAGE_DEFAULTS,
  PAGE_LINKS,
  RELATED_COUNT,
  SOCIAL_NETWORKS,
  isSocialUrl,
  isWebUrl,
  whatsappUrl,
} from '../data/pages.js'
import BannerCarousel from '../components/home/BannerCarousel.jsx'
import { intervalSeconds, timingSeconds, todayKey, visibleSlides } from '../lib/carousel.js'
import SocialIcon from '../components/ui/SocialIcon.jsx'
import { apiRequest, ensureSession } from '../lib/auth.js'
import { useDialog } from '../lib/dialog.jsx'
import { orderBySlugs } from '../lib/contentApi.js'
import { mergeContent } from '../lib/pageContent.js'

// Páginas «estáticas» del sitio: Inicio (y su carrusel de eventos), Qué hacer,
// Dónde ir (con sus tres subpáginas) y las redes sociales. Cada página se guarda entera en site_settings («page:<clave>»);
// lo que no se toca conserva el diseño original (data/pages.js).

const TABS = [
  { key: 'inicio', label: 'Inicio', pages: ['inicio'] },
  { key: 'carrusel', label: 'Carrusel', pages: ['carrusel'] },
  { key: 'que-hacer', label: 'Qué hacer', pages: ['que-hacer'] },
  { key: 'donde-ir', label: 'Dónde ir', pages: ['donde-ir', 'donde-comer', 'donde-dormir', 'donde-comprar'] },
  { key: 'redes', label: 'Redes sociales', pages: ['redes'] },
]

const PAGE_INFO = {
  inicio: { label: 'Inicio', path: '/' },
  'que-hacer': { label: 'Qué hacer', path: '/que-hacer' },
  'donde-ir': { label: 'Dónde ir', path: '/donde-ir' },
  'donde-comer': { label: 'Dónde comer', path: '/donde-comer' },
  'donde-dormir': { label: 'Dónde dormir', path: '/donde-dormir' },
  'donde-comprar': { label: 'Dónde comprar', path: '/donde-comprar' },
  redes: { label: 'Redes sociales', path: '/' },
  carrusel: { label: 'Carrusel de eventos', path: '/' },
}

// Redes en el orden guardado; las que aún no estaban guardadas, al final.
function socialRows(list) {
  const known = (list ?? []).filter((item) => SOCIAL_NETWORKS.some((network) => network.id === item.id))
  const missing = SOCIAL_NETWORKS.filter((network) => !known.some((item) => item.id === network.id)).map(
    (network) => ({ id: network.id, url: '', enabled: false }),
  )
  return [...known, ...missing]
}

function invalidSocial(draft) {
  return socialRows(draft?.social)
    .filter((item) => item.enabled && !isSocialUrl(item.url))
    .map((item) => SOCIAL_NETWORKS.find((network) => network.id === item.id)?.label ?? item.id)
}

function invalidWhatsapp(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length > 0 && (digits.length < 10 || digits.length > 15)
}

const CATEGORY_OF_PAGE = { '/donde-comer': 'comer', '/donde-dormir': 'dormir', '/donde-comprar': 'comprar' }

const clone = (value) => JSON.parse(JSON.stringify(value))
const newId = () => `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

function move(list, index, delta) {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function MoveButtons({ index, length, onMove, label }) {
  return (
    <span className="admin-order__move">
      <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Subir ${label}`}>
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(index, 1)}
        disabled={index === length - 1}
        aria-label={`Bajar ${label}`}
      >
        ↓
      </button>
    </span>
  )
}

// Miniatura con botón para abrir el selector.
function ImageField({ label, photo, caption, onOpen, compact = false }) {
  return (
    <div className={`admin-imgfield${compact ? ' admin-imgfield--compact' : ''}`}>
      <button type="button" className="admin-imgfield__shot" onClick={onOpen} aria-label={`Cambiar imagen: ${label}`}>
        {photo ? <img src={photo} alt="" loading="lazy" /> : <span className="admin-imgfield__empty" aria-hidden="true" />}
        <span className="admin-imgfield__cta">Cambiar</span>
      </button>
      <span className="admin-imgfield__label">
        <strong>{label}</strong>
        {caption ? <small>{caption}</small> : null}
      </span>
    </div>
  )
}

// Grupos de fotos para el selector a partir de las fuentes de la API.
function useGroups(sources) {
  return useMemo(() => {
    const experiences = (sources?.experiences ?? []).map((item) => ({
      key: `x-${item.slug}`,
      label: item.title,
      note: item.published ? 'Experiencia' : 'Experiencia · no publicada',
      from: item.title,
      images: item.images,
    }))
    const establishments = (sources?.establishments ?? []).map((item) => ({
      key: `e-${item.slug}`,
      label: item.name,
      note: item.published ? item.category : `${item.category} · no publicada`,
      from: item.name,
      category: item.category,
      images: item.images,
    }))
    const uploads = {
      key: 'uploads',
      label: 'Subidas para páginas',
      from: null,
      images: sources?.uploads ?? [],
    }
    const bySlug = new Map([
      ...experiences.map((group, index) => [`experience:${sources.experiences[index].slug}`, group]),
      ...establishments.map((group, index) => [`establishment:${sources.establishments[index].slug}`, group]),
    ])
    return { experiences, establishments, uploads, bySlug }
  }, [sources])
}

function itemPhoto(item, covers) {
  return covers?.[item.slug] || item.images?.[0]?.url || null
}

function StatusBadge({ published }) {
  return published ? null : <span className="admin-badge admin-badge--draft">No publicada</span>
}

// Lista completa de una categoría (o de las experiencias) para ordenar y elegir
// la foto de la tarjeta.
function OrderList({ items, order, covers, onOrder, onCover, kind }) {
  const ordered = orderBySlugs(items, order ?? [])
  const slugs = ordered.map((item) => item.slug)
  if (ordered.length === 0) return <p className="empty">No hay fichas en esta categoría.</p>

  return (
    <ol className="admin-order">
      {ordered.map((item, index) => {
        const name = item.title ?? item.name
        const custom = Boolean(covers?.[item.slug])
        return (
          <li key={item.slug} className={`admin-order__item${item.published ? '' : ' is-off'}`}>
            <span className="admin-order__pos">{index + 1}</span>
            <MoveButtons
              index={index}
              length={ordered.length}
              label={name}
              onMove={(from, delta) => onOrder(move(slugs, from, delta))}
            />
            <span className="admin-row-item__thumb">
              {itemPhoto(item, covers) ? <img src={itemPhoto(item, covers)} alt="" loading="lazy" /> : <span />}
            </span>
            <span className="admin-order__main">
              <strong>{name}</strong>
              <small>
                {custom ? 'Portada elegida para esta página' : 'Portada de la ficha'}
                {' · '}
                {item.images.length} {item.images.length === 1 ? 'foto' : 'fotos'}
              </small>
            </span>
            <StatusBadge published={item.published} />
            <span className="admin-order__actions">
              <button type="button" className="admin-btn" onClick={() => onCover(item)}>
                Cambiar portada
              </button>
              <Link
                className="admin-btn"
                to={
                  kind === 'experience'
                    ? `/admin/lugares/experiencias/${item.id}`
                    : `/admin/lugares/establecimientos/${item.id}`
                }
              >
                Ficha
              </Link>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// Bloque de referencias a otra página: N fichas elegidas, con orden y foto.
function RelatedEditor({ block, onChange, pool, count, onCover }) {
  const chosen = (block.items ?? [])
    .map((slug) => pool.find((item) => item.slug === slug))
    .filter(Boolean)
  const available = pool.filter((item) => item.published && !chosen.includes(item))
  const slugs = chosen.map((item) => item.slug)

  return (
    <div className="admin-related">
      <ol className="admin-order">
        {chosen.map((item, index) => (
          <li key={item.slug} className={`admin-order__item${item.published ? '' : ' is-off'}`}>
            <span className="admin-order__pos">{index + 1}</span>
            <MoveButtons
              index={index}
              length={chosen.length}
              label={item.name}
              onMove={(from, delta) => onChange({ ...block, items: move(slugs, from, delta) })}
            />
            <span className="admin-row-item__thumb">
              {itemPhoto(item, block.covers) ? <img src={itemPhoto(item, block.covers)} alt="" loading="lazy" /> : <span />}
            </span>
            <span className="admin-order__main">
              <strong>{item.name}</strong>
              <small>{block.covers?.[item.slug] ? 'Foto elegida de su galería' : 'Portada de la ficha'}</small>
            </span>
            <StatusBadge published={item.published} />
            <span className="admin-order__actions">
              <button type="button" className="admin-btn" onClick={() => onCover(item)}>
                Cambiar foto
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger-outline"
                onClick={() => onChange({ ...block, items: slugs.filter((slug) => slug !== item.slug) })}
              >
                Quitar
              </button>
            </span>
          </li>
        ))}
      </ol>
      {chosen.length < count ? (
        <div className="admin-related__add">
          <select
            value=""
            aria-label="Añadir ficha"
            onChange={(event) => event.target.value && onChange({ ...block, items: [...slugs, event.target.value] })}
          >
            <option value="">+ Añadir ficha ({chosen.length} de {count})</option>
            {available.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className="note">
        Se muestran {count}. Si una de las elegidas se despublica, su lugar lo ocupa otra ficha de la misma
        categoría.
      </p>
    </div>
  )
}

function LinkField({ link, onChange, sources, allowPage = true, hideKind = false }) {
  const kind = link?.kind ?? 'page'
  const options =
    kind === 'experience'
      ? (sources?.experiences ?? []).map((item) => ({ value: item.slug, label: item.title, published: item.published }))
      : kind === 'establishment'
        ? (sources?.establishments ?? []).map((item) => ({ value: item.slug, label: `${item.name} · ${item.category}`, published: item.published }))
        : PAGE_LINKS.map((item) => ({ value: item.path, label: item.label, published: true }))
  const value = kind === 'page' ? link?.path ?? '' : link?.slug ?? ''
  const selected = options.find((option) => option.value === value)

  return (
    <div className={hideKind ? undefined : 'admin-linkfield'}>
      {hideKind ? null : (
      <Field label="Enlaza a">
        <select
          value={kind}
          onChange={(event) => {
            const next = event.target.value
            onChange(next === 'page' ? { kind: 'page', path: PAGE_LINKS[0].path } : { kind: next, slug: '' })
          }}
        >
          <option value="experience">Una experiencia</option>
          <option value="establishment">Un establecimiento</option>
          {allowPage ? <option value="page">Una sección general (Dónde comer, Dónde comprar…)</option> : null}
        </select>
      </Field>
      )}
      <Field
        label={kind === 'page' ? 'Sección' : 'Ficha'}
        hint={selected && !selected.published ? 'No publicada: la tarjeta no se mostrará hasta publicarla.' : undefined}
      >
        <select
          value={value}
          onChange={(event) =>
            onChange(kind === 'page' ? { kind, path: event.target.value } : { kind, slug: event.target.value })
          }
        >
          {kind !== 'page' ? <option value="">Elige una ficha…</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
              {option.published ? '' : ' (no publicada)'}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

// ---------------------------------------------------------------- Inicio
function InicioEditor({ draft, update, sources, groups, openPicker, signal }) {
  const defaults = PAGE_DEFAULTS.inicio
  const allGroups = [groups.uploads, ...groups.experiences, ...groups.establishments]

  // Para una tarjeta que enlaza a una ficha, su galería va primero.
  const groupsFor = (link) => {
    if (link?.kind === 'experience' || link?.kind === 'establishment') {
      const own = groups.bySlug.get(`${link.kind}:${link.slug}`)
      return own ? [own, ...allGroups.filter((group) => group !== own)] : allGroups
    }
    const category = CATEGORY_OF_PAGE[link?.path]
    if (category) {
      const mine = groups.establishments.filter((group) => group.category === category)
      return [groups.uploads, ...mine, ...allGroups.filter((group) => group !== groups.uploads && !mine.includes(group))]
    }
    return allGroups
  }

  const defaultPhoto = (list, id) => defaults[list].find((item) => item.id === id)?.photo

  const pickFor = (list, index, title) => {
    const item = draft[list][index]
    openPicker({
      title,
      groups: groupsFor(item.link),
      current: item.photo,
      defaultPhoto: defaultPhoto(list, item.id),
      onPick: ({ url }) =>
        update((page) => {
          page[list][index].photo = url
        }),
    })
  }

  const setCard = (list, index, patch) =>
    update((page) => {
      Object.assign(page[list][index], patch)
    })

  const moveCard = (list) => (index, delta) =>
    update((page) => {
      page[list] = move(page[list], index, delta)
    })

  return (
    <>
      <AdminSection signal={signal} title="Accede rápido" hint="Las cinco secciones son fijas; aquí cambia su imagen.">
        <div className="admin-imggrid">
          {draft.quickAccess.map((item, index) => (
            <ImageField
              key={item.id}
              label={item.label}
              caption={item.to}
              photo={item.photo}
              onOpen={() => pickFor('quickAccess', index, `Imagen de «${item.label}»`)}
            />
          ))}
        </div>
      </AdminSection>

      <AdminSection
        signal={signal}
        title="Experiencias que no olvidarás"
        hint="Tres tarjetas: la primera es la grande. Imagen, orden, título, texto y enlace."
      >
        <div className="admin-pcards">
          {draft.experiences.map((card, index) => (
            <article key={card.id} className="admin-pcard">
              <header className="admin-pcard__head">
                <span className="admin-order__pos">{index + 1}</span>
                <strong>{index === 0 ? 'Tarjeta destacada' : `Tarjeta ${index + 1}`}</strong>
                <MoveButtons
                  index={index}
                  length={draft.experiences.length}
                  label={card.title}
                  onMove={moveCard('experiences')}
                />
              </header>
              <div className="admin-pcard__body">
                <ImageField
                  label="Imagen"
                  photo={card.photo}
                  onOpen={() => pickFor('experiences', index, `Imagen de «${card.title}»`)}
                />
                <div className="admin-grid">
                  <Field label="Título">
                    <input
                      value={card.title}
                      maxLength={120}
                      onChange={(event) => setCard('experiences', index, { title: event.target.value })}
                    />
                  </Field>
                  <Field label="Texto">
                    <textarea
                      rows={3}
                      value={card.text}
                      maxLength={300}
                      onChange={(event) => setCard('experiences', index, { text: event.target.value })}
                    />
                  </Field>
                </div>
                <LinkField
                  link={card.link}
                  sources={sources}
                  onChange={(link) => setCard('experiences', index, { link })}
                />
              </div>
            </article>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        signal={signal}
        title="Descubre establecimientos disponibles para tu visita"
        hint="Tarjetas del bloque «Abierto hoy en Gramalote»: orden, título, fondo y la ficha a la que llevan."
      >
        <div className="admin-pcards admin-pcards--compact">
          {draft.highlights.map((card, index) => (
            <article key={card.id} className="admin-pcard">
              <header className="admin-pcard__head">
                <span className="admin-order__pos">{index + 1}</span>
                <strong>{card.title || 'Nueva tarjeta'}</strong>
                <MoveButtons
                  index={index}
                  length={draft.highlights.length}
                  label={card.title}
                  onMove={moveCard('highlights')}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--danger-outline"
                  onClick={() =>
                    update((page) => {
                      page.highlights.splice(index, 1)
                    })
                  }
                >
                  Quitar
                </button>
              </header>
              <div className="admin-pcard__body">
                <ImageField
                  label="Fondo"
                  photo={card.photo}
                  compact
                  onOpen={() => pickFor('highlights', index, `Fondo de «${card.title}»`)}
                />
                <div className="admin-grid">
                  <Field label="Título">
                    <input
                      value={card.title}
                      maxLength={120}
                      onChange={(event) => setCard('highlights', index, { title: event.target.value })}
                    />
                  </Field>
                </div>
                <LinkField
                  link={card.link}
                  sources={sources}
                  allowPage={false}
                  onChange={(link) => setCard('highlights', index, { link })}
                />
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="admin-btn"
          onClick={() =>
            update((page) => {
              page.highlights.push({ id: newId(), title: '', photo: null, link: { kind: 'establishment', slug: '' } })
            })
          }
        >
          + Tarjeta
        </button>
      </AdminSection>
    </>
  )
}

// ---------------------------------------------------------------- Qué hacer
function QueHacerEditor({ draft, update, sources, groups, openPicker, signal }) {
  const experiences = sources?.experiences ?? []

  return (
    <AdminSection
      signal={signal}
      title="Experiencias"
      hint="Orden de las tarjetas en «Qué hacer» y la portada de cada una (de su galería)."
    >
      <OrderList
        kind="experience"
        items={experiences}
        order={draft.order.length ? draft.order : experiences.map((item) => item.slug)}
        covers={draft.covers}
        onOrder={(order) =>
          update((page) => {
            page.order = order
          })
        }
        onCover={(item) =>
          openPicker({
            title: `Portada de «${item.title}» en Qué hacer`,
            hint: 'Fotos de la galería de la experiencia. No cambia la portada de su ficha.',
            groups: [groups.bySlug.get(`experience:${item.slug}`)].filter(Boolean),
            current: itemPhoto(item, draft.covers),
            resetLabel: 'Usar la portada de la ficha',
            noUpload: true,
            onReset: () =>
              update((page) => {
                delete page.covers[item.slug]
              }),
            onPick: ({ url }) =>
              update((page) => {
                page.covers[item.slug] = url
              }),
          })
        }
      />
      <p className="note">
        Las experiencias no publicadas no salen en el sitio; su lugar se guarda para cuando se publiquen. Las
        tarjetas se acomodan solas para que ninguna quede sola en una esquina.
      </p>
    </AdminSection>
  )
}

// ---------------------------------------------------------------- Dónde *
function TextBlock({ block, onChange, withText = true }) {
  return (
    <div className="admin-grid">
      <Field label="Antetítulo" hint="El texto pequeño sobre el título (opcional).">
        <input value={block.eyebrow ?? ''} maxLength={80} onChange={(event) => onChange({ eyebrow: event.target.value })} />
      </Field>
      <Field label="Título">
        <input value={block.title ?? ''} maxLength={120} onChange={(event) => onChange({ title: event.target.value })} />
      </Field>
      {withText ? (
        <Field label="Descripción">
          <textarea
            rows={3}
            value={block.text ?? ''}
            maxLength={400}
            onChange={(event) => onChange({ text: event.target.value })}
          />
        </Field>
      ) : null}
    </div>
  )
}

function CategoryEditor({ pageKey, draft, update, sources, groups, openPicker, signal }) {
  const pools = useMemo(() => {
    const byCategory = (category) => (sources?.establishments ?? []).filter((item) => item.category === category)
    return { comer: byCategory('comer'), dormir: byCategory('dormir'), comprar: byCategory('comprar') }
  }, [sources])
  const groupsOf = (category) => groups.establishments.filter((group) => group.category === category)

  const coverPicker = (item, path, label) =>
    openPicker({
      title: `${label} · ${item.name}`,
      hint: 'Fotos de la galería del establecimiento. No cambia la portada de su ficha.',
      groups: [groups.bySlug.get(`establishment:${item.slug}`)].filter(Boolean),
      current: itemPhoto(item, path(draft).covers),
      resetLabel: 'Usar la portada de la ficha',
      noUpload: true,
      onReset: () =>
        update((page) => {
          delete path(page).covers[item.slug]
        }),
      onPick: ({ url }) =>
        update((page) => {
          path(page).covers[item.slug] = url
        }),
    })

  const setBlock = (key) => (patch) =>
    update((page) => {
      Object.assign(page[key], patch)
    })

  // Fotos sueltas (collage): se eligen de las galerías de una categoría y se
  // guarda de qué establecimiento salen.
  const imagePicker = (list, index, category, title, defaults) =>
    openPicker({
      title,
      hint: 'Fotos de las galerías de los establecimientos de Dónde comer, agrupadas por establecimiento.',
      groups: [...groupsOf(category), groups.uploads],
      current: list(draft)[index].photo,
      defaultPhoto: defaults?.photo,
      onPick: ({ url, alt, from }) =>
        update((page) => {
          Object.assign(list(page)[index], { photo: url, alt: alt || list(page)[index].alt, from })
        }),
    })

  if (pageKey === 'donde-ir') {
    const defaults = PAGE_DEFAULTS['donde-ir']
    return (
      <>
        <AdminSection signal={signal} title="Dónde comer" hint="Texto y las tres fotos del collage.">
          <TextBlock block={draft.comer} onChange={setBlock('comer')} />
          <div className="admin-imggrid admin-imggrid--three">
            {draft.comer.images.map((image, index) => (
              <ImageField
                key={image.id ?? index}
                label={index === 0 ? 'Foto grande' : `Foto ${index + 1}`}
                caption={image.from ?? image.alt}
                photo={image.photo}
                onOpen={() =>
                  imagePicker((page) => page.comer.images, index, 'comer', 'Foto del collage de Dónde comer', defaults.comer.images[index])
                }
              />
            ))}
          </div>
        </AdminSection>
        <AdminSection signal={signal} title="Dónde dormir" hint="Título y los cuatro alojamientos, con su orden y foto.">
          <TextBlock block={draft.dormir} onChange={setBlock('dormir')} withText={false} />
          <RelatedEditor
            block={draft.dormir}
            pool={pools.dormir}
            count={RELATED_COUNT['donde-ir.dormir']}
            onChange={(block) =>
              update((page) => {
                page.dormir = block
              })
            }
            onCover={(item) => coverPicker(item, (page) => page.dormir, 'Foto en Dónde ir')}
          />
        </AdminSection>
        <AdminSection signal={signal} title="Dónde comprar" hint="Texto y los tres artesanos, con su orden y foto.">
          <TextBlock block={draft.comprar} onChange={setBlock('comprar')} />
          <RelatedEditor
            block={draft.comprar}
            pool={pools.comprar}
            count={RELATED_COUNT['donde-ir.comprar']}
            onChange={(block) =>
              update((page) => {
                page.comprar = block
              })
            }
            onCover={(item) => coverPicker(item, (page) => page.comprar, 'Foto en Dónde ir')}
          />
          <p className="note">El primero sale como tarjeta grande junto al texto.</p>
        </AdminSection>
      </>
    )
  }

  const category = pageKey.replace('donde-', '')
  const listLabel = { comer: 'Establecimientos', dormir: 'Alojamientos', comprar: 'Artesanos' }[category]
  const listing = (
    <AdminSection
      signal={signal}
      title={listLabel}
      hint={`Orden de las tarjetas en ${PAGE_INFO[pageKey].label} y la foto de cada una (de su galería).`}
    >
      <OrderList
        kind="establishment"
        items={pools[category]}
        order={draft.order}
        covers={draft.covers}
        onOrder={(order) =>
          update((page) => {
            page.order = order
          })
        }
        onCover={(item) => coverPicker(item, (page) => page, 'Foto de la tarjeta')}
      />
    </AdminSection>
  )

  if (pageKey === 'donde-comprar') {
    const defaults = PAGE_DEFAULTS['donde-comprar']
    return (
      <>
        {listing}
        <AdminSection
          signal={signal}
          title="Referencia a Dónde comer · Platos típicos"
          hint="Las tres fotos del bloque «Explora nuestros platos típicos», elegidas de los establecimientos de comida."
        >
          <div className="admin-imggrid admin-imggrid--three">
            {draft.platos.images.map((image, index) => (
              <ImageField
                key={image.id ?? index}
                label={index === 0 ? 'Foto grande' : `Foto ${index + 1}`}
                caption={image.from ? `De ${image.from}` : 'Foto del diseño'}
                photo={image.photo}
                onOpen={() =>
                  imagePicker((page) => page.platos.images, index, 'comer', 'Foto de platos típicos', defaults.platos.images[index])
                }
              />
            ))}
          </div>
        </AdminSection>
        <AdminSection
          signal={signal}
          title="Referencia al mapa interactivo"
          hint="Bloque «Encuentra dónde comer»: su botón lleva al mapa con los restaurantes."
        >
          <div className="admin-imggrid admin-imggrid--three">
            <ImageField
              label="Foto"
              caption={draft.mapa.from ? `De ${draft.mapa.from}` : 'Foto del diseño'}
              photo={draft.mapa.photo}
              onOpen={() =>
                openPicker({
                  title: 'Foto de «Encuentra dónde comer»',
                  hint: 'Fotos de los establecimientos de Dónde comer, agrupadas por establecimiento.',
                  groups: [...groupsOf('comer'), groups.uploads],
                  current: draft.mapa.photo,
                  defaultPhoto: defaults.mapa.photo,
                  onPick: ({ url, alt, from }) =>
                    update((page) => {
                      Object.assign(page.mapa, { photo: url, alt: alt || page.mapa.alt, from })
                    }),
                })
              }
            />
          </div>
        </AdminSection>
      </>
    )
  }

  const related =
    pageKey === 'donde-comer'
      ? { title: 'Referencia a Dónde dormir', pool: pools.dormir, count: RELATED_COUNT['donde-comer'] }
      : { title: 'Referencia a Dónde comprar', pool: pools.comprar, count: RELATED_COUNT['donde-dormir'] }

  return (
    <>
      {listing}
      <AdminSection signal={signal} title={related.title} hint="Título, descripción y las fichas que se muestran, con su foto.">
        <TextBlock block={draft.related} onChange={setBlock('related')} />
        <RelatedEditor
          block={draft.related}
          pool={related.pool}
          count={related.count}
          onChange={(block) =>
            update((page) => {
              page.related = block
            })
          }
          onCover={(item) => coverPicker(item, (page) => page.related, 'Foto de la referencia')}
        />
      </AdminSection>
    </>
  )
}

// ---------------------------------------------------------------- Redes
function RedesEditor({ draft, update, signal }) {
  const rows = socialRows(draft.social)
  const phoneBad = invalidWhatsapp(draft.supportWhatsapp)
  const setRow = (index, patch) =>
    update((page) => {
      page.social = socialRows(page.social).map((item, i) => (i === index ? { ...item, ...patch } : item))
    })

  return (
    <AdminSection
      signal={signal}
      title="Redes sociales del pie de página"
      hint="Activa o desactiva cada icono, cambia a dónde lleva y su orden."
    >
      <label className="admin-field admin-wa">
        <span>Número del botón flotante de WhatsApp</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={draft.supportWhatsapp ?? ''}
          placeholder="+57 320 417 7123"
          aria-invalid={phoneBad}
          onChange={(event) =>
            update((page) => {
              page.supportWhatsapp = event.target.value
            })
          }
        />
        <small className={phoneBad ? 'admin-social__error' : 'note'}>
          {phoneBad
            ? 'Escribe entre 10 y 15 dígitos (por ejemplo, 57 320 417 7123).'
            : 'Número del botón de ayuda de todas las páginas. Escribe el indicativo; si es de Colombia, puedes usar 57.'}
        </small>
      </label>
      <ol className="admin-order">
        {rows.map((item, index) => {
          const network = SOCIAL_NETWORKS.find((entry) => entry.id === item.id)
          const bad = item.enabled && !isSocialUrl(item.url)
          return (
            <li key={item.id} className={`admin-order__item admin-social${item.enabled ? '' : ' is-off'}`}>
              <span className="admin-order__pos">{index + 1}</span>
              <MoveButtons
                index={index}
                length={rows.length}
                label={network.label}
                onMove={(from, delta) =>
                  update((page) => {
                    page.social = move(socialRows(page.social), from, delta)
                  })
                }
              />
              <span className="admin-social__icon">
                <SocialIcon name={item.id} size={18} />
              </span>
              <label className="admin-social__url">
                <span className="visually-hidden">Enlace de {network.label}</span>
                <strong>{network.label}</strong>
                <input
                  type="url"
                  value={item.url}
                  placeholder={network.placeholder}
                  aria-invalid={bad}
                  onChange={(event) => setRow(index, { url: event.target.value })}
                />
                {bad ? <small className="admin-social__error">Escribe un enlace completo (https://… o mailto:…).</small> : null}
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) => setRow(index, { enabled: event.target.checked })}
                />
                <span>{item.enabled ? 'Activa' : 'Oculta'}</span>
              </label>
            </li>
          )
        })}
      </ol>
      <p className="note">
        Solo se muestran las redes activas con un enlace válido. WhatsApp admite enlaces como https://wa.me/57300…
      </p>
    </AdminSection>
  )
}

// ---------------------------------------------------------------- Carrusel
const BANNER_HINT =
  'Banner completo en 8:3 con el texto dentro de la imagen (ideal 2560×960 px; mínimo 1440×540). JPG, PNG o WebP de hasta 8 MB.'

function formatDay(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Estado de una diapositiva según si está activa, su banner y sus fechas.
function slideStatus(slide, today) {
  if (slide.active === false) return { label: 'Oculta', badge: '' }
  if (!slide.image) return { label: 'Sin banner', badge: 'admin-badge--draft' }
  if (slide.startsAt && slide.startsAt > today) return { label: `Desde el ${formatDay(slide.startsAt)}`, badge: 'admin-badge--draft' }
  if (slide.endsAt && slide.endsAt < today) return { label: 'Terminó', badge: '' }
  return { label: slide.endsAt ? `Visible hasta el ${formatDay(slide.endsAt)}` : 'Visible', badge: 'admin-badge--ok' }
}

// Problemas que impiden guardar el carrusel (solo en diapositivas activas).
function carouselProblems(draft) {
  const problems = []
  ;(draft?.slides ?? []).forEach((slide, index) => {
    if (slide.active === false) return
    const name = slide.title?.trim() || `Diapositiva ${index + 1}`
    const link = slide.link ?? {}
    if (!slide.image) problems.push(`${name}: falta el banner.`)
    if (!slide.alt?.trim()) problems.push(`${name}: falta el texto alternativo.`)
    if (slide.startsAt && slide.endsAt && slide.endsAt < slide.startsAt) {
      problems.push(`${name}: la fecha final es anterior a la inicial.`)
    }
    if (link.kind === 'url' && !isWebUrl(link.url)) problems.push(`${name}: el enlace debe empezar con https://.`)
    if (link.kind === 'whatsapp' && !whatsappUrl(link.phone)) problems.push(`${name}: el número de WhatsApp no es válido.`)
    if ((link.kind === 'experience' || link.kind === 'establishment') && !link.slug) {
      problems.push(`${name}: elige la ficha del enlace.`)
    }
  })
  return problems
}

function SlideLinkField({ link, onChange, sources }) {
  const kind = link?.kind ?? 'none'
  const choose = (next) => {
    if (next === 'none') onChange({ kind: 'none' })
    else if (next === 'url') onChange({ kind: 'url', url: '' })
    else if (next === 'whatsapp') onChange({ kind: 'whatsapp', phone: '', message: '' })
    else if (next === 'page') onChange({ kind: 'page', path: PAGE_LINKS[0].path })
    else onChange({ kind: next, slug: '' })
  }
  const badPhone = Boolean(link?.phone) && !whatsappUrl(link.phone)
  const badUrl = Boolean(link?.url) && !isWebUrl(link.url)

  return (
    <div className="admin-slide__link">
      <Field label="Al tocar el banner">
        <select value={kind} onChange={(event) => choose(event.target.value)}>
          <option value="none">No lleva a ningún lado</option>
          <option value="whatsapp">Abre un chat de WhatsApp</option>
          <option value="url">Abre un enlace externo (formulario, red social…)</option>
          <option value="page">Lleva a una sección del sitio</option>
          <option value="experience">Lleva a una experiencia</option>
          <option value="establishment">Lleva a un establecimiento</option>
        </select>
      </Field>
      {kind === 'page' || kind === 'experience' || kind === 'establishment' ? (
        <LinkField link={link} onChange={onChange} sources={sources} hideKind />
      ) : null}
      {kind === 'url' ? (
        <Field label="Enlace" hint={badUrl ? 'Escribe el enlace completo, con https://' : 'Se abre en otra pestaña.'}>
          <input
            type="url"
            value={link.url ?? ''}
            placeholder="https://"
            aria-invalid={badUrl}
            onChange={(event) => onChange({ ...link, url: event.target.value })}
          />
        </Field>
      ) : null}
      {kind === 'whatsapp' ? (
        <div className="admin-slide__pair">
          <Field
            label="Número de WhatsApp"
            hint={badPhone ? 'Celular de 10 dígitos o con indicativo (57…).' : 'Celular de 10 dígitos; se antepone el 57.'}
          >
            <input
              type="tel"
              inputMode="tel"
              value={link.phone ?? ''}
              placeholder="300 123 4567"
              aria-invalid={badPhone}
              onChange={(event) => onChange({ ...link, phone: event.target.value })}
            />
          </Field>
          <Field label="Mensaje inicial (opcional)">
            <input
              value={link.message ?? ''}
              maxLength={300}
              placeholder="Hola, quiero información sobre…"
              onChange={(event) => onChange({ ...link, message: event.target.value })}
            />
          </Field>
        </div>
      ) : null}
    </div>
  )
}

function BannerField({ label, size, photo, onOpen }) {
  return (
    <div className="admin-imgfield admin-imgfield--banner">
      <button type="button" className="admin-imgfield__shot" onClick={onOpen} aria-label={`Cambiar: ${label}`}>
        {photo ? <img src={photo} alt="" loading="lazy" /> : <span className="admin-imgfield__empty" aria-hidden="true" />}
        <span className="admin-imgfield__cta">{photo ? 'Cambiar' : 'Elegir banner'}</span>
      </button>
      <span className="admin-imgfield__label">
        <strong>{label}</strong>
        <small>{size}</small>
      </span>
    </div>
  )
}

// Selector de segundos (rango + valor) para los tiempos del carrusel.
function SecondsField({ label, hint, value, min, max, disabled, onChange }) {
  return (
    <Field label={`${label}: ${value} s`} hint={hint}>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  )
}

function CarruselEditor({ draft, update, sources, groups, openPicker, signal, uploadImage }) {
  const today = todayKey()
  const defaults = PAGE_DEFAULTS.carrusel
  const visible = visibleSlides(draft.slides, today)
  const designGroup = {
    key: 'carrusel-diseno',
    label: 'Banners del diseño',
    from: null,
    images: defaults.slides.map((slide) => ({ url: slide.image, alt: slide.alt })),
  }

  const setSlide = (index, patch) =>
    update((page) => {
      Object.assign(page.slides[index], patch)
    })

  const setPage = (patch) =>
    update((page) => {
      Object.assign(page, patch)
    })

  const pickBanner = (index) => {
    const slide = draft.slides[index]
    const original = defaults.slides.find((item) => item.id === slide.id)
    openPicker({
      title: `Banner · ${slide.title || `Diapositiva ${index + 1}`}`,
      hint: BANNER_HINT,
      groups: [groups.uploads, designGroup],
      current: slide.image,
      defaultPhoto: original?.image,
      onUpload: (file) => uploadImage(file, 'banner'),
      onPick: ({ url, alt }) =>
        update((page) => {
          const target = page.slides[index]
          target.image = url
          // Al volver a un banner del diseño se recupera también su texto alternativo.
          const design = defaults.slides.find((item) => item.image === url)
          if (design && (!target.alt?.trim() || target.alt === original?.alt)) target.alt = design.alt
          else if (!target.alt?.trim() && alt) target.alt = alt
        }),
    })
  }

  const addSlide = () =>
    update((page) => {
      page.slides.push({
        id: newId(),
        title: '',
        alt: '',
        image: null,
        cta: '',
        link: { kind: 'none' },
        active: true,
        startsAt: '',
        endsAt: '',
      })
    })

  return (
    <>
      <AdminSection signal={signal} title="Ajustes" hint="Si se muestra en Inicio y cómo avanza.">
        <div className="admin-carousel-settings">
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.enabled !== false}
              onChange={(event) => setPage({ enabled: event.target.checked })}
            />
            <span>{draft.enabled !== false ? 'Se muestra en Inicio, bajo la portada' : 'Oculto en Inicio'}</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={draft.autoplay !== false}
              onChange={(event) => setPage({ autoplay: event.target.checked })}
            />
            <span>{draft.autoplay !== false ? 'Avanza solo' : 'Solo con flechas o deslizando'}</span>
          </label>
          <SecondsField
            label="Tiempo por diapositiva"
            hint="Lo que marca la barra de progreso. Mínimo 6 s."
            value={intervalSeconds(draft.interval)}
            min={CAROUSEL_LIMITS.minInterval}
            max={CAROUSEL_LIMITS.maxInterval}
            disabled={draft.autoplay === false}
            onChange={(interval) => setPage({ interval })}
          />
          <SecondsField
            label="Pausa al soltar el dedo"
            hint="En celular, tras mantener presionado el banner, la barra sigue pausada este tiempo antes de continuar."
            value={timingSeconds(draft.touchResume, 'touchResume')}
            min={CAROUSEL_LIMITS.touchResume.min}
            max={CAROUSEL_LIMITS.touchResume.max}
            disabled={draft.autoplay === false}
            onChange={(touchResume) => setPage({ touchResume })}
          />
          <SecondsField
            label="Reanudar tras cambio manual"
            hint="Si alguien cambia de diapositiva con las flechas o deslizando, la barra se oculta y el avance vuelve tras este tiempo sin tocarlo."
            value={timingSeconds(draft.manualResume, 'manualResume')}
            min={CAROUSEL_LIMITS.manualResume.min}
            max={CAROUSEL_LIMITS.manualResume.max}
            disabled={draft.autoplay === false}
            onChange={(manualResume) => setPage({ manualResume })}
          />
          <Field label="Nombre del carrusel" hint="Lo anuncian los lectores de pantalla; no se ve en la página.">
            <input value={draft.label ?? ''} maxLength={80} onChange={(event) => setPage({ label: event.target.value })} />
          </Field>
        </div>
      </AdminSection>

      <AdminSection
        signal={signal}
        title="Vista previa"
        hint={`Así se ve hoy: ${visible.length} de ${draft.slides.length} diapositivas visibles.`}
      >
        {draft.enabled === false ? (
          <p className="note">El carrusel está oculto: no sale en Inicio aunque tenga diapositivas.</p>
        ) : null}
        {visible.length ? (
          <div className="admin-carousel-preview">
            <BannerCarousel content={{ ...draft, enabled: true }} preview />
          </div>
        ) : (
          <p className="empty">
            Ninguna diapositiva está visible hoy: revisa que estén activas, con banner y dentro de sus fechas.
          </p>
        )}
      </AdminSection>

      <AdminSection signal={signal} title="Diapositivas" hint="Banner, orden, fechas en que se muestra y a dónde lleva.">
        <div className="admin-pcards">
          {draft.slides.map((slide, index) => {
            const status = slideStatus(slide, today)
            const name = slide.title?.trim() || `Diapositiva ${index + 1}`
            return (
              <article key={slide.id} className={`admin-pcard admin-slide${slide.active === false ? ' is-off' : ''}`}>
                <header className="admin-pcard__head">
                  <span className="admin-order__pos">{index + 1}</span>
                  <strong>{name}</strong>
                  <span className={`admin-badge ${status.badge}`}>{status.label}</span>
                  <MoveButtons
                    index={index}
                    length={draft.slides.length}
                    label={name}
                    onMove={(from, delta) =>
                      update((page) => {
                        page.slides = move(page.slides, from, delta)
                      })
                    }
                  />
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      checked={slide.active !== false}
                      onChange={(event) => setSlide(index, { active: event.target.checked })}
                    />
                    <span>{slide.active !== false ? 'Activa' : 'Oculta'}</span>
                  </label>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger-outline"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `¿Quitar «${name}» del carrusel?`,
                        message: 'La imagen deja de aparecer en el inicio.',
                        confirmLabel: 'Quitar',
                        danger: true,
                      })
                      if (!ok) return
                      update((page) => {
                        page.slides.splice(index, 1)
                      })
                    }}
                  >
                    Quitar
                  </button>
                </header>
                <div className="admin-slide__body">
                  <div className="admin-slide__images">
                    <BannerField
                      label="Banner"
                      size="8:3 · 2560×960 px"
                      photo={slide.image}
                      onOpen={() => pickBanner(index)}
                    />
                  </div>
                  <div className="admin-slide__fields">
                    <div className="admin-slide__pair">
                      <Field label="Nombre" hint="Para reconocerla aquí y en los lectores de pantalla.">
                        <input
                          value={slide.title ?? ''}
                          maxLength={80}
                          onChange={(event) => setSlide(index, { title: event.target.value })}
                        />
                      </Field>
                      <Field label="Texto del botón (opcional)" hint="Sale sobre el banner si lleva a algún lado.">
                        <input
                          value={slide.cta ?? ''}
                          maxLength={30}
                          placeholder="Ej.: Más información"
                          onChange={(event) => setSlide(index, { cta: event.target.value })}
                        />
                      </Field>
                    </div>
                    <Field
                      label="Texto alternativo"
                      hint="Lo que dice el banner (evento, fechas, lugar): lo leen los lectores de pantalla y los buscadores."
                    >
                      <textarea
                        rows={3}
                        value={slide.alt ?? ''}
                        maxLength={400}
                        aria-invalid={slide.active !== false && !slide.alt?.trim()}
                        onChange={(event) => setSlide(index, { alt: event.target.value })}
                      />
                    </Field>
                    <div className="admin-slide__pair">
                      <Field label="Mostrar desde" hint="Vacío: desde ya.">
                        <input
                          type="date"
                          value={slide.startsAt ?? ''}
                          max={slide.endsAt || undefined}
                          onChange={(event) => setSlide(index, { startsAt: event.target.value })}
                        />
                      </Field>
                      <Field label="Mostrar hasta" hint="Vacío: sin final. Al pasar la fecha se oculta sola.">
                        <input
                          type="date"
                          value={slide.endsAt ?? ''}
                          min={slide.startsAt || undefined}
                          onChange={(event) => setSlide(index, { endsAt: event.target.value })}
                        />
                      </Field>
                    </div>
                    <SlideLinkField link={slide.link} sources={sources} onChange={(link) => setSlide(index, { link })} />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {draft.slides.length < CAROUSEL_LIMITS.slides ? (
          <button type="button" className="admin-btn" onClick={addSlide}>
            + Diapositiva
          </button>
        ) : (
          <p className="note">Máximo {CAROUSEL_LIMITS.slides} diapositivas: quita o reutiliza una.</p>
        )}
        <p className="note">
          Las diapositivas ocultas, sin banner o fuera de sus fechas no se muestran. Si no queda ninguna visible, el
          carrusel desaparece de Inicio.
        </p>
      </AdminSection>
    </>
  )
}

// ---------------------------------------------------------------- Página
export default function AdminPaginas() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('pagina')
  const pageKey = PAGE_INFO[requested] ? requested : 'inicio'
  const tab = TABS.find((entry) => entry.pages.includes(pageKey)) ?? TABS[0]

  const [data, setData] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [dirty, setDirty] = useState({})
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState(null)
  // Expandir / Contraer todo: cada sección escucha el contador `n`.
  const [signal, setSignal] = useState({ open: false, n: 0 })
  const [toast, setToast] = useState(null)
  const toastSeq = useRef(0)
  const [error, setError] = useState('')
  const { confirm } = useDialog()

  const notify = (tone, title, message) => {
    toastSeq.current += 1
    setToast({ tone, title, message, key: toastSeq.current })
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!(await ensureSession())) return
      try {
        const result = await apiRequest('/admin/pages')
        if (!alive) return
        setData(result)
        setDrafts(
          Object.fromEntries(
            Object.keys(PAGE_INFO).map((key) => [
              key,
              clone(mergeContent(PAGE_DEFAULTS[key], result.pages?.[key]?.value ?? null)),
            ]),
          ),
        )
      } catch (err) {
        if (alive) setError(err.message)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  // Avisa al salir con cambios sin guardar.
  const hasDirty = Object.values(dirty).some(Boolean)
  useEffect(() => {
    if (!hasDirty) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasDirty])

  const groups = useGroups(data?.sources)

  function select(key) {
    setParams({ pagina: key }, { replace: true })
  }

  // `mutate` recibe una copia de la página y la cambia en el sitio.
  function update(mutate) {
    setDrafts((current) => {
      const next = clone(current[pageKey])
      mutate(next)
      return { ...current, [pageKey]: next }
    })
    setDirty((current) => ({ ...current, [pageKey]: true }))
  }

  async function uploadImage(file, purpose) {
    const form = new FormData()
    form.append('file', file)
    const query = purpose ? `?purpose=${encodeURIComponent(purpose)}` : ''
    const image = await apiRequest(`/admin/pages/media${query}`, { method: 'POST', formData: form })
    setData((current) => ({
      ...current,
      sources: { ...current.sources, uploads: [image, ...(current.sources.uploads ?? [])] },
    }))
    return image
  }

  function openPicker({ defaultPhoto, onPick, onReset, ...options }) {
    setPicker({
      ...options,
      onPick: (image) => {
        onPick(image)
        setPicker(null)
      },
      onReset: onReset
        ? () => {
            onReset()
            setPicker(null)
          }
        : defaultPhoto
          ? () => {
              onPick({ url: defaultPhoto, alt: '', from: null })
              setPicker(null)
            }
          : undefined,
    })
  }

  async function save() {
    const invalid = pageKey === 'redes' ? invalidSocial(drafts.redes) : []
    if (invalid.length) {
      notify('error', 'Revisa los enlaces', `Falta un enlace válido en: ${invalid.join(', ')}.`)
      return
    }
    if (pageKey === 'redes' && invalidWhatsapp(drafts.redes.supportWhatsapp)) {
      notify('error', 'Revisa el WhatsApp', 'El número debe tener entre 10 y 15 dígitos.')
      return
    }
    const problems = pageKey === 'carrusel' ? carouselProblems(drafts.carrusel) : []
    if (problems.length) {
      const more = problems.length > 3 ? ` (y ${problems.length - 3} más)` : ''
      notify('error', 'Revisa el carrusel', `${problems.slice(0, 3).join(' ')}${more}`)
      return
    }
    setBusy(true)
    try {
      const saved = await apiRequest(`/admin/pages/${pageKey}`, { method: 'PUT', body: { value: drafts[pageKey] } })
      setData((current) => ({ ...current, pages: { ...current.pages, [pageKey]: saved } }))
      setDirty((current) => ({ ...current, [pageKey]: false }))
      notify('ok', `${PAGE_INFO[pageKey].label}: cambios guardados.`)
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    const ok = await confirm({
      title: `¿Volver al diseño original de «${PAGE_INFO[pageKey].label}»?`,
      message: 'Se pierden el orden, los textos y las fotos elegidas aquí.',
      confirmLabel: 'Volver al original',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await apiRequest(`/admin/pages/${pageKey}`, { method: 'DELETE' })
      setData((current) => ({ ...current, pages: { ...current.pages, [pageKey]: null } }))
      setDrafts((current) => ({ ...current, [pageKey]: clone(PAGE_DEFAULTS[pageKey]) }))
      setDirty((current) => ({ ...current, [pageKey]: false }))
      notify('ok', `${PAGE_INFO[pageKey].label}: diseño original restablecido.`)
    } catch (err) {
      notify('error', 'No se pudo restablecer', err.message)
    } finally {
      setBusy(false)
    }
  }

  const draft = drafts[pageKey]
  const stored = data?.pages?.[pageKey]
  const editorProps = { draft, update, sources: data?.sources, groups, openPicker, signal, uploadImage }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <div>
            <h1>Páginas</h1>
            <p className="admin-lead">
              Fotos, textos, orden y enlaces de las páginas del sitio, el carrusel de eventos y las redes.
            </p>
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {/* Un desplegable en vez de la hilera de pestañas: en móvil cabía mal. */}
        <AdminNavSelect
          id="admin-page"
          label="Página"
          value={tab.key}
          options={TABS.map((entry) => ({
            value: entry.key,
            label: `${entry.label}${entry.pages.some((key) => dirty[key]) ? ' •' : ''}`,
          }))}
          onChange={(key) => select(TABS.find((entry) => entry.key === key)?.pages[0] ?? 'inicio')}
          hint={tab.pages.some((key) => dirty[key]) ? '• cambios sin guardar' : undefined}
        />

        {tab.pages.length > 1 ? (
          <AdminNavSelect
            id="admin-subpage"
            label="Subpágina"
            value={pageKey}
            options={tab.pages.map((key) => ({
              value: key,
              label: `${PAGE_INFO[key].label}${dirty[key] ? ' •' : ''}`,
            }))}
            onChange={select}
          />
        ) : null}

        {!data && !error ? <p className="note">Cargando páginas…</p> : null}

        {data && draft ? (
          <div className="admin-panel">
            <div className="admin-pagehead">
              <div>
                <h2>{PAGE_INFO[pageKey].label}</h2>
                <p className="note">
                  {stored?.updatedAt
                    ? `Guardada el ${formatStamp(stored.updatedAt)}.`
                    : 'Con el diseño original: aún no se ha guardado ningún cambio.'}
                  {dirty[pageKey] ? ' Hay cambios sin guardar.' : ''}
                </p>
              </div>
              <div className="admin-pagehead__actions">
                <Link className="admin-btn" to={PAGE_INFO[pageKey].path} target="_blank" rel="noreferrer">
                  Ver página ↗
                </Link>
                {stored ? (
                  <button type="button" className="admin-btn admin-btn--danger-outline" onClick={restore} disabled={busy}>
                    Restablecer diseño
                  </button>
                ) : null}
              </div>
            </div>

            <div className="admin-panel__tools">
              <button type="button" className="admin-tool-btn" onClick={() => setSignal((p) => ({ open: true, n: p.n + 1 }))}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 3.5 4 4 4-4M4 8.5l4 4 4-4" />
                </svg>
                Expandir todo
              </button>
              <button type="button" className="admin-tool-btn" onClick={() => setSignal((p) => ({ open: false, n: p.n + 1 }))}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="m4 7.5 4-4 4 4M4 12.5l4-4 4 4" />
                </svg>
                Contraer todo
              </button>
            </div>

            {pageKey === 'inicio' ? <InicioEditor {...editorProps} /> : null}
            {pageKey === 'que-hacer' ? <QueHacerEditor {...editorProps} /> : null}
            {pageKey === 'redes' ? <RedesEditor {...editorProps} /> : null}
            {pageKey === 'carrusel' ? <CarruselEditor {...editorProps} /> : null}
            {pageKey.startsWith('donde-') ? <CategoryEditor key={pageKey} pageKey={pageKey} {...editorProps} /> : null}

            <div className="admin-panel__footer">
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={save}
                disabled={busy || !dirty[pageKey]}
              >
                {busy ? 'Guardando…' : `Guardar ${PAGE_INFO[pageKey].label}`}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {picker ? (
        <ImagePicker
          {...picker}
          onClose={() => setPicker(null)}
          onUpload={picker.noUpload ? undefined : (picker.onUpload ?? uploadImage)}
        />
      ) : null}

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
