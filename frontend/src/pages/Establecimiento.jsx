import { useParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { getEstablishment } from '../data/establishments.js'
import EstablecimientoComer from './EstablecimientoComer.jsx'
import EstablecimientoDormir from './EstablecimientoDormir.jsx'
import EstablecimientoComprar from './EstablecimientoComprar.jsx'

export default function Establecimiento() {
  const { slug } = useParams()
  const item = getEstablishment(slug)

  if (!item) {
    return (
      <section className="section">
        <div className="container">
          <h1>No encontramos esta ficha</h1>
          <p className="page-intro">El contenido puede haber cambiado de dirección.</p>
          <Button to="/donde-ir">Volver a Dónde ir</Button>
        </div>
      </section>
    )
  }

  if (item.category === 'dormir') return <EstablecimientoDormir item={item} />
  if (item.category === 'comprar') return <EstablecimientoComprar item={item} />
  return <EstablecimientoComer item={item} />
}
