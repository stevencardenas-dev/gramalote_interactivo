import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import AdminNav from '../admin/AdminNav.jsx'
import WhatsAppHelp from '../ui/WhatsAppHelp.jsx'
import { usePageTitle } from '../../lib/usePageTitle.js'

// Títulos de las vistas fijas. Las fichas y detalles ponen el suyo (el efecto
// del hijo corre antes que el de Layout, así que aquí no se tocan).
const TITLES = {
  '/': '',
  '/que-hacer': 'Qué hacer',
  '/donde-ir': 'Dónde ir',
  '/donde-comer': 'Dónde comer',
  '/donde-dormir': 'Dónde dormir',
  '/donde-comprar': 'Dónde comprar',
  '/historia': 'Su historia',
  '/curiosidades': 'Curiosidades',
  '/informacion-practica': 'Información práctica',
  '/mapa': 'Mapa',
  '/buscar': 'Buscar',
  '/acceder': 'Acceder',
  '/restablecer': 'Nueva contraseña',
  '/sugerir': 'Sugerir un establecimiento',
  '/confirmar-calificacion': 'Confirmar calificación',
}

function StaticTitle({ pathname }) {
  const title = pathname.startsWith('/admin') ? 'Panel de administración' : TITLES[pathname]
  usePageTitle(title)
  return null
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  const overHero =
    pathname === '/' ||
    pathname.startsWith('/establecimiento/') ||
    pathname.startsWith('/que-hacer/') ||
    pathname.startsWith('/curiosidades/') ||
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
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

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

  if (pathname.startsWith('/admin')) {
    return (
      <div className="admin-app">
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <StaticTitle pathname={pathname} />
        <AdminNav />
        <main id="contenido" className="admin-main">
          <Outlet />
        </main>
      </div>
    )
  }

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
      {pathname in TITLES || pathname.startsWith('/admin') ? (
        <StaticTitle pathname={pathname} />
      ) : null}
      <Navbar over={overHero} />
      <main id="contenido" className={overHero ? 'main--over-hero' : undefined}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppHelp />
    </>
  )
}
