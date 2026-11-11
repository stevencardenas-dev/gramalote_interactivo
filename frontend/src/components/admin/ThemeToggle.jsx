import { useAdminTheme } from '../../lib/adminTheme.js'

// Cambio de modo del panel: botón redondo con sol/luna, en su propio hueco de la
// barra para no confundirse con los enlaces de navegación ni con la cuenta.
// Los iconos son de trazo redondeado, a juego con el resto de la interfaz.
export default function ThemeToggle() {
  const { theme, toggle } = useAdminTheme()
  const toDark = theme === 'light'
  const label = toDark ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {toDark ? (
          <path d="M20.6 14.3A8.6 8.6 0 0 1 9.7 3.4a8.6 8.6 0 1 0 10.9 10.9Z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.1" />
            <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.5 5.5 7 7M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5" />
          </>
        )}
      </svg>
    </button>
  )
}
