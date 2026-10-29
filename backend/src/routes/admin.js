import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth.js'
import { config } from '../config.js'
import { withTransaction, query, queryOne } from '../db.js'
import { ApiError, asyncHandler, booleanParam, stringParam } from '../http.js'
import {
  assertQuota,
  ensureDir,
  mediaRoot,
  removeImageFiles,
  storeImage,
  usageBytes,
} from '../media.js'
import { toNumber } from '../serializers.js'

const router = Router()

const PLATFORMS = new Set([
  'facebook',
  'instagram',
  'whatsapp',
  'tiktok',
  'youtube',
  'x',
  'website',
])
const IMAGE_ROLES = new Set(['cover', 'gallery', 'logo'])

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
}

function text(value, field, { max = 500, required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new ApiError(400, 'VALIDATION', `${field} es obligatorio`)
    return null
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'VALIDATION', `${field} debe ser texto`)
  }
  const trimmed = value.trim()
  if (required && !trimmed) {
    throw new ApiError(400, 'VALIDATION', `${field} es obligatorio`)
  }
  return trimmed.slice(0, max)
}

function decimal(value, field, { min = 0, max = 99_999_999 } = {}) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ApiError(400, 'VALIDATION', `${field} no es un número válido`)
  }
  return parsed
}

function integer(value, field) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, 'VALIDATION', `${field} no es un número válido`)
  }
  return parsed
}

function time(value) {
  const raw = text(value, 'hora', { max: 8 })
  if (!raw) return null
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    throw new ApiError(400, 'VALIDATION', 'Las horas deben tener formato HH:MM')
  }
  return raw.length === 5 ? `${raw}:00` : raw
}

function requireAdmin(role) {
  return (req, _res, next) => {
    if (req.admin?.role !== role) {
      next(new ApiError(403, 'FORBIDDEN', 'Tu cuenta no tiene permiso para esta acción'))
      return
    }
    next()
  }
}

async function recordAudit(connection, req, { action, entityType, entityId, changes }) {
  await connection.query(
    `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.admin?.id ?? null,
      action,
      entityType,
      entityId,
      changes ? JSON.stringify(changes) : null,
      (req.ip ?? '').slice(0, 45) || null,
    ],
  )
}

function imageRow(row) {
  return {
    imageId: toNumber(row.image_id),
    mediaId: toNumber(row.media_id),
    role: row.role,
    sortOrder: toNumber(row.sort_order) ?? 0,
    altOverride: row.alt_override ?? null,
    url: row.public_url ?? null,
    alt: row.alt_override || row.alt_text || '',
    caption: row.caption ?? null,
    credit: row.credit ?? null,
    mimeType: row.mime_type ?? null,
    width: toNumber(row.width_px),
    height: toNumber(row.height_px),
  }
}

async function loadImages(establishmentId) {
  return query(
    `SELECT i.id AS image_id, i.role, i.sort_order, i.alt_override,
            m.id AS media_id, m.public_url, m.alt_text, m.caption, m.credit,
            m.mime_type, m.width_px, m.height_px
     FROM establishment_images i
     JOIN media m ON m.id = i.media_id
     WHERE i.establishment_id = ?
     ORDER BY FIELD(i.role, 'cover', 'logo', 'gallery'), i.sort_order, i.id`,
    [establishmentId],
  )
}

// ---------------------------------------------------------------------------
// Listado y detalle (cualquier cuenta activa puede leer)
// ---------------------------------------------------------------------------

router.get(
  '/admin/establishments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const search = stringParam(req.query.q, { max: 160 })
    const status = stringParam(req.query.status, { max: 20 })

    const where = ['e.deleted_at IS NULL']
    const params = []
    if (search) {
      where.push('(e.name LIKE ? OR e.slug LIKE ? OR e.address LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (status === 'published') where.push('e.is_published = 1')
    if (status === 'draft') where.push('e.is_published = 0')

    const rows = await query(
      `SELECT e.id, e.slug, e.name, e.is_published, e.is_featured, e.updated_at,
              c.name AS category_name, c.slug AS category_slug,
              z.name AS zone_name, z.slug AS zone_slug,
              (SELECT COUNT(*) FROM establishment_images i
                WHERE i.establishment_id = e.id) AS images_count,
              (SELECT m.public_url FROM establishment_images i
                 JOIN media m ON m.id = i.media_id
                WHERE i.establishment_id = e.id AND i.role = 'cover'
                ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
              (SELECT m2.alt_text FROM establishment_images i2
                 JOIN media m2 ON m2.id = i2.media_id
                WHERE i2.establishment_id = e.id AND i2.role = 'cover'
                ORDER BY i2.sort_order, i2.id LIMIT 1) AS cover_alt
       FROM establishments e
       JOIN establishment_categories c ON c.id = e.category_id
       LEFT JOIN zones z ON z.id = e.zone_id
       WHERE ${where.join(' AND ')}
       ORDER BY e.is_featured DESC, c.sort_order, e.name
       LIMIT 300`,
      params,
    )

    res.json({
      data: rows.map((row) => ({
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        published: Boolean(row.is_published),
        featured: Boolean(row.is_featured),
        category: { slug: row.category_slug, name: row.category_name },
        zone: row.zone_slug ? { slug: row.zone_slug, name: row.zone_name } : null,
        imagesCount: toNumber(row.images_count) ?? 0,
        cover: row.cover_url
          ? { url: row.cover_url, alt: row.cover_alt ?? '' }
          : null,
        updatedAt: row.updated_at,
      })),
      meta: { total: rows.length },
    })
  }),
)

router.get(
  '/admin/establishments/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = integer(req.params.id, 'id')
    const row = await queryOne(
      `SELECT e.*, c.name AS category_name, c.slug AS category_slug,
              t.name AS type_name, z.name AS zone_name
       FROM establishments e
       JOIN establishment_categories c ON c.id = e.category_id
       LEFT JOIN establishment_types t ON t.id = e.type_id
       LEFT JOIN zones z ON z.id = e.zone_id
       WHERE e.id = ? AND e.deleted_at IS NULL`,
      [id],
    )
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')

    const [images, features, products, services, payments, social, hours, exceptions, related, audit] =
      await Promise.all([
        loadImages(id),
        query(
          `SELECT id, title, description, icon, sort_order FROM establishment_features
           WHERE establishment_id = ? ORDER BY sort_order, id`,
          [id],
        ),
        query(
          `SELECT id, name, description, price_cop, media_id, sort_order
           FROM establishment_products WHERE establishment_id = ?
           ORDER BY sort_order, id`,
          [id],
        ),
        query(
          'SELECT service_id FROM establishment_services WHERE establishment_id = ?',
          [id],
        ),
        query(
          'SELECT payment_method_id FROM establishment_payments WHERE establishment_id = ?',
          [id],
        ),
        query(
          `SELECT platform, url FROM establishment_social_links
           WHERE establishment_id = ? ORDER BY sort_order, id`,
          [id],
        ),
        query(
          `SELECT day_of_week, opens_at, closes_at, is_closed, note, sort_order
           FROM opening_hours WHERE establishment_id = ?
           ORDER BY day_of_week, sort_order, id`,
          [id],
        ),
        query(
          `SELECT exception_date, is_closed, opens_at, closes_at, note
           FROM opening_hours_exceptions WHERE establishment_id = ?
           ORDER BY exception_date`,
          [id],
        ),
        query(
          'SELECT related_establishment_id, sort_order FROM establishment_relations WHERE establishment_id = ? ORDER BY sort_order',
          [id],
        ),
        query(
          `SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, u.name AS user_name
           FROM audit_log a LEFT JOIN admin_users u ON u.id = a.admin_user_id
           WHERE a.entity_type IN ('establishment', 'establishment_image', 'media')
             AND (a.entity_id = ? OR (a.entity_type = 'media'))
           ORDER BY a.id DESC LIMIT 20`,
          [id],
        ),
      ])

    res.json({
      data: {
        id: toNumber(row.id),
        slug: row.slug,
        name: row.name,
        categoryId: toNumber(row.category_id),
        categoryName: row.category_name,
        typeId: toNumber(row.type_id),
        typeName: row.type_name ?? null,
        zoneId: toNumber(row.zone_id),
        zoneName: row.zone_name ?? null,
        locationDetail: row.location_detail ?? null,
        summary: row.summary,
        description: row.description,
        address: row.address ?? null,
        latitude: toNumber(row.latitude),
        longitude: toNumber(row.longitude),
        phone: row.phone ?? null,
        phoneSecondary: row.phone_secondary ?? null,
        whatsapp: row.whatsapp ?? null,
        email: row.email ?? null,
        website: row.website ?? null,
        hoursText: row.hours_text ?? null,
        checkinText: row.checkin_text ?? null,
        priceText: row.price_text ?? null,
        priceMin: toNumber(row.price_min_cop),
        priceMax: toNumber(row.price_max_cop),
        featured: Boolean(row.is_featured),
        published: Boolean(row.is_published),
        sortOrder: toNumber(row.sort_order) ?? 0,
        publishedAt: row.published_at ?? null,
        updatedAt: row.updated_at,
        images: images.map(imageRow),
        features: features.map((feature) => ({
          id: toNumber(feature.id),
          title: feature.title,
          description: feature.description ?? null,
          icon: feature.icon ?? null,
          sortOrder: toNumber(feature.sort_order) ?? 0,
        })),
        products: products.map((product) => ({
          id: toNumber(product.id),
          name: product.name,
          description: product.description ?? null,
          price: toNumber(product.price_cop),
          mediaId: toNumber(product.media_id),
          sortOrder: toNumber(product.sort_order) ?? 0,
        })),
        serviceIds: services.map((item) => toNumber(item.service_id)),
        paymentIds: payments.map((item) => toNumber(item.payment_method_id)),
        social: social.map((link) => ({ platform: link.platform, url: link.url })),
        openingHours: hours.map((slot) => ({
          dayOfWeek: toNumber(slot.day_of_week),
          opensAt: slot.opens_at ?? null,
          closesAt: slot.closes_at ?? null,
          closed: Boolean(slot.is_closed),
          note: slot.note ?? null,
          sortOrder: toNumber(slot.sort_order) ?? 0,
        })),
        openingHoursExceptions: exceptions.map((exception) => ({
          date: exception.exception_date,
          closed: Boolean(exception.is_closed),
          opensAt: exception.opens_at ?? null,
          closesAt: exception.closes_at ?? null,
          note: exception.note ?? null,
        })),
        relatedIds: related.map((item) => toNumber(item.related_establishment_id)),
        audit: audit.map((entry) => ({
          id: toNumber(entry.id),
          action: entry.action,
          entityType: entry.entity_type,
          entityId: toNumber(entry.entity_id),
          userName: entry.user_name ?? null,
          createdAt: entry.created_at,
        })),
      },
    })
  }),
)

// ---------------------------------------------------------------------------
// Crear y editar
// ---------------------------------------------------------------------------

router.post(
  '/admin/establishments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const name = text(req.body?.name, 'Nombre', { max: 180, required: true })
    const categoryId = integer(req.body?.categoryId, 'Categoría')
    if (!categoryId) throw new ApiError(400, 'VALIDATION', 'La categoría es obligatoria')

    const slugBase = slugify(text(req.body?.slug, 'Slug', { max: 160 }) || name)
    let slug = slugBase
    for (let attempt = 2; attempt < 50; attempt += 1) {
      const exists = await queryOne('SELECT id FROM establishments WHERE slug = ?', [slug])
      if (!exists) break
      slug = `${slugBase}-${attempt}`
    }

    const result = await query(
      `INSERT INTO establishments
         (slug, name, category_id, type_id, zone_id, summary, description,
          is_published, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        slug,
        name,
        categoryId,
        integer(req.body?.typeId, 'Tipo'),
        integer(req.body?.zoneId, 'Zona'),
        text(req.body?.summary, 'Resumen', { max: 320 }) ?? '',
        text(req.body?.description, 'Descripción', { max: 20_000 }) ?? '',
      ],
    )

    await withTransaction((connection) =>
      recordAudit(connection, req, {
        action: 'create',
        entityType: 'establishment',
        entityId: result.insertId,
        changes: { name, slug, categoryId },
      }),
    )

    res.status(201).json({ data: { id: toNumber(result.insertId), slug } })
  }),
)

router.patch(
  '/admin/establishments/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = integer(req.params.id, 'id')
    const body = req.body ?? {}

    const updatedAt = await withTransaction(async (connection) => {
      const [rows] = await connection.query(
        'SELECT * FROM establishments WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
        [id],
      )
      const current = rows[0]
      if (!current) throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')

      if (body.updatedAt) {
        const expected = Math.floor(new Date(body.updatedAt).getTime() / 1000)
        const actual = Math.floor(new Date(current.updated_at).getTime() / 1000)
        if (Number.isFinite(expected) && Number.isFinite(actual) && expected !== actual) {
          throw new ApiError(
            409,
            'CONFLICT',
            'Otra persona guardó esta ficha mientras la editabas. Recarga para ver los cambios.',
          )
        }
      }

      const name = text(body.name, 'Nombre', { max: 180, required: true })
      const summary = text(body.summary, 'Resumen', { max: 320, required: true })
      const description = text(body.description, 'Descripción', { max: 20_000, required: true })
      const categoryId = integer(body.categoryId, 'Categoría')
      if (!categoryId) throw new ApiError(400, 'VALIDATION', 'La categoría es obligatoria')

      let slug = current.slug
      if (body.slug && text(body.slug, 'Slug', { max: 160 }) !== current.slug) {
        const candidate = slugify(text(body.slug, 'Slug', { max: 160 }))
        if (!candidate) throw new ApiError(400, 'VALIDATION', 'El slug no es válido')
        const clash = await connection
          .query('SELECT id FROM establishments WHERE slug = ? AND id <> ?', [candidate, id])
          .then(([result]) => result[0])
        if (clash) throw new ApiError(409, 'SLUG_TAKEN', 'Ese slug ya está en uso')
        slug = candidate
      }

      const priceMin = decimal(body.priceMin, 'Precio mínimo')
      const priceMax = decimal(body.priceMax, 'Precio máximo')
      if (priceMin !== null && priceMax !== null && priceMax < priceMin) {
        throw new ApiError(400, 'VALIDATION', 'El precio máximo no puede ser menor que el mínimo')
      }

      const fields = {
        slug,
        name,
        category_id: categoryId,
        type_id: integer(body.typeId, 'Tipo'),
        zone_id: integer(body.zoneId, 'Zona'),
        location_detail: text(body.locationDetail, 'Ubicación', { max: 180 }),
        summary,
        description,
        address: text(body.address, 'Dirección', { max: 255 }),
        latitude: decimal(body.latitude, 'Latitud', { min: -90, max: 90 }),
        longitude: decimal(body.longitude, 'Longitud', { min: -180, max: 180 }),
        phone: text(body.phone, 'Teléfono', { max: 40 }),
        phone_secondary: text(body.phoneSecondary, 'Teléfono secundario', { max: 40 }),
        whatsapp: text(body.whatsapp, 'WhatsApp', { max: 40 }),
        email: text(body.email, 'Correo', { max: 190 }),
        website: text(body.website, 'Sitio web', { max: 500 }),
        hours_text: text(body.hoursText, 'Horario', { max: 255 }),
        checkin_text: text(body.checkinText, 'Check-in', { max: 120 }),
        price_text: text(body.priceText, 'Rango de precio', { max: 120 }),
        price_min_cop: priceMin,
        price_max_cop: priceMax,
        is_featured:
          typeof body.featured === 'boolean'
            ? body.featured
            : booleanParam(body.featured) ?? Boolean(current.is_featured),
        sort_order: integer(body.sortOrder, 'Orden') ?? 0,
      }

      const changes = {}
      for (const [column, value] of Object.entries(fields)) {
        const previous = current[column]
        const before = previous instanceof Date ? previous.toISOString() : previous
        const same =
          column === 'is_featured'
            ? Boolean(previous) === Boolean(value)
            : String(before ?? '') === String(value ?? '')
        if (!same) {
          changes[column] = { from: before ?? null, to: value ?? null }
        }
      }

      await connection.query(
        `UPDATE establishments SET
           slug = ?, name = ?, category_id = ?, type_id = ?, zone_id = ?,
           location_detail = ?, summary = ?, description = ?, address = ?,
           latitude = ?, longitude = ?, phone = ?, phone_secondary = ?,
           whatsapp = ?, email = ?, website = ?, hours_text = ?, checkin_text = ?,
           price_text = ?, price_min_cop = ?, price_max_cop = ?,
           is_featured = ?, sort_order = ?
         WHERE id = ?`,
        [
          fields.slug, fields.name, fields.category_id, fields.type_id, fields.zone_id,
          fields.location_detail, fields.summary, fields.description, fields.address,
          fields.latitude, fields.longitude, fields.phone, fields.phone_secondary,
          fields.whatsapp, fields.email, fields.website, fields.hours_text,
          fields.checkin_text, fields.price_text, fields.price_min_cop,
          fields.price_max_cop, fields.is_featured ? 1 : 0, fields.sort_order, id,
        ],
      )

      await replaceChildren(connection, id, body)

      const published = Boolean(current.is_published)
      await connection.query(
        `INSERT INTO search_documents (entity_type, entity_id, title, body, url, is_published)
         VALUES ('establishment', ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title), body = VALUES(body),
           url = VALUES(url), is_published = VALUES(is_published)`,
        [
          id,
          name,
          [summary, description, fields.address].filter(Boolean).join(' '),
          `/establecimiento/${slug}`,
          published ? 1 : 0,
        ],
      )

      await recordAudit(connection, req, {
        action: 'update',
        entityType: 'establishment',
        entityId: id,
        changes,
      })

      const [updated] = await connection.query(
        'SELECT updated_at FROM establishments WHERE id = ?',
        [id],
      )
      return updated[0].updated_at
    })

    res.json({ data: { id, updatedAt } })
  }),
)

async function replaceChildren(connection, id, body) {
  if (Array.isArray(body.features)) {
    await connection.query('DELETE FROM establishment_features WHERE establishment_id = ?', [id])
    for (const [index, feature] of body.features.entries()) {
      const title = text(feature?.title, 'Título de la tarjeta', { max: 160, required: true })
      await connection.query(
        `INSERT INTO establishment_features (establishment_id, title, description, icon, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          title,
          text(feature?.description, 'Descripción de la tarjeta', { max: 500 }),
          text(feature?.icon, 'Icono', { max: 40 }),
          integer(feature?.sortOrder, 'Orden') ?? index * 10,
        ],
      )
    }
  }

  if (Array.isArray(body.products)) {
    await connection.query('DELETE FROM establishment_products WHERE establishment_id = ?', [id])
    for (const [index, product] of body.products.entries()) {
      const name = text(product?.name, 'Nombre del producto', { max: 160, required: true })
      await connection.query(
        `INSERT INTO establishment_products
           (establishment_id, name, description, price_cop, media_id, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [
          id,
          name,
          text(product?.description, 'Descripción del producto', { max: 500 }),
          decimal(product?.price, 'Precio del producto'),
          integer(product?.mediaId, 'Imagen del producto'),
          integer(product?.sortOrder, 'Orden') ?? index * 10,
        ],
      )
    }
  }

  if (Array.isArray(body.serviceIds)) {
    await connection.query('DELETE FROM establishment_services WHERE establishment_id = ?', [id])
    for (const serviceId of new Set(body.serviceIds.map((value) => integer(value, 'servicio')))) {
      if (serviceId) {
        await connection.query(
          'INSERT IGNORE INTO establishment_services (establishment_id, service_id) VALUES (?, ?)',
          [id, serviceId],
        )
      }
    }
  }

  if (Array.isArray(body.paymentIds)) {
    await connection.query('DELETE FROM establishment_payments WHERE establishment_id = ?', [id])
    for (const paymentId of new Set(body.paymentIds.map((value) => integer(value, 'pago')))) {
      if (paymentId) {
        await connection.query(
          'INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) VALUES (?, ?)',
          [id, paymentId],
        )
      }
    }
  }

  if (Array.isArray(body.social)) {
    await connection.query('DELETE FROM establishment_social_links WHERE establishment_id = ?', [id])
    for (const [index, link] of body.social.entries()) {
      const url = text(link?.url, 'Enlace social', { max: 500 })
      if (!url) continue
      if (!PLATFORMS.has(link?.platform)) {
        throw new ApiError(400, 'VALIDATION', 'Red social no válida')
      }
      await connection.query(
        `INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order)
         VALUES (?, ?, ?, ?)`,
        [id, link.platform, url, index * 10],
      )
    }
  }

  if (Array.isArray(body.openingHours)) {
    await connection.query('DELETE FROM opening_hours WHERE establishment_id = ?', [id])
    for (const [index, slot] of body.openingHours.entries()) {
      const day = integer(slot?.dayOfWeek, 'día')
      if (!day || day < 1 || day > 7) {
        throw new ApiError(400, 'VALIDATION', 'Día de la semana inválido')
      }
      const closed = Boolean(slot.closed)
      await connection.query(
        `INSERT INTO opening_hours
           (establishment_id, day_of_week, opens_at, closes_at, is_closed, note, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          day,
          closed ? null : time(slot?.opensAt),
          closed ? null : time(slot?.closesAt),
          closed ? 1 : 0,
          text(slot?.note, 'Nota de horario', { max: 160 }),
          integer(slot?.sortOrder, 'Orden') ?? index,
        ],
      )
    }
  }

  if (Array.isArray(body.openingHoursExceptions)) {
    await connection.query(
      'DELETE FROM opening_hours_exceptions WHERE establishment_id = ?',
      [id],
    )
    for (const exception of body.openingHoursExceptions) {
      if (!exception?.date) continue
      const closed = Boolean(exception.closed)
      await connection.query(
        `INSERT INTO opening_hours_exceptions
           (establishment_id, exception_date, is_closed, opens_at, closes_at, note)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          String(exception.date).slice(0, 10),
          closed ? 1 : 0,
          closed ? null : time(exception?.opensAt),
          closed ? null : time(exception?.closesAt),
          text(exception?.note, 'Nota de la excepción', { max: 160 }),
        ],
      )
    }
  }

  if (Array.isArray(body.relatedIds)) {
    await connection.query('DELETE FROM establishment_relations WHERE establishment_id = ?', [id])
    const related = [...new Set(body.relatedIds.map((value) => integer(value, 'relacionado')))]
      .filter((value) => value && value !== id)
    for (const [index, relatedId] of related.entries()) {
      await connection.query(
        `INSERT IGNORE INTO establishment_relations
           (establishment_id, related_establishment_id, sort_order)
         VALUES (?, ?, ?)`,
        [id, relatedId, index * 10],
      )
    }
  }
}

router.post(
  '/admin/establishments/:id/publish',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = integer(req.params.id, 'id')
    const published =
      typeof req.body?.published === 'boolean'
        ? req.body.published
        : booleanParam(req.body?.published)
    if (published === null) {
      throw new ApiError(400, 'VALIDATION', 'Indica si se publica o no')
    }
    if (published && req.admin.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Solo un administrador puede publicar fichas')
    }

    const updatedAt = await withTransaction(async (connection) => {
      const [rows] = await connection.query(
        'SELECT id, is_published, published_at FROM establishments WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
        [id],
      )
      const current = rows[0]
      if (!current) throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')

      if (published) {
        const [covers] = await connection.query(
          `SELECT i.id FROM establishment_images i
           JOIN media m ON m.id = i.media_id
           WHERE i.establishment_id = ? AND i.role = 'cover'
             AND COALESCE(NULLIF(i.alt_override, ''), m.alt_text) IS NOT NULL
           LIMIT 1`,
          [id],
        )
        if (covers.length === 0) {
          throw new ApiError(
            409,
            'MISSING_COVER',
            'Para publicar, la ficha necesita una portada con texto alternativo',
          )
        }
      }

      await connection.query(
        `UPDATE establishments
         SET is_published = ?, published_at = COALESCE(published_at, ?)
         WHERE id = ?`,
        [published ? 1 : 0, published ? new Date() : null, id],
      )

      await connection.query(
        'UPDATE search_documents SET is_published = ? WHERE entity_type = ? AND entity_id = ?',
        [published ? 1 : 0, 'establishment', id],
      )

      await recordAudit(connection, req, {
        action: published ? 'publish' : 'unpublish',
        entityType: 'establishment',
        entityId: id,
        changes: { is_published: { from: Boolean(current.is_published), to: published } },
      })

      const [updated] = await connection.query(
        'SELECT updated_at FROM establishments WHERE id = ?',
        [id],
      )
      return updated[0].updated_at
    })

    res.json({ data: { id, published, updatedAt } })
  }),
)

router.delete(
  '/admin/establishments/:id',
  requireAuth,
  requireAdmin('admin'),
  asyncHandler(async (req, res) => {
    const id = integer(req.params.id, 'id')
    await withTransaction(async (connection) => {
      const [rows] = await connection.query(
        'SELECT id FROM establishments WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
        [id],
      )
      if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')

      await connection.query(
        'UPDATE establishments SET deleted_at = NOW(), is_published = 0 WHERE id = ?',
        [id],
      )
      await connection.query(
        'DELETE FROM search_documents WHERE entity_type = ? AND entity_id = ?',
        ['establishment', id],
      )
      await recordAudit(connection, req, {
        action: 'delete',
        entityType: 'establishment',
        entityId: id,
        changes: { deleted: true },
      })
    })
    res.status(204).end()
  }),
)

// ---------------------------------------------------------------------------
// Imágenes
// ---------------------------------------------------------------------------

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.media.maxUploadMb * 1024 * 1024, files: 1 },
})

function receiveImage(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next()
      return
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new ApiError(413, 'FILE_TOO_LARGE', 'La imagen supera el tamaño máximo permitido'))
      return
    }
    next(new ApiError(400, 'UPLOAD_ERROR', 'No se pudo recibir la imagen'))
  })
}

router.post(
  '/admin/media',
  requireAuth,
  receiveImage,
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer) {
      throw new ApiError(400, 'VALIDATION', 'Falta el archivo de la imagen')
    }

    const establishmentId = integer(req.body.establishmentId, 'Establecimiento')
    if (!establishmentId) {
      throw new ApiError(400, 'VALIDATION', 'Falta el establecimiento de la imagen')
    }
    const establishment = await queryOne(
      'SELECT id FROM establishments WHERE id = ? AND deleted_at IS NULL',
      [establishmentId],
    )
    if (!establishment) throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')

    const role = IMAGE_ROLES.has(req.body.role) ? req.body.role : 'gallery'
    await assertQuota(req.file.size)
    await ensureDir(mediaRoot())

    const stored = await storeImage(req.file.buffer, {
      folder: `establishments/${establishmentId}`,
      role,
    })

    const mediaId = await withTransaction(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO media
           (storage_disk, storage_path, public_url, mime_type, width_px, height_px,
            alt_text, caption, credit, source, checksum_sha256)
         VALUES ('local', ?, ?, ?, ?, ?, ?, ?, ?, 'upload', ?)`,
        [
          stored.storagePath,
          stored.publicUrl,
          stored.mimeType,
          stored.width,
          stored.height,
          text(req.body.altText, 'Texto alternativo', { max: 255 }),
          text(req.body.caption, 'Pie de foto', { max: 500 }),
          text(req.body.credit, 'Crédito', { max: 255 }),
          stored.checksum,
        ],
      )

      const [sortRows] = await connection.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM establishment_images WHERE establishment_id = ?',
        [establishmentId],
      )
      const sortOrder = Number(sortRows[0]?.max_order ?? 0) + 10

      if (role === 'cover') {
        await connection.query(
          `UPDATE establishment_images SET role = 'gallery'
           WHERE establishment_id = ? AND role = 'cover'`,
          [establishmentId],
        )
      }

      await connection.query(
        `INSERT INTO establishment_images (establishment_id, media_id, role, sort_order)
         VALUES (?, ?, ?, ?)`,
        [establishmentId, result.insertId, role, sortOrder],
      )

      await recordAudit(connection, req, {
        action: 'upload_media',
        entityType: 'establishment',
        entityId: establishmentId,
        changes: { mediaId: result.insertId, role, path: stored.storagePath },
      })

      return result.insertId
    })

    res.status(201).json({
      data: {
        id: toNumber(mediaId),
        url: stored.publicUrl,
        width: stored.width,
        height: stored.height,
        mimeType: stored.mimeType,
        bytes: stored.bytes,
        variants: stored.variants,
        role,
      },
    })
  }),
)

router.patch(
  '/admin/media/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = integer(req.params.id, 'id')
    const current = await queryOne('SELECT id FROM media WHERE id = ?', [id])
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')

    await withTransaction(async (connection) => {
      await connection.query(
        'UPDATE media SET alt_text = ?, caption = ?, credit = ? WHERE id = ?',
        [
          text(req.body?.altText, 'Texto alternativo', { max: 255 }),
          text(req.body?.caption, 'Pie de foto', { max: 500 }),
          text(req.body?.credit, 'Crédito', { max: 255 }),
          id,
        ],
      )
      await recordAudit(connection, req, {
        action: 'update_media',
        entityType: 'media',
        entityId: id,
        changes: { altText: req.body?.altText ?? null },
      })
    })

    res.json({ data: { id } })
  }),
)

router.delete(
  '/admin/media/:id',
  requireAuth,
  requireAdmin('admin'),
  asyncHandler(async (req, res) => {
    const id = integer(req.params.id, 'id')
    const media = await queryOne(
      'SELECT id, storage_path FROM media WHERE id = ?',
      [id],
    )
    if (!media) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')

    const usage = await queryOne(
      `SELECT
         (SELECT COUNT(*) FROM establishment_images WHERE media_id = ?) +
         (SELECT COUNT(*) FROM establishment_products WHERE media_id = ?) AS total`,
      [id, id],
    )
    if (Number(usage?.total ?? 0) > 0) {
      throw new ApiError(
        409,
        'MEDIA_IN_USE',
        'La imagen está en uso; quítala de la ficha antes de borrarla',
      )
    }

    await query('DELETE FROM media WHERE id = ?', [id])
    await removeImageFiles(media.storage_path)
    await withTransaction((connection) =>
      recordAudit(connection, req, {
        action: 'delete_media',
        entityType: 'media',
        entityId: id,
        changes: { storagePath: media.storage_path },
      }),
    )

    res.status(204).end()
  }),
)

router.post(
  '/admin/establishments/:id/images',
  requireAuth,
  asyncHandler(async (req, res) => {
    const establishmentId = integer(req.params.id, 'id')
    const mediaId = integer(req.body?.mediaId, 'Imagen')
    const role = IMAGE_ROLES.has(req.body?.role) ? req.body.role : 'gallery'
    if (!mediaId) throw new ApiError(400, 'VALIDATION', 'Falta la imagen')

    const [establishment, media] = await Promise.all([
      queryOne('SELECT id FROM establishments WHERE id = ? AND deleted_at IS NULL', [establishmentId]),
      queryOne('SELECT id FROM media WHERE id = ?', [mediaId]),
    ])
    if (!establishment) throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')
    if (!media) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')

    const imageId = await withTransaction(async (connection) => {
      if (role === 'cover') {
        await connection.query(
          `UPDATE establishment_images SET role = 'gallery'
           WHERE establishment_id = ? AND role = 'cover'`,
          [establishmentId],
        )
      }
      const [sortRows] = await connection.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_order FROM establishment_images WHERE establishment_id = ?',
        [establishmentId],
      )
      const [result] = await connection.query(
        `INSERT INTO establishment_images (establishment_id, media_id, role, sort_order)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order)`,
        [establishmentId, mediaId, role, Number(sortRows[0]?.max_order ?? 0) + 10],
      )
      await recordAudit(connection, req, {
        action: 'link_media',
        entityType: 'establishment',
        entityId: establishmentId,
        changes: { mediaId, role },
      })
      return result.insertId
    })

    res.status(201).json({ data: { imageId: toNumber(imageId) } })
  }),
)

router.patch(
  '/admin/establishments/:id/images/:imageId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const establishmentId = integer(req.params.id, 'id')
    const imageId = integer(req.params.imageId, 'imageId')

    await withTransaction(async (connection) => {
      const [rows] = await connection.query(
        'SELECT * FROM establishment_images WHERE id = ? AND establishment_id = ? FOR UPDATE',
        [imageId, establishmentId],
      )
      const current = rows[0]
      if (!current) throw new ApiError(404, 'NOT_FOUND', 'Imagen de la ficha no encontrada')

      const role = IMAGE_ROLES.has(req.body?.role) ? req.body.role : current.role
      if (role === 'cover' && current.role !== 'cover') {
        await connection.query(
          `UPDATE establishment_images SET role = 'gallery'
           WHERE establishment_id = ? AND role = 'cover'`,
          [establishmentId],
        )
      }

      await connection.query(
        `UPDATE establishment_images SET role = ?, sort_order = ?, alt_override = ?
         WHERE id = ?`,
        [
          role,
          integer(req.body?.sortOrder, 'Orden') ?? current.sort_order,
          text(req.body?.altOverride, 'Texto alternativo', { max: 255 }),
          imageId,
        ],
      )

      await recordAudit(connection, req, {
        action: 'reorder_media',
        entityType: 'establishment_image',
        entityId: imageId,
        changes: { role, sortOrder: req.body?.sortOrder ?? current.sort_order },
      })
    })

    res.json({ data: { imageId } })
  }),
)

router.delete(
  '/admin/establishments/:id/images/:imageId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const establishmentId = integer(req.params.id, 'id')
    const imageId = integer(req.params.imageId, 'imageId')
    await withTransaction(async (connection) => {
      const [result] = await connection.query(
        'DELETE FROM establishment_images WHERE id = ? AND establishment_id = ?',
        [imageId, establishmentId],
      )
      if (result.affectedRows === 0) {
        throw new ApiError(404, 'NOT_FOUND', 'Imagen de la ficha no encontrada')
      }
      await recordAudit(connection, req, {
        action: 'unlink_media',
        entityType: 'establishment',
        entityId: establishmentId,
        changes: { imageId },
      })
    })
    res.status(204).end()
  }),
)

router.put(
  '/admin/establishments/:id/images/order',
  requireAuth,
  asyncHandler(async (req, res) => {
    const establishmentId = integer(req.params.id, 'id')
    const items = Array.isArray(req.body?.items) ? req.body.items : null
    if (!items) throw new ApiError(400, 'VALIDATION', 'Falta el orden de las imágenes')

    await withTransaction(async (connection) => {
      for (const [index, item] of items.entries()) {
        const imageId = integer(item?.imageId, 'imageId')
        if (!imageId) continue
        await connection.query(
          'UPDATE establishment_images SET sort_order = ? WHERE id = ? AND establishment_id = ?',
          [integer(item?.sortOrder, 'Orden') ?? index * 10, imageId, establishmentId],
        )
      }
      await recordAudit(connection, req, {
        action: 'reorder_media',
        entityType: 'establishment',
        entityId: establishmentId,
        changes: { order: items.map((item) => item?.imageId) },
      })
    })

    res.json({ data: { ok: true } })
  }),
)

router.get(
  '/admin/media/stats',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const { bytes, files } = await usageBytes()
    res.json({
      data: {
        usedBytes: bytes,
        files,
        quotaBytes: config.media.quotaMb * 1024 * 1024,
        maxUploadBytes: config.media.maxUploadMb * 1024 * 1024,
      },
    })
  }),
)

export default router
