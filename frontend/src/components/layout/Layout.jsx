import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const overHero =
    pathname === '/' ||
    pathname.startsWith('/establecimiento/') ||
    [
      '/donde-ir',
      '/donde-comer',
      '/donde-dormir',
      '/donde-comprar',
      '/que-hacer',
      '/historia',
      '/curiosidades',
      '/informacion-practica',
      '/buscar',
      '/mapa',
    ].includes(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  // Aviso cuando se navega sin señal con lo guardado por el service worker.
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      {online ? null : (
        <p className="offline-banner" role="status">
          Sin conexión: estás viendo la información guardada en este dispositivo.
        </p>
      )}
      <Navbar over={overHero} />
      <main id="contenido" className={overHero ? 'main--over-hero' : undefined}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
