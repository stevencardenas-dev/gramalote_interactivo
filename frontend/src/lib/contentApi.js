// Datos públicos desde la API (MySQL). Las plantillas siguen recibiendo la
// forma que ya usaban con src/data; aquí se traduce la respuesta camelCase.
import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function request(path, signal) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) {
    throw new Error(`La API respondió ${response.status}`)
  }
  return response.json()
}

function joinPayments(payments) {
  if (!Array.isArray(payments) || payments.length === 0) return null
  return payments.map((payment) => payment.name).join(' · ')
}

// Platos y productos con su foto (o la portada si no tienen). Sin platos en la
// base, la ficha de comer muestra sus tarjetas genéricas.
function adaptFeatures(item, cover) {
  const rows = Array.isArray(item.features) ? item.features : []
  if (rows.length === 0) return undefined
  return rows.map((feature) => ({
    title: feature.title,
    text: feature.description,
    photo: feature.media?.url ?? cover,
  }))
}

function adaptProducts(item, cover) {
  const rows = Array.isArray(item.products) ? item.products : []
  return rows.map((product) => ({
    name: product.name,
    description: product.description ?? null,
    photo: product.media?.url ?? cover,
    price: product.price,
  }))
}

// Traduce una ficha de la API a la forma que esperan las plantillas.
// Las fotos viven en el servidor (/media, tabla media) y se cambian en el panel.
export function adaptEstablishment(item) {
  if (!item) return null
  const cover = item.cover?.url ?? null
  const hero = item.hero?.url ?? cover
  const heroes = (item.heroes ?? []).map((image) => image.url).filter(Boolean)
  const features = adaptFeatures(item, cover)
  const products = adaptProducts(item, cover)
  // Galería: las fotos con rol "galería" que no son de un plato o producto.
  const itemPhotos = new Set([...(features ?? []), ...products].map((row) => row.photo))
  const uploaded = (item.images ?? [])
    .filter((image) => image.role === 'gallery' && image.url && !itemPhotos.has(image.url))
    .map((image) => image.url)
  const gallery = uploaded.length > 0 ? uploaded : [...new Set([cover, hero].filter(Boolean))]

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category?.slug ?? null,
    type: item.type?.name ?? item.category?.name ?? '',
    filterGroup: item.type?.filterGroup ?? null,
    services: (item.services ?? []).map((service) => service.name),
    town: item.zone?.slug ?? null,
    summary: item.summary ?? '',
    description: item.description ?? '',
    hours: item.hours ?? null,
    checkin: item.checkin ?? null,
    address: item.address ?? null,
    coordinates: item.coordinates ?? null,
    mapsUrl: item.mapsUrl ?? null,
    payment: joinPayments(item.payments),
    phone: item.phone ?? null,
    phoneSecondary: item.phoneSecondary ?? null,
    whatsapp: item.whatsapp ?? null,
    email: item.email ?? null,
    website: item.website ?? null,
    priceRange: item.price?.text ?? null,
    openNow: Boolean(item.openNow),
    socialLinks: Array.isArray(item.social) ? item.social : [],
    photo: cover,
    hero,
    heroes: heroes.length > 0 ? heroes : [hero].filter(Boolean),
    gallery,
    features,
    products,
    related: (item.related ?? []).map((related) => related.slug),
    relatedItems: (item.related ?? []).map((related) => ({
      id: related.id,
      slug: related.slug,
      name: related.name,
      type: related.type?.name ?? related.category?.name ?? '',
      photo: related.cover?.url ?? null,
    })),
  }
}

export function useEstablishments(category) {
  const [state, setState] = useState({ data: [], loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ limit: '60' })
    if (category) params.set('category', category)

    request(`/establishments?${params.toString()}`, controller.signal)
      .then((payload) => {
        setState({
          data: (payload.data ?? []).map(adaptEstablishment).filter(Boolean),
          loading: false,
          error: null,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({
          data: [],
          loading: false,
          error: 'No pudimos cargar los establecimientos. Intenta de nuevo en un momento.',
        })
      })

    return () => controller.abort()
  }, [category])

  return state
}

export function useEstablishment(slug) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    request(`/establishments/${encodeURIComponent(slug)}`, controller.signal)
      .then((payload) => {
        setState({
          data: adaptEstablishment(payload.data),
          loading: false,
          error: null,
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setState({ data: null, loading: false, error })
      })

    return () => controller.abort()
  }, [slug])

  return state
}

// Selección editorial: primero los slugs del diseño, luego el resto de la
// categoría, para que una ficha nueva publicada desde el panel no quede oculta.
export function orderBySlugs(items, slugs) {
  const preferred = slugs
    .map((slug) => items.find((item) => item.slug === slug))
    .filter(Boolean)
  const rest = items.filter((item) => !preferred.includes(item))
  return [...preferred, ...rest]
}

// Experiencias de «Qué hacer» (editables en /admin/experiencias). Si la API
// falla se usa la copia de src/data/experiences.js.
export function adaptActivity(item) {
  if (!item?.slug) return null
  const images = Array.isArray(item.images) ? item.images : []
  const cover = item.cover?.url ?? images[0]?.url ?? null
  const gallery = images
    .filter((image) => image.role === 'gallery')
    .map((image) => ({ src: image.url, alt: image.alt ?? item.title }))
  return {
    slug: item.slug,
    title: item.title,
    category: item.category?.name ?? '',
    text: item.cardText ?? item.summary,
    meta: item.meta ?? '',
    photo: gallery[0]?.src ?? cover,
    hero: cover,
    openDaily: Boolean(item.openDaily),
    summary: item.summary,
    description: item.description,
    info: {
      access: item.access,
      difficulty: item.difficultyText,
      hours: item.hours,
      location: item.address,
      fee: item.price,
      phone: item.phone,
    },
    gallery,
    tips: (item.tips ?? []).map((tip) => ({
      icon: tip.icon ?? 'info',
      title: tip.title,
      text: tip.description ?? '',
    })),
  }
}

export function useActivities(fallback) {
  const [data, setData] = useState(fallback)
  useEffect(() => {
    const controller = new AbortController()
    request('/experiences?limit=60', controller.signal)
      .then((payload) => {
        const items = (payload.data ?? []).map((item) => {
          const adapted = adaptActivity(item)
          // La tarjeta usa la portada.
          return adapted && { ...adapted, photo: adapted.hero ?? adapted.photo }
        })
        setData(items.filter(Boolean))
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  return data
}

export function useActivity(slug, fallback) {
  const [state, setState] = useState({ data: fallback, loading: true })
  useEffect(() => {
    const controller = new AbortController()
    request(`/experiences/${encodeURIComponent(slug)}`, controller.signal)
      .then((payload) => setState({ data: adaptActivity(payload.data), loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: fallback, loading: false })
      })
    return () => controller.abort()
  }, [slug, fallback])
  return state
}
