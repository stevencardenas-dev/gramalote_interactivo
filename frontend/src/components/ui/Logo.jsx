export default function Logo({
  variant = 'rect',
  className = 'brand__logo',
  alt = 'Turismo Gramalote',
}) {
  const sources = {
    rect: '/brand/logo-rect.svg',
    cube: '/brand/logo-cuadrado.svg',
    iso: '/brand/isotipo.svg',
  }

  return <img className={className} src={sources[variant] ?? sources.rect} alt={alt} />
}
