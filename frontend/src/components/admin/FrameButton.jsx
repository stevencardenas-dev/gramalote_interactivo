import { useState } from 'react'
import ImageFraming from './ImageFraming.jsx'

// Botón «Encuadre» junto a una foto elegida en Páginas: abre la ventana de encuadre de la
// foto en los espacios indicados (claves de PHOTO_FRAMES). Cada espacio se encuadra donde se
// elige su foto: aquí los de Páginas; los de una ficha, en la propia ficha.
export default function FrameButton({ url, alt, frames }) {
  const [open, setOpen] = useState(false)
  if (!url || !frames?.length) return null
  return (
    <>
      <button type="button" className="admin-btn" onClick={() => setOpen(true)}>
        Encuadre
      </button>
      {open ? <ImageFraming image={{ url, alt }} frames={frames} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
