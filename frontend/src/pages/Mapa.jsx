import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'

const LiveMap = lazy(() => import('../components/ui/LiveMap.jsx'))

export default function Mapa() {
  const [params] = useSearchParams()
  const categoria = params.get('categoria') ?? ''
  const tipo = params.get('tipo') ?? ''

  return (
    <>
      <PageHero
        image="/img/home/explora.jpg"
        eyebrow="Mapa interactivo"
        title="Explora el mapa"
        intro="Consulta los lugares de Gramalote: dónde comer, dónde dormir, dónde comprar y experiencias para vivir el municipio."
      />

      <section className="section">
        <div className="container">
          <Suspense fallback={<p className="note">Cargando mapa…</p>}>
            <LiveMap
              key={`${categoria}|${tipo}`}
              explorer
              initialGroup={categoria}
              initialType={tipo}
            />
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
