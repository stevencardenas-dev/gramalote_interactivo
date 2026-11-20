import { ApiError } from './http.js'

// Control de ediciones simultáneas: el panel manda el `updatedAt` de lo que cargó y, si
// otra persona guardó el mismo registro en el entretanto, se rechaza el guardado en vez de
// pisarle los cambios. Sin `updatedAt` (undefined) no se comprueba. Con `null` el panel
// avisa de que cargó algo que aún no estaba guardado: si ya existe, también es un choque.
// Se compara al segundo, que es la resolución de updated_at.
const MESSAGE = 'Otra persona guardó esto mientras lo editabas. Recarga para ver sus cambios.'

export function assertFresh(expected, actual) {
  if (expected === undefined) return
  if (expected === null) {
    if (actual) throw new ApiError(409, 'CONFLICT', MESSAGE)
    return
  }
  const wanted = Math.floor(new Date(expected).getTime() / 1000)
  const current = Math.floor(new Date(actual).getTime() / 1000)
  if (Number.isFinite(wanted) && Number.isFinite(current) && wanted !== current) {
    throw new ApiError(409, 'CONFLICT', MESSAGE)
  }
}
