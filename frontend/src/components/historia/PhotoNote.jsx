// Pie de foto y crédito bajo una imagen de la ficha de patrimonio.
export default function PhotoNote({ caption, credit }) {
  if (!caption && !credit) return null
  return (
    <p className="his-ficha__caption">
      {caption}
      {credit ? <span className="his-ficha__credit">{caption ? ' · ' : ''}Crédito: {credit}</span> : null}
    </p>
  )
}
