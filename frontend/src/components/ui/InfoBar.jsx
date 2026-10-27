import IconMask from './IconMask.jsx'

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
            <span className="info-bar__value">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
