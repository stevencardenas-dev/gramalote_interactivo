const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export async function fetchRating(kind, slug, signal) {
  const response = await fetch(`${API_URL}/ratings/${kind}/${encodeURIComponent(slug)}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`La API respondió ${response.status}`)
  return (await response.json()).data
}

export async function sendRating(kind, slug, body) {
  const response = await fetch(`${API_URL}/ratings/${kind}/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'No pudimos guardar tu calificación')
  }
  return payload.data
}

export async function fetchTopRated({ exclude, category, limit = 3 }, signal) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (exclude) params.set('exclude', exclude)
  if (category) params.set('category', category)
  const response = await fetch(`${API_URL}/ratings/top?${params}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) throw new Error(`La API respondió ${response.status}`)
  return (await response.json()).data
}
