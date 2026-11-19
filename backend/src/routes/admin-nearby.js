import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query } from '../db.js'
import { asyncHandler } from '../http.js'

// Lugares muy cerca de unas coordenadas, en los cuatro tipos que van al mapa.
// El panel lo pide antes de guardar para avisar de puntos que se taparían en el
// mapa; es solo un aviso, el editor decide si guarda igual.

const router = Router()
const RADIUS_M = 10

function distanceMeters(lat1, lng1, lat2, lng2) {
  const rad = (value) => (value * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

router.get(
  '/admin/nearby',
  requireAuth,
  asyncHandler(async (req, res) => {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.json({ data: [] })
    const selfType = String(req.query.type ?? '')
    const selfId = Number(req.query.id ?? 0)

    // Caja de ~100 m para no traer toda la tabla; luego se mide en metros.
    const box = [lat - 0.001, lat + 0.001, lng - 0.001, lng + 0.001]
    const near = 'latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?'
    const [establishments, experiences, heritage, extras] = await Promise.all([
      query(
        `SELECT e.id, e.name, e.latitude, e.longitude, c.name AS kind
         FROM establishments e JOIN establishment_categories c ON c.id = e.category_id
         WHERE e.deleted_at IS NULL AND e.${near.replace(/ AND longitude/, ' AND e.longitude')}`,
        box,
      ),
      query(`SELECT id, title AS name, latitude, longitude FROM experiences WHERE deleted_at IS NULL AND ${near}`, box),
      query(`SELECT id, name, latitude, longitude FROM heritage_sites WHERE ${near}`, box),
      query(`SELECT id, name, latitude, longitude FROM map_extras WHERE ${near}`, box),
    ])

    const rows = [
      ...establishments.map((row) => ({ ...row, type: 'establishment', kind: row.kind })),
      ...experiences.map((row) => ({ ...row, type: 'experience', kind: 'Experiencia' })),
      ...heritage.map((row) => ({ ...row, type: 'heritage', kind: 'Patrimonio' })),
      ...extras.map((row) => ({ ...row, type: 'extra', kind: 'Extra' })),
    ]

    const data = rows
      .filter((row) => !(row.type === selfType && Number(row.id) === selfId))
      .map((row) => ({
        type: row.type,
        id: Number(row.id),
        name: row.name,
        kind: row.kind,
        distance: Math.round(distanceMeters(lat, lng, Number(row.latitude), Number(row.longitude))),
      }))
      .filter((row) => row.distance <= RADIUS_M)
      .sort((a, b) => a.distance - b.distance)

    res.json({ data })
  }),
)

export default router
