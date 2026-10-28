import { lazy, Suspense } from 'react'
import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'

const LiveMap = lazy(() => import('../components/ui/LiveMap.jsx'))

export default function Mapa() {
  return (
    <>
      <PageHero
        eyebrow="Mapa interactivo"
        title="Explora el mapa"
        intro="Consulta los lugares de Gramalote: dónde comer, dónde dormir, dónde comprar y experiencias para vivir el municipio."
      />

      <section className="section">
        <div className="container">
          <Suspense fallback={<p className="note">Cargando mapa…</p>}>
            <LiveMap showLegend showList />
          </Suspense>

          <div className="page-actions" style={{ marginTop: '20px' }}>
            <Button to="/donde-ir" variant="ghost">
              Ver establecimientos
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
