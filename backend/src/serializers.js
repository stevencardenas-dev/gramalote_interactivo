export function toNumber(value) {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function mediaFromRow(row) {
  if (!row || row.media_id === null || row.media_id === undefined) return null
  return {
    id: toNumber(row.media_id),
    url: row.public_url ?? null,
    alt: row.alt_override || row.alt_text || '',
    caption: row.caption ?? null,
    credit: row.credit ?? null,
    mimeType: row.mime_type ?? null,
    width: toNumber(row.width_px),
    height: toNumber(row.height_px),
  }
}

export function mediaFromAlias(row, prefix = '') {
  if (!row || row[`${prefix}media_id`] === null || row[`${prefix}media_id`] === undefined) {
    return null
  }
  return {
    id: toNumber(row[`${prefix}media_id`]),
    url: row[`${prefix}public_url`] ?? null,
    alt: row[`${prefix}alt_text`] || '',
  }
}

export function coverFromRow(row) {
  if (!row || row.cover_media_id === null || row.cover_media_id === undefined) {
    return null
  }
  return {
    id: toNumber(row.cover_media_id),
    url: row.cover_url ?? null,
    alt: row.cover_alt || '',
  }
}

export function toImage(row) {
  const media = mediaFromRow(row)
  if (!media) return null
  return {
    ...media,
    role: row.role ?? 'gallery',
    sortOrder: toNumber(row.sort_order) ?? 0,
  }
}

export function toCoordinates(latitude, longitude) {
  const lat = toNumber(latitude)
  const lng = toNumber(longitude)
  if (lat === null || lng === null) return null
  return { latitude: lat, longitude: lng }
}

export function toEstablishmentSummary(row) {
  return {
    id: toNumber(row.id),
    slug: row.slug,
    name: row.name,
    category: {
      slug: row.category_slug,
      name: row.category_name,
    },
    type: row.type_slug
      ? {
          slug: row.type_slug,
          name: row.type_name,
          filterGroup: row.filter_group ?? null,
        }
      : null,
    zone: row.zone_slug
      ? { slug: row.zone_slug, name: row.zone_name }
      : null,
    locationDetail: row.location_detail ?? null,
    summary: row.summary,
    description: row.description,
    address: row.address ?? null,
    coordinates: toCoordinates(row.latitude, row.longitude),
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    hours: row.hours_text ?? null,
    checkin: row.checkin_text ?? null,
    price: {
      text: row.price_text ?? null,
      min: toNumber(row.price_min_cop),
      max: toNumber(row.price_max_cop),
    },
    featured: Boolean(row.is_featured),
    cover: coverFromRow(row),
  }
}

export function toExperienceSummary(row) {
  return {
    id: toNumber(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category_slug
      ? { slug: row.category_slug, name: row.category_name }
      : null,
    zone: row.zone_slug
      ? { slug: row.zone_slug, name: row.zone_name }
      : null,
    summary: row.summary,
    description: row.description,
    address: row.address ?? null,
    coordinates: toCoordinates(row.latitude, row.longitude),
    hours: row.hours_text ?? null,
    parking: row.parking_text ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    website: row.website ?? null,
    durationMinutes: toNumber(row.duration_minutes),
    difficulty: row.difficulty ?? null,
    price: row.price_text ?? null,
    featured: Boolean(row.is_featured),
    cover: coverFromRow(row),
  }
}

export function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function toCuriositySection(row) {
  const media = mediaFromRow(row)
  return {
    id: toNumber(row.id),
    slug: row.slug,
    eyebrow: row.eyebrow ?? null,
    title: row.title,
    summary: row.summary,
    ctaLabel: row.cta_label ?? null,
    sortOrder: toNumber(row.sort_order) ?? 0,
    hasDetail: Boolean(row.curiosity_id),
    media,
  }
}
