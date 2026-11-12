import { useState } from 'react'

// Campo de contraseña con ojo para mostrarla u ocultarla.
export default function PasswordInput({ className = '', ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className={`password-input ${className}`.trim()}>
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-input__eye"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6a12.6 12.6 0 0 1-2.6 3.1M6.5 7.5A12.6 12.6 0 0 0 2.5 12C3.5 13.800 7 18 12 18c1.500 0 2.800-.4 4-.9" />
            <path d="M9.900 10a3 3 0 0 0 4.100 4.100" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.500 12C3.500 10.200 7 6 12 6s8.500 4.200 9.500 6c-1 1.800-4.500 6-9.500 6S3.500 13.800 2.500 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </span>
  )
}
