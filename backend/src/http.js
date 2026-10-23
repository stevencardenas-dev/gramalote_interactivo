export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export function pagination(query) {
  const rawLimit = Number.parseInt(query.limit ?? '', 10)
  const rawOffset = Number.parseInt(query.offset ?? '', 10)
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 100)
    : 24
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0
  return { limit, offset }
}

export function stringParam(value, { max = 160 } = {}) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export function booleanParam(value) {
  if (value === '1' || value === 'true') return true
  if (value === '0' || value === 'false') return false
  return null
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `No existe la ruta ${req.method} ${req.originalUrl}`,
    },
  })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    })
    return
  }

  console.error(error)
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'No fue posible completar la solicitud',
    },
  })
}
