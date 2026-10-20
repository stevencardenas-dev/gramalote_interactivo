import Icon from './Icon.jsx'

export default function InfoBar({ items = [], overlap = true }) {
  return (
    <div className={`info-bar${overlap ? ' info-bar--overlap' : ''}`}>
      {items.map((item) => (
        <div key={item.label} className="info-bar__item">
          <span className="info-bar__icon">
            <Icon name={item.icon} size={22} />
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
