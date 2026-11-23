import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiRequest } from '../../lib/auth.js'
import { getCrop, setCrop } from '../../lib/mediaCrops.js'
import { PHOTO_FRAMES } from '../../lib/photoFrames.js'
import { useModalFocus } from '../../lib/useModalFocus.js'
import { showAdminNotice } from '../../lib/adminNotice.js'
import CollageMap from './CollageMap.jsx'

// Ventana para encuadrar una foto en un espacio concreto del sitio (por ejemplo, uno
// de los cinco del collage de «Dónde dormir»). Se ve el marco real, con sus
// proporciones, y la foto debajo: se arrastra, se acerca o se aleja. Si se aleja o
// se mueve de modo que no cubra el marco, el sitio rellena lo que sobra con la misma
// foto desenfocada. Lo que se ve dentro del marco es lo que se guarda.
//
// El encuadre es {w, l, t}: ancho de la foto y posición de su esquina, en % del
// marco (t en % del alto del marco), igual que lo aplica lib/imageOrientation.js.
//
// image: { url, alt } · frames: claves de PHOTO_FRAMES · onClose() · onSaved?()
const PAD = 16 // margen oscuro alrededor del marco (px; igual que en el CSS)
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const MIN_SEEN = 20 // % del marco que debe seguir tocando la foto
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// Ancho de la foto (en % del marco) cuando llena el marco. Lleva un 1 % de más para
// que el redondeo de píxeles no deje una línea de fondo desenfocado en un borde.
function coverWidth(ratio, quotient) {
  return Math.max(100, (100 * quotient) / ratio) * 1.01
}

function heightPct(width, ratio, quotient) {
  return (width * ratio) / quotient
}

function centered(width, ratio, quotient) {
  return { w: width, l: (100 - width) / 2, t: (100 - heightPct(width, ratio, quotient)) / 2 }
}

function keepSeen(crop, ratio, quotient) {
  const h = heightPct(crop.w, ratio, quotient)
  return {
    ...crop,
    l: clamp(crop.l, MIN_SEEN - crop.w, 100 - MIN_SEEN),
    t: clamp(crop.t, MIN_SEEN - h, 100 - MIN_SEEN),
  }
}

function FramingDialog({ image, frames, slot, onClose, onSaved }) {
  const titleId = useId()
  const panelRef = useModalFocus(onClose)
  const [active, setActive] = useState(frames[0])
  const [drafts, setDrafts] = useState({})
  const [natural, setNatural] = useState(null)
  const [box, setBox] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const stage = useRef(null)
  const drag = useRef(null)

  const frame = PHOTO_FRAMES[active]
  // Proporción del espacio, la misma que usa el CSS del sitio (aspect-ratio). El marco
  // del editor se dibuja con ella: no se vuelve a deducir de lo medido para no crear un
  // bucle (medir → recalcular la proporción → cambiar el marco → medir…).
  const ratio = frame.ratio
  const quotient = natural ? natural.w / natural.h : null
  const saved = getCrop(image.url, active)
  const startCover = quotient ? centered(coverWidth(ratio, quotient), ratio, quotient) : null
  const crop = drafts[active] ?? saved ?? startCover
  const cover = quotient ? coverWidth(ratio, quotient) : 100
  const zoom = crop ? crop.w / cover : 1

  const live = useRef({ crop, quotient, ratio, cover })
  useEffect(() => {
    live.current = { crop, quotient, ratio, cover }
  })

  // Tamaño del marco del editor (cambia con la ventana y con el espacio elegido).
  useEffect(() => {
    const element = stage.current
    if (!element) return undefined
    const read = () => {
      const rect = element.getBoundingClientRect()
      // Solo si cambió de verdad: evita renders de más y bucles por décimas de píxel.
      setBox((current) =>
        current && Math.abs(current.w - rect.width) < 0.5 && Math.abs(current.h - rect.height) < 0.5
          ? current
          : { w: rect.width, h: rect.height },
      )
    }
    read()
    const observer = new ResizeObserver(read)
    observer.observe(element)
    return () => observer.disconnect()
  }, [active])

  function update(next) {
    if (!live.current.quotient) return
    setDrafts((current) => ({ ...current, [active]: keepSeen(next, live.current.ratio, live.current.quotient) }))
  }

  // Cambia el zoom sin mover el centro del marco.
  function zoomTo(next) {
    const { crop: now, quotient: q, ratio: r, cover: c } = live.current
    if (!now || !q) return
    const z = clamp(next, MIN_ZOOM, MAX_ZOOM)
    const w = c * z
    const fx = (50 - now.l) / now.w
    const fy = (50 - now.t) / heightPct(now.w, r, q)
    update({ w, l: 50 - fx * w, t: 50 - fy * heightPct(w, r, q) })
  }

  // La rueda del ratón acerca o aleja (se registra no pasiva para frenar el scroll).
  useEffect(() => {
    const element = stage.current
    if (!element) return undefined
    const onWheel = (event) => {
      event.preventDefault()
      const { crop: now, cover: c } = live.current
      if (now) zoomTo((now.w / c) * (event.deltaY < 0 ? 1.08 : 1 / 1.08))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  })

  function startDrag(event) {
    if (!crop || !box) return
    drag.current = { x: event.clientX, y: event.clientY, l: crop.l, t: crop.t }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event) {
    const start = drag.current
    if (!start || !crop || !box) return
    update({
      ...crop,
      l: start.l + ((event.clientX - start.x) / box.w) * 100,
      t: start.t + ((event.clientY - start.y) / box.h) * 100,
    })
  }

  async function save(next) {
    setBusy(true)
    setError('')
    try {
      const body = next ? { w: next.w, l: next.l, t: next.t } : null
      const response = await apiRequest('/admin/media-crop', { method: 'PUT', body: { url: image.url, frame: active, crop: body } })
      setCrop(image.url, active, response?.frames?.[active] ?? null)
      onSaved?.()
      showAdminNotice('ok', 'Encuadre guardado', 'El cambio ya se ve en el sitio.')
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  // Posición de la foto (y de su copia tenue de fuera del marco) en píxeles.
  const px =
    crop && box && quotient
      ? {
          width: (crop.w / 100) * box.w,
          left: (crop.l / 100) * box.w,
          top: (crop.t / 100) * box.h,
        }
      : null

  return (
    <div className="admin-dialog" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog__panel admin-framing"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-framing__head">
          <h2 id={titleId} className="admin-dialog__title">
            Encuadre de la foto
          </h2>
          <CollageMap collage={frame.collage} slot={slot} />
        </div>
        <p className="admin-dialog__text">
          Mueve la foto dentro del marco y acércala o aléjala. Lo que no cubra la foto se rellena con ella misma desenfocada.
        </p>

        {frames.length > 1 ? (
          <div className="admin-framing__tabs" role="tablist" aria-label="Espacio de la foto">
            {frames.map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={key === active}
                className={`admin-btn${key === active ? ' admin-btn--primary' : ''}`}
                onClick={() => setActive(key)}
              >
                {PHOTO_FRAMES[key].label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="admin-framing__editor">
          <div className="admin-framing__stage-wrap" style={{ padding: PAD }}>
            {px ? (
              <img
                className="admin-framing__ghost"
                src={image.url}
                alt=""
                aria-hidden="true"
                draggable="false"
                data-no-crop=""
                style={{ left: PAD + px.left, top: PAD + px.top, width: px.width, height: 'auto', aspectRatio: 'auto' }}
              />
            ) : null}
            <div
              ref={stage}
              className="admin-framing__stage"
              data-blur=""
              style={{ aspectRatio: ratio, '--blur-img': `url("${image.url}")` }}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={() => {
                drag.current = null
              }}
              onPointerCancel={() => {
                drag.current = null
              }}
            >
              <img
                src={image.url}
                alt={image.alt ?? ''}
                draggable="false"
                data-no-crop=""
                onLoad={(event) => setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })}
                style={
                  px
                    ? { position: 'absolute', maxWidth: 'none', height: 'auto', aspectRatio: 'auto', objectFit: 'fill', left: px.left, top: px.top, width: px.width }
                    : { position: 'absolute', maxWidth: 'none', visibility: 'hidden', width: 1 }
                }
              />
            </div>
          </div>
          {natural ? <p className="admin-hint">Foto original: {natural.w} × {natural.h} px</p> : null}
          <p className="admin-hint">Arrastra la foto para moverla. La rueda del ratón o el control la acercan y la alejan.</p>

          <label className="admin-framing__zoom">
            <span>Acercamiento: {zoom.toFixed(2).replace('.', ',')}×</span>
            <span className="admin-framing__zoom-row">
              <button type="button" className="admin-btn" disabled={!crop || zoom <= MIN_ZOOM} aria-label="Alejar" onClick={() => zoomTo(zoom / 1.1)}>
                –
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.01"
                value={zoom}
                disabled={!crop}
                onChange={(event) => zoomTo(Number(event.target.value))}
              />
              <button type="button" className="admin-btn" disabled={!crop || zoom >= MAX_ZOOM} aria-label="Acercar" onClick={() => zoomTo(zoom * 1.1)}>
                +
              </button>
            </span>
          </label>

          <div className="admin-framing__presets">
            <button type="button" className="admin-btn" disabled={!quotient} onClick={() => update(centered(cover, ratio, quotient))}>
              Llenar el marco
            </button>
            <button
              type="button"
              className="admin-btn"
              disabled={!quotient}
              onClick={() => update(centered(Math.min(100, (100 * quotient) / ratio), ratio, quotient))}
            >
              Foto completa
            </button>
          </div>
        </div>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <div className="admin-dialog__actions admin-framing__actions">
          <button type="button" className="admin-btn" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="admin-btn admin-btn--primary" disabled={busy || !crop} onClick={() => save(crop)}>
            {busy ? 'Guardando…' : 'Guardar encuadre'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ImageFraming(props) {
  const frames = (props.frames ?? []).filter((key) => PHOTO_FRAMES[key])
  if (frames.length === 0) return null
  // Se pinta en la raíz del panel y no dentro de la tarjeta o fila que la abre: así no
  // le llegan los estilos de esa fila (imágenes, botones) y conserva los colores del panel.
  const host = document.querySelector('.admin-app') ?? document.body
  return createPortal(<FramingDialog {...props} frames={frames} />, host)
}
