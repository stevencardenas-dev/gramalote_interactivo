import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size,
  icon,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size ? `btn--${size}` : '',
    icon ? 'btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {children}
      {icon ? <Icon name={icon} className="btn__icon" /> : null}
    </>
  )

  if (to) {
    return (
      <Link className={classes} to={to} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button className={classes} type={type} {...rest}>
      {content}
    </button>
  )
}
