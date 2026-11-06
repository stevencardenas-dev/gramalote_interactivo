/**
 * Iconos de redes sociales entregados por diseño (SVG en /brand/social).
 * Se enmascaran igual que los iconos de marca para heredar el color del contexto.
 */
export default function SocialIcon({ name, size = 18, className = '' }) {
  return (
    <span
      className={`icon-mask ${className}`.trim()}
      aria-hidden="true"
      style={{
        '--icon': `url(/brand/social/${name}.svg)`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  )
}
