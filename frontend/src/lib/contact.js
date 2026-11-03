const digits = (value) => String(value ?? '').replace(/\D/g, '')

function hostOf(url) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

// Líneas de la barra «Contacto» de una ficha: teléfono, secundario, WhatsApp,
// correo y sitio web (este último sale de «Redes sociales»). Cada línea es un
// texto o { text, href }.
export function contactLines(item) {
  const lines = []
  const phone = item.phone?.trim()
  const secondary = item.phoneSecondary?.trim()
  const whatsapp = item.whatsapp?.trim()

  if (phone) {
    const sameWhatsapp = whatsapp && digits(whatsapp) === digits(phone)
    lines.push(sameWhatsapp ? `${phone} · WhatsApp` : phone)
  }
  if (secondary) lines.push(secondary)
  if (whatsapp && digits(whatsapp) !== digits(phone) && digits(whatsapp) !== digits(secondary)) {
    lines.push(`${whatsapp} · WhatsApp`)
  }
  if (item.email) lines.push({ text: item.email, href: `mailto:${item.email}` })

  const website = (item.socialLinks ?? []).find((link) => link.platform === 'website' && link.url)
  if (website) lines.push({ text: hostOf(website.url), href: website.url })

  return lines.length > 0 ? lines : null
}
