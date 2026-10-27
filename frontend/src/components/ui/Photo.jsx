import Placeholder from './Placeholder.jsx'

export default function Photo({
  src,
  alt = '',
  className = '',
  ratio,
  position,
  eager = false,
  children,
}) {
  const style = {}
  if (ratio) style.aspectRatio = ratio

  return (
    <div className={`photo ${className}`.trim()} style={style}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          style={position ? { objectPosition: position } : undefined}
        />
      ) : (
        <Placeholder label={alt || undefined} />
      )}
      {children}
    </div>
  )
}
