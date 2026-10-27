import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const overHero =
    pathname === '/' ||
    pathname.startsWith('/establecimiento/') ||
    ['/donde-ir', '/donde-comer', '/donde-dormir', '/donde-comprar'].includes(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <Navbar over={overHero} />
      <main id="contenido" className={overHero ? 'main--over-hero' : undefined}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
