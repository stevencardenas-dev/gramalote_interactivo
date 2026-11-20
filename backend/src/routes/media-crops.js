import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'

// Encuadre de las fotos por espacio. Un mismo archivo se muestra en espacios de
// proporciones distintas (p. ej. los cinco del collage de «Dónde dormir»), así que
// cada foto guarda un encuadre por espacio: {"<espacio>": {w, l, t}} con el ancho de
// la foto y su posición en % del marco. Las páginas públicas piden la lista una vez
// y aplican a cada <img> el encuadre de su espacio.
//
// La clave de una foto es su ruta sin extensión ni sufijo de ancho (-480, -960): la
// foto grande y sus variantes comparten encuadre. (Hay una copia de cropKey en
// frontend/src/lib/mediaCrops.js y de los espacios en frontend/src/lib/photoFrames.js.)

const router = Router()

export function cropKey(url) {
  const pathname = String(url ?? '').split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/i, '')
  return pathname.replace(/\.[a-z0-9]+$/i, '').replace(/-\d+$/, '')
}

function parseFrames(raw) {
  try {
    const parsed = JSON.parse(raw ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function number(value, label, min, max) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new ApiError(400, 'VALIDATION', `${label} no es válido`)
  }
  return Math.round(parsed * 100) / 100
}

router.get(
  '/media-crops',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT public_url, crop_frames FROM media WHERE crop_frames IS NOT NULL AND public_url IS NOT NULL`,
    )
    const data = {}
    for (const row of rows) {
      const frames = parseFrames(row.crop_frames)
      if (Object.keys(frames).length > 0) data[cropKey(row.public_url)] = frames
    }
    // Siempre se revalida (la respuesta es pequeña y lleva ETag): con una caché de
    // minutos, un encuadre recién guardado no se veía en la ficha al recargarla.
    res.set('Cache-Control', 'no-cache')
    res.json({ data })
  }),
)

// Guarda (o borra con crop: null) el encuadre de la foto `url` en el espacio `frame`.
router.put(
  '/admin/media-crop',
  requireAuth,
  asyncHandler(async (req, res) => {
    const url = typeof req.body?.url === 'string' ? req.body.url : ''
    const frame = typeof req.body?.frame === 'string' ? req.body.frame.trim() : ''
    if (!url || !/^[a-z0-9-]{1,60}$/.test(frame)) throw new ApiError(400, 'VALIDATION', 'Falta la foto o el espacio')
    const key = cropKey(url)
    const media = await queryOne(
      `SELECT id, crop_frames FROM media WHERE public_url = ? OR public_url LIKE ? LIMIT 1`,
      [url, `%/${key.split('/').pop()}.%`],
    )
    if (!media) throw new ApiError(404, 'NOT_FOUND', 'Foto no encontrada')

    const frames = parseFrames(media.crop_frames)
    const crop = req.body?.crop
    if (crop === null) delete frames[frame]
    else {
      frames[frame] = {
        w: number(crop?.w, 'El ancho', 5, 1000),
        l: number(crop?.l, 'La posición horizontal', -1000, 1000),
        t: number(crop?.t, 'La posición vertical', -1000, 1000),
      }
    }
    const value = Object.keys(frames).length > 0 ? JSON.stringify(frames) : null
    await query('UPDATE media SET crop_frames = ? WHERE id = ?', [value, media.id])
    res.json({ data: { key, frames } })
  }),
)

export default router
