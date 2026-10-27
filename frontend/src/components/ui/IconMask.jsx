export default function IconMask({ icon, size = 34, className = '' }) {
  return (
    <span
      className={`icon-mask ${className}`.trim()}
      aria-hidden="true"
      style={{
        '--icon': `url(/brand/icons/${icon}.svg)`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  )
}
