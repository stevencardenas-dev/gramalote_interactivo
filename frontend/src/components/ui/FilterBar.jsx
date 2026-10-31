export default function FilterBar({ children }) {
  return <div className="filter-bar">{children}</div>
}

export function FilterToggle({ label, active = false, onChange }) {
  return (
    <label className="filter-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        className="visually-hidden"
        checked={active}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className={`toggle${active ? ' is-active' : ''}`} aria-hidden="true">
        <span />
      </span>
    </label>
  )
}

export function FilterSelect({ label, options, value, onChange }) {
  return (
    <label className="filter-select">
      {label ? <span className="filter-select__label">{label}</span> : null}
      <span className="filter-select__control">
        <select
          value={value ?? options[0]}
          onChange={(event) => onChange?.(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}
