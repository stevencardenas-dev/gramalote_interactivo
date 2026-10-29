// Datos públicos desde la API (MySQL). Las plantillas siguen recibiendo la
// forma que ya usaban con src/data; aquí se traduce la respuesta camelCase.
import { useEffect, useState } from 'react'
import { establishmentPhotos } from '../data/establishmentPhotos'

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

// Traduce una ficha de la API a la forma que esperan las plantillas.
export function adaptEstablishment(item) {
  if (!item) return null
  // Mientras no haya fotos subidas en el panel se mantienen las del diseño,
  // para no dejar las fichas vacías durante la transición.
  const legacy = establishmentPhotos[item.slug] ?? {}
  const cover = item.cover?.url ?? legacy.photo ?? null
  const uploaded = (item.images ?? []).map((image) => image.url).filter(Boolean)
  const gallery = uploaded.length > 0
    ? uploaded
    : legacy.gallery ?? (legacy.photo ? [legacy.photo] : [])

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category?.slug ?? null,
    type: item.type?.name ?? item.category?.name ?? '',
    town: item.zone?.slug ?? null,
    summary: item.summary ?? '',
    description: item.description ?? '',
    hours: item.hours ?? null,
    checkin: item.checkin ?? null,
    address: item.address ?? null,
    payment: joinPayments(item.payments),
    phone: item.phone ?? null,
    whatsapp: item.whatsapp ?? null,
    email: item.email ?? null,
    website: item.website ?? null,
    priceRange: item.price?.text ?? null,
    openNow: Boolean(item.openNow),
    photo: cover,
    hero: item.cover?.url ?? legacy.hero ?? legacy.photo ?? null,
    gallery,
    features: Array.isArray(item.features)
      ? item.features.map((feature) => ({
          title: feature.title,
          text: feature.description,
          photo: cover,
        }))
      : undefined,
    products: Array.isArray(item.products)
      ? item.products.map((product) => ({
          name: product.name,
          photo: product.media?.url ?? cover,
          price: product.price,
        }))
      : undefined,
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
