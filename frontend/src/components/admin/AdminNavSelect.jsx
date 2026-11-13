// Desplegable del panel: sustituye las hileras de pestañas por un select con
// etiqueta. Lo usan Lugares (tipo) y Páginas (página y subpágina).
export default function AdminNavSelect({ id, label, value, options, onChange, hint }) {
  return (
    <div className="admin-nav-select">
      <label htmlFor={id}>{label}</label>
      <span className="admin-nav-select__field">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {hint ? <span className="admin-nav-select__hint">{hint}</span> : null}
    </div>
  )
}
