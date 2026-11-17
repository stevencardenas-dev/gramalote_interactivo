import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

// Vuelve al inicio de la página. Acompaña al botón de WhatsApp y solo aparece
// cuando el visitante ya bajó lo suficiente para necesitarlo.
export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 480)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  function goTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      className={`scroll-top${visible ? ' is-visible' : ''}`}
      aria-label="Volver arriba"
      title="Volver arriba"
      onClick={goTop}
    >
      <Icon name="arrow-up" size={20} />
    </button>
  )
}
