// Sesión del panel de administración.
// El access token vive en memoria; el refresh token va en una cookie httpOnly
// del servidor, así que al recargar la página la sesión se renueva sola.

export class AuthError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AuthError'
  }
}

let accessToken = null
let currentUser = null

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response
  try {
    response = await fetch(`/api/auth${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    })
  } catch {
    throw new AuthError('No se pudo conectar con el servidor')
  }

  if (response.status === 204) return null

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Respuesta no JSON (por ejemplo, el fallback de la SPA si falta la API).
  }

  if (!response.ok) {
    throw new AuthError(payload?.error?.message ?? 'No se pudo completar la operación')
  }
  return payload?.data ?? null
}

function applySession(data) {
  accessToken = data?.accessToken ?? null
  currentUser = data?.user ?? null
  return currentUser
}

export async function login(email, password) {
  const data = await request('/login', { method: 'POST', body: { email, password } })
  return applySession(data)
}

export async function refreshSession() {
  try {
    const data = await request('/refresh', { method: 'POST' })
    return applySession(data)
  } catch {
    applySession(null)
    return null
  }
}

export async function ensureSession() {
  if (accessToken && currentUser) return currentUser
  if (accessToken) {
    try {
      currentUser = await request('/me', { auth: true })
      return currentUser
    } catch {
      accessToken = null
    }
  }
  return refreshSession()
}

export async function logout() {
  try {
    await request('/logout', { method: 'POST' })
  } catch {
    // Sin conexión: igual se limpia la sesión local.
  }
  applySession(null)
}

export function getUser() {
  return currentUser
}
