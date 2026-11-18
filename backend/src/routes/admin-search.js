import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query } from '../db.js'
import { asyncHandler } from '../http.js'

// Buscador del inicio del panel: coincidencias en todo lo que se edita desde el
// panel (establecimientos, experiencias, patrimonio, extras y, para un
// administrador, usuarios), agrupadas y con la ruta de su ficha.

const router = Router()
const LIMIT = 5

function like(term) {
  return `%${term.replace(/[\\%_]/g, '\\$&')}%`
}

router.get(
  '/admin/search',
  requireAuth,
  asyncHandler(async (req, res) => {
    const term = String(req.query.q ?? '').trim().slice(0, 80)
    if (term.length < 2) {
      res.json({ data: { groups: [] } })
      return
    }
    const pattern = like(term)
    const isAdmin = req.admin?.role === 'admin'

    const [establishments, experiences, heritage, extras, users] = await Promise.all([
      query(
        `SELECT e.id, e.name, e.slug, c.name AS category, e.is_published
         FROM establishments e JOIN establishment_categories c ON c.id = e.category_id
         WHERE e.deleted_at IS NULL AND (e.name LIKE ? OR e.slug LIKE ? OR e.address LIKE ?)
         ORDER BY e.is_published DESC, e.name LIMIT ${LIMIT}`,
        [pattern, pattern, pattern],
      ),
      query(
        `SELECT id, title AS name, slug, is_published FROM experiences
         WHERE title LIKE ? OR slug LIKE ?
         ORDER BY is_published DESC, title LIMIT ${LIMIT}`,
        [pattern, pattern],
      ),
      query(
        `SELECT id, name, slug, category, matrix_ref, is_published FROM heritage_sites
         WHERE name LIKE ? OR slug LIKE ? OR matrix_ref LIKE ? OR category LIKE ?
         ORDER BY is_published DESC, name LIMIT ${LIMIT}`,
        [pattern, pattern, pattern, pattern],
      ),
      query(
        `SELECT id, name, slug, category, matrix_ref, is_published FROM map_extras
         WHERE name LIKE ? OR slug LIKE ? OR matrix_ref LIKE ? OR category LIKE ?
         ORDER BY is_published DESC, name LIMIT ${LIMIT}`,
        [pattern, pattern, pattern, pattern],
      ),
      isAdmin
        ? query(
            `SELECT id, name, email, role FROM admin_users
             WHERE deleted_at IS NULL AND (name LIKE ? OR email LIKE ?)
             ORDER BY name LIMIT ${LIMIT}`,
            [pattern, pattern],
          )
        : Promise.resolve([]),
    ])

    const groups = [
      {
        key: 'establecimientos',
        label: 'Establecimientos',
        more: `/admin/lugares/establecimientos?q=${encodeURIComponent(term)}`,
        items: establishments.map((row) => ({
          id: Number(row.id),
          name: row.name,
          sub: row.category,
          published: Boolean(row.is_published),
          to: `/admin/lugares/establecimientos/${row.id}`,
        })),
      },
      {
        key: 'experiencias',
        label: 'Experiencias',
        items: experiences.map((row) => ({
          id: Number(row.id),
          name: row.name,
          sub: 'Experiencia',
          published: Boolean(row.is_published),
          to: `/admin/lugares/experiencias/${row.id}`,
        })),
      },
      {
        key: 'patrimonio',
        label: 'Patrimonio',
        items: heritage.map((row) => ({
          id: Number(row.id),
          name: row.name,
          sub: [row.matrix_ref, row.category].filter(Boolean).join(' · '),
          published: Boolean(row.is_published),
          to: `/admin/lugares/patrimonio/${row.id}`,
        })),
      },
      {
        key: 'extras',
        label: 'Extras',
        items: extras.map((row) => ({
          id: Number(row.id),
          name: row.name,
          sub: [row.matrix_ref, row.category].filter(Boolean).join(' · '),
          published: Boolean(row.is_published),
          to: `/admin/lugares/extras/${row.id}`,
        })),
      },
      {
        key: 'usuarios',
        label: 'Usuarios',
        items: users.map((row) => ({
          id: Number(row.id),
          name: row.name,
          sub: `${row.email} · ${row.role === 'admin' ? 'Administrador' : 'Editor'}`,
          published: null,
          to: '/admin/usuarios',
        })),
      },
    ].filter((group) => group.items.length > 0)

    res.json({ data: { groups } })
  }),
)

export default router
