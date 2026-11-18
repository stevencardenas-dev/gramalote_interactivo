// Foto de patrimonio: el pie de foto va en la etiqueta sobre la imagen (antes,
// la época) y el crédito, debajo en letra pequeña.
export function PhotoBadge({ text }) {
  if (!text) return null
  return <span className="his-photo-badge">{text}</span>
}

export default function PhotoNote({ credit }) {
  if (!credit) return null
  return <p className="his-ficha__caption his-ficha__credit">Crédito: {credit}</p>
}
