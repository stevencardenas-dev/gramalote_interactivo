// Fecha de la última edición de una ficha en los listados del panel: dice qué es
// («Editado 17 nov 2026») y, al pasar el cursor, da el día y la hora completos.
export default function EditedDate({ value }) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return null
  const short = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  const full = date.toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  return (
    <span className="admin-row-item__date" title={`Última edición: ${full}`}>
      Editado {short}
    </span>
  )
}
