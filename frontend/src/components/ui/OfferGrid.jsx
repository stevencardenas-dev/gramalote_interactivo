import Photo from './Photo.jsx'

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Rejilla de 6 pistas: filas de 3 (span 2) y, si sobran, filas de 2 (span 3).
// Así 2 → 2, 4 → 2+2, 5 → 3+2, 7 → 3+2+2, sin huecos al final.
function offerSpan(index, total) {
  if (total === 1) return 6
  const rest = total % 3
  if (rest === 1 && index >= total - 4) return 3
  if (rest === 2 && index >= total - 2) return 3
  return 2
}

// Productos de la ficha (Dónde comer y Dónde comprar): foto y, si los tiene,
// nombre, descripción y precio. Sin productos no se pinta nada.
export default function OfferGrid({ products, fallbackPhoto, name }) {
  if (!products?.length) return null
  return (
    <div className={`offer-grid${products.length === 1 ? ' offer-grid--single' : ''}`}>
      {products.map((product, index) => {
        const title = product.name?.trim()
        const text = product.description?.trim()
        return (
          <article
            key={index}
            className="offer-card"
            style={{ '--offer-span': offerSpan(index, products.length) }}
          >
            <Photo src={product.photo ?? fallbackPhoto} alt={title || `${name}, producto ${index + 1}`} />
            {title ? <h3>{title}</h3> : null}
            {text ? <p>{text}</p> : null}
            {product.price ? <p className="offer-card__price">{money.format(product.price)}</p> : null}
          </article>
        )
      })}
    </div>
  )
}
