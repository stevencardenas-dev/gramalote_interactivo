import { useEffect, useRef, useState } from 'react'

// Aparición progresiva al hacer scroll.
//
// Un solo vigilante —compartido por todos los bloques— mide con
// getBoundingClientRect en scroll y resize: es más liviano que un observer por
// bloque y no depende de IntersectionObserver, que en navegadores con la
// pestaña oculta nunca entrega sus avisos.
const watchers = new Set()
let timer = 0
let listening = false

function show(entry) {
  watchers.delete(entry)
  entry.reveal()
}

function measure() {
  timer = 0
  const limit = window.innerHeight * 0.94
  watchers.forEach((entry) => {
    const rect = entry.node.getBoundingClientRect()
    // `rect.bottom < 0` son los bloques que quedaron por encima tras un salto
    // por ancla: se muestran igual en vez de quedarse invisibles.
    if (rect.top < limit || rect.bottom < 0) show(entry)
  })
  if (watchers.size === 0) stop()
}

// setTimeout y no requestAnimationFrame: en pestañas ocultas (o al abrir el
// enlace en segundo plano) los frames no corren y el contenido quedaría oculto.
function schedule() {
  if (!timer) timer = window.setTimeout(measure, 80)
}

function start() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  schedule()
}

function stop() {
  if (!listening) return
  listening = false
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  if (timer) {
    window.clearTimeout(timer)
    timer = 0
  }
}

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  style,
  children,
  ...rest
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    const entry = { node, reveal: () => setVisible(true) }
    node.classList.remove('is-visible')
    watchers.add(entry)
    start()

    return () => {
      watchers.delete(entry)
      if (watchers.size === 0) stop()
    }
  }, [visible])

  return (
    <Tag
      ref={ref}
      className={`reveal${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { ...style, '--reveal-delay': `${delay}ms` } : style}
      {...rest}
    >
      {children}
    </Tag>
  )
}
