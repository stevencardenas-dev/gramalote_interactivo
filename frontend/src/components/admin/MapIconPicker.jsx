import { useId } from 'react'
import { MAP_ICONS, mapIconUrl } from '../../data/mapIcons.js'

// Icono del pin en el mapa. "Automático" deja que el mapa lo deduzca del tipo.
export default function MapIconPicker({ value, automatic, onChange }) {
  const name = useId()
  const options = [{ key: '', label: 'Automático' }, ...MAP_ICONS]
  return (
    <fieldset className="admin-map-icons">
      <legend>Icono en el mapa</legend>
      <p className="admin-map-icons__hint">
        Automático usa el icono del tipo (ahora: {MAP_ICONS.find((icon) => icon.key === automatic)?.label}).
        Se muestra en versión 1 o 2 según elija quien mira el mapa.
      </p>
      <div className="admin-map-icons__grid">
        {options.map((option) => {
          const icon = option.key || automatic
          return (
            <label key={option.key || 'auto'} className="admin-map-icon">
              <input
                type="radio"
                name={name}
                value={option.key}
                checked={(value ?? '') === option.key}
                onChange={() => onChange(option.key || null)}
              />
              <span className="admin-map-icon__images" aria-hidden="true">
                <img src={mapIconUrl(icon, 1)} alt="" loading="lazy" />
                <img src={mapIconUrl(icon, 2)} alt="" loading="lazy" />
              </span>
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
