// Cola de envíos sin conexión: calificaciones y sugerencias.
//
// Cuando el visitante envía una calificación o una sugerencia sin señal, el
// POST no se pierde en un «Failed to fetch»: se guarda en localStorage con su
// URL y su cuerpo, y se reintenta solo cuando el navegador vuelve a estar en
// línea. Los errores propios del servidor (4xx) no se encolan: esos no se
// arreglan reintentando y se descartan para no bloquear la cola.
const KEY = 'gramalote-outbox'
const EVENT = 'gramalote:outbox'

export const OFFLINE_MESSAGE =
  'No hay conexión. Guardamos tu envío en este dispositivo y lo enviaremos automáticamente cuando vuelva la señal.'

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function write(items) {
  try {
    if (items.length) localStorage.setItem(KEY, JSON.stringify(items))
    else localStorage.removeItem(KEY)
  } catch {
    // Navegación privada o almacenamiento lleno: no hay dónde guardar.
  }
}

function notify(detail) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

// Suscribe un componente a los avisos de la cola (envíos reenviados, etc.).
export function onOutbox(listener) {
  const handler = (event) => listener(event.detail)
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}

export function outboxCount() {
  return read().length
}

// Un fetch lanzado sin red falla con TypeError («Failed to fetch»). Además del
// tipo se miran los textos que usan los navegadores y el propio navigator.
export function isNetworkFailure(error) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  if (error instanceof TypeError) return true
  const text = String(error?.message || error || '')
  return /failed to fetch|networkerror|network error|load failed|network request failed|fetch failed/i.test(text)
}

export function enqueue(url, body) {
  const items = read()
  items.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    body,
    createdAt: new Date().toISOString(),
  })
  write(items)
  notify({ queued: items.length, sent: 0, rejected: 0, pending: items.length })
  return items.length
}

let flushing = null

// Reenvía lo guardado. Devuelve { sent, rejected, pending }.
export async function flushOutbox() {
  if (flushing) return flushing
  const items = read()
  if (!items.length) return { sent: 0, rejected: 0, pending: 0 }

  flushing = (async () => {
    const kept = []
    let sent = 0
    let rejected = 0
    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(item.body),
        })
        if (response.ok) {
          sent += 1
          continue
        }
        // 4xx salvo timeout o límite de peticiones: reintentar no va a servir.
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          rejected += 1
          continue
        }
        kept.push(item)
      } catch (error) {
        if (!isNetworkFailure(error)) {
          rejected += 1
          continue
        }
        // Sigue sin haber red: se conserva este y los que faltan.
        kept.push(item)
      }
    }
    write(kept)
    return { sent, rejected, pending: kept.length }
  })()

  try {
    const result = await flushing
    if (result.sent || result.rejected) notify(result)
    return result
  } finally {
    flushing = null
  }
}

let started = false

// Arranca el reenvío automático: al recuperar la señal y al abrir el sitio.
export function startOutbox() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('online', () => {
    flushOutbox()
  })
  if (outboxCount()) window.setTimeout(() => flushOutbox(), 1200)
}
