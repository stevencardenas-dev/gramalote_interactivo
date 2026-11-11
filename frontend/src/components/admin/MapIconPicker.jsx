import { useId } from 'react'
import { MAP_ICONS, mapIconUrl } from '../../data/mapIcons.js'

const GROUPS = [...new Set(MAP_ICONS.map((icon) => icon.group))]

// Icono del pin en el mapa. "Automático" deja que el mapa lo deduzca del tipo.
export default function MapIconPicker({ value, automatic, onChange }) {
  const name = useId()
  const automaticLabel = MAP_ICONS.find((icon) => icon.key === automatic)?.label

  const option = (key, label, icon) => (
    <label key={key || 'auto'} className="admin-map-icon">
      <input
        type="radio"
        name={name}
        value={key}
        checked={(value ?? '') === key}
        onChange={() => onChange(key || null)}
      />
      <span className="admin-map-icon__images" aria-hidden="true">
        <img src={mapIconUrl(icon)} alt="" loading="lazy" />
      </span>
      <span>{label}</span>
    </label>
  )

  return (
    <fieldset className="admin-map-icons">
      <legend>Icono en el mapa</legend>
      <p className="admin-map-icons__hint">
        Así se ve el pin en el mapa. Automático usa el icono del tipo (ahora: {automaticLabel}).
      </p>
      <div className="admin-map-icons__grid">{option('', 'Automático', automatic)}</div>
      {GROUPS.map((group) => (
        <div key={group} className="admin-map-icons__group">
          <p className="admin-map-icons__group-title">{group}</p>
          <div className="admin-map-icons__grid">
            {MAP_ICONS.filter((icon) => icon.group === group).map((icon) => option(icon.key, icon.label, icon.key))}
          </div>
        </div>
      ))}
    </fieldset>
  )
}
