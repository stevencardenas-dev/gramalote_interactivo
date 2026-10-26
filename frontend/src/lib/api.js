const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function getJson(path, { signal } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status}`)
  }
  return response.json()
}
