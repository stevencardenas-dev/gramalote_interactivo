import { Router } from 'express'
import { query, queryOne } from '../db.js'
import { asyncHandler } from '../http.js'
import { mediaFromRow, toNumber } from '../serializers.js'

const router = Router()

const MEDIA_COLUMNS = `
  m.id AS media_id, m.public_url, m.alt_text, m.caption, m.credit,
  m.mime_type, m.width_px, m.height_px`

router.get(
  '/practical',
  asyncHandler(async (_req, res) => {
    const [routes, transport, safety, preparation, contacts, location] =
      await Promise.all([
        query(
          `SELECT r.id, r.title, r.description, r.cta_label, r.cta_url,
                  r.sort_order, ${MEDIA_COLUMNS}
           FROM access_routes r
           LEFT JOIN media m ON m.id = r.media_id
           WHERE r.is_published = 1
           ORDER BY r.sort_order, r.id`,
        ),
        query(
          `SELECT t.id, t.title, t.description, t.sort_order, ${MEDIA_COLUMNS}
           FROM transport_options t
           LEFT JOIN media m ON m.id = t.media_id
           WHERE t.is_published = 1
           ORDER BY t.sort_order, t.id`,
        ),
        query(
          `SELECT id, title, description, icon, sort_order
           FROM safety_tips
           WHERE is_published = 1
           ORDER BY sort_order, id`,
        ),
        query(
          `SELECT id, title, description, icon, sort_order
           FROM preparation_tips
           WHERE is_published = 1
           ORDER BY sort_order, id`,
        ),
        query(
          `SELECT c.id, c.title, c.description, c.phone, c.phone_secondary,
                  c.email, c.hours, c.sort_order, ${MEDIA_COLUMNS}
           FROM useful_contacts c
           LEFT JOIN media m ON m.id = c.media_id
           WHERE c.is_published = 1
           ORDER BY c.sort_order, c.id`,
        ),
        queryOne(
          `SELECT id, title, description, address, latitude, longitude,
                  map_url, updated_at
           FROM location_info
           ORDER BY id
           LIMIT 1`,
        ),
      ])

    res.json({
      data: {
        routes: routes.map((route) => ({
          id: toNumber(route.id),
          title: route.title,
          description: route.description,
          ctaLabel: route.cta_label ?? null,
          ctaUrl: route.cta_url ?? null,
          media: mediaFromRow(route),
          sortOrder: Number(route.sort_order),
        })),
        transport: transport.map((option) => ({
          id: toNumber(option.id),
          title: option.title,
          description: option.description,
          media: mediaFromRow(option),
          sortOrder: Number(option.sort_order),
        })),
        safetyTips: safety.map((tip) => ({
          id: toNumber(tip.id),
          title: tip.title,
          description: tip.description,
          icon: tip.icon ?? null,
          sortOrder: Number(tip.sort_order),
        })),
        preparationTips: preparation.map((tip) => ({
          id: toNumber(tip.id),
          title: tip.title,
          description: tip.description,
          icon: tip.icon ?? null,
          sortOrder: Number(tip.sort_order),
        })),
        contacts: contacts.map((contact) => ({
          id: toNumber(contact.id),
          title: contact.title,
          description: contact.description,
          phone: contact.phone ?? null,
          phoneSecondary: contact.phone_secondary ?? null,
          email: contact.email ?? null,
          hours: contact.hours ?? null,
          media: mediaFromRow(contact),
          sortOrder: Number(contact.sort_order),
        })),
        location: location
          ? {
              id: toNumber(location.id),
              title: location.title,
              description: location.description,
              address: location.address ?? null,
              coordinates:
                location.latitude === null || location.longitude === null
                  ? null
                  : {
                      latitude: Number(location.latitude),
                      longitude: Number(location.longitude),
                    },
              mapUrl: location.map_url ?? null,
              updatedAt: location.updated_at ?? null,
            }
          : null,
      },
    })
  }),
)

export default router
