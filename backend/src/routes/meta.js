import { Router } from 'express'
import { query, queryOne } from '../db.js'
import { asyncHandler } from '../http.js'
import { parseJson } from '../serializers.js'

const router = Router()

router.get(
  '/meta',
  asyncHandler(async (_req, res) => {
    const [categories, types, zones, services, payments, experienceCategories] =
      await Promise.all([
        query(
          `SELECT id, slug, name, sort_order
           FROM establishment_categories
           ORDER BY sort_order, id`,
        ),
        query(
          `SELECT id, category_id, slug, name, filter_group, sort_order
           FROM establishment_types
           ORDER BY category_id, sort_order, id`,
        ),
        query(
          `SELECT id, slug, name, color, geojson, sort_order
           FROM zones
           ORDER BY sort_order, id`,
        ),
        query(`SELECT id, slug, name, icon, sort_order FROM services ORDER BY sort_order, id`),
        query(
          `SELECT id, slug, name, sort_order
           FROM payment_methods
           ORDER BY sort_order, id`,
        ),
        query(
          `SELECT id, slug, name, sort_order
           FROM experience_categories
           ORDER BY sort_order, id`,
        ),
      ])

    const typesByCategory = new Map()
    for (const type of types) {
      const current = typesByCategory.get(type.category_id) ?? []
      current.push({
        id: Number(type.id),
        slug: type.slug,
        name: type.name,
        filterGroup: type.filter_group ?? null,
        sortOrder: Number(type.sort_order),
      })
      typesByCategory.set(type.category_id, current)
    }

    res.json({
      data: {
        establishmentCategories: categories.map((category) => ({
          id: Number(category.id),
          slug: category.slug,
          name: category.name,
          sortOrder: Number(category.sort_order),
          types: typesByCategory.get(category.id) ?? [],
        })),
        zones: zones.map((zone) => ({
          id: Number(zone.id),
          slug: zone.slug,
          name: zone.name,
          color: zone.color,
          geojson: parseJson(zone.geojson, null),
          sortOrder: Number(zone.sort_order),
        })),
        services: services.map((service) => ({
          id: Number(service.id),
          slug: service.slug,
          name: service.name,
          icon: service.icon ?? null,
          sortOrder: Number(service.sort_order),
        })),
        paymentMethods: payments.map((payment) => ({
          id: Number(payment.id),
          slug: payment.slug,
          name: payment.name,
          sortOrder: Number(payment.sort_order),
        })),
        experienceCategories: experienceCategories.map((category) => ({
          id: Number(category.id),
          slug: category.slug,
          name: category.name,
          sortOrder: Number(category.sort_order),
        })),
      },
    })
  }),
)

router.get(
  '/site',
  asyncHandler(async (_req, res) => {
    const settings = await query(
      `SELECT setting_key, setting_value
       FROM site_settings
       ORDER BY setting_key`,
    )
    const navigation = await query(
      `SELECT id, location, label, path, parent_id, sort_order, is_external
       FROM navigation_items
       WHERE is_published = 1
       ORDER BY location, sort_order, id`,
    )

    const values = Object.fromEntries(
      settings.map((setting) => [
        setting.setting_key,
        parseJson(setting.setting_value, null),
      ]),
    )

    const byLocation = {}
    for (const item of navigation) {
      const group = (byLocation[item.location] ??= [])
      group.push({
        id: Number(item.id),
        label: item.label,
        path: item.path,
        parentId: item.parent_id === null ? null : Number(item.parent_id),
        sortOrder: Number(item.sort_order),
        external: Boolean(item.is_external),
      })
    }

    res.json({ data: { settings: values, navigation: byLocation } })
  }),
)

router.get(
  '/settings/:key',
  asyncHandler(async (req, res, next) => {
    const row = await queryOne(
      'SELECT setting_key, setting_value FROM site_settings WHERE setting_key = ?',
      [req.params.key],
    )
    if (!row) {
      next()
      return
    }
    res.json({
      data: {
        key: row.setting_key,
        value: parseJson(row.setting_value, null),
      },
    })
  }),
)

export default router
