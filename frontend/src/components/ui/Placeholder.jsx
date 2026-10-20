export default function Placeholder({ label, className = '', ratio }) {
  return (
    <div
      className={`placeholder ${className}`.trim()}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden="true"
    >
      <svg
        className="placeholder__icon"
        viewBox="0 0 120 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="86" cy="22" r="9" fill="currentColor" opacity="0.65" />
        <path
          d="M4 72 36 30l18 21 14-14 26 35H4Z"
          fill="currentColor"
          opacity="0.5"
        />
        <path d="M4 72h112" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      </svg>
      {label ? <span className="placeholder__label">{label}</span> : null}
    </div>
  )
}
