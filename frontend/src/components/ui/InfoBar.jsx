import IconMask from './IconMask.jsx'

// `value` puede ser un texto o una lista de líneas (texto o { text, href }).
function Value({ value }) {
  if (!Array.isArray(value)) return <span className="info-bar__value">{value}</span>
  return value.map((line, index) => {
    const text = typeof line === 'string' ? line : line.text
    return (
      <span key={`${text}-${index}`} className="info-bar__value">
        {line.href ? (
          <a href={line.href} target={line.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
            {text}
          </a>
        ) : (
          text
        )}
      </span>
    )
  })
}

export default function InfoBar({ items = [], overlap = true }) {
  return (
    <div className={`info-bar${overlap ? ' info-bar--overlap' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="info-bar__item">
          <span className="info-bar__icon">
            {item.icon ? <IconMask icon={`icono-${item.icon}`} size={26} /> : null}
          </span>
          <div>
            <span className="info-bar__label">{item.label}</span>
            <Value value={item.value} />
          </div>
        </div>
      ))}
    </div>
  )
}
