import Button from '../components/ui/Button.jsx'

export default function NoEncontrada() {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Error 404</p>
        <h1 style={{ marginBlock: '12px' }}>Esta página no existe</h1>
        <p style={{ color: 'var(--c-ink-soft)', marginBottom: '24px' }}>
          Puede que el enlace haya cambiado o que el contenido esté en
          construcción.
        </p>
        <Button to="/">Volver al inicio</Button>
      </div>
    </section>
  )
}
