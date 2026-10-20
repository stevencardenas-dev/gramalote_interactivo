export default function FilterBar({ children }) {
  return <div className="filter-bar">{children}</div>
}

export function FilterToggle({ label, active = false }) {
  return (
    <label className="filter-toggle">
      <span>{label}</span>
      <span className={`toggle${active ? ' is-active' : ''}`} aria-hidden="true">
        <span />
      </span>
    </label>
  )
}

export function FilterSelect({ label, options, value }) {
  return (
    <label className="filter-select">
      {label ? <span className="filter-select__label">{label}</span> : null}
      <span className="filter-select__control">
        <select defaultValue={value ?? options[0]}>
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
