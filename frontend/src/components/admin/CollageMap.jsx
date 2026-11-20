import { COLLAGES } from '../../lib/photoFrames.js'

// Miniatura del collage de la ficha con el espacio de esta foto resaltado, para ver
// de un vistazo dónde queda. Los espacios tienen las mismas proporciones que en el sitio.
export default function CollageMap({ collage, slot }) {
  const layout = COLLAGES[collage]
  if (!layout || slot == null) return null
  return (
    <div className="admin-collage" role="img" aria-label="Posición de la foto en el collage de la ficha">
      {layout.rows.map((row, rowIndex) => (
        <div key={rowIndex} className="admin-collage__row">
          {row.map((cell) => (
            <span
              key={cell.slot}
              className={`admin-collage__cell${cell.slot === slot ? ' is-current' : ''}`}
              style={{ aspectRatio: cell.ratio }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
