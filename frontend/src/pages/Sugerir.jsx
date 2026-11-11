import { useEffect, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import { fetchSuggestionForm } from '../lib/ratingsApi.js'

// Sugerir un establecimiento: el formulario es de Google (su enlace se
// configura en Panel › Correo). Cada respuesta llega al panel, en Sugerencias.
export default function Sugerir() {
  const [form, setForm] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchSuggestionForm(controller.signal)
      .then(setForm)
      .catch((error) => {
        if (error.name !== 'AbortError') setFailed(true)
      })
    return () => controller.abort()
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Ayúdanos a crecer"
        title="Sugerir un establecimiento"
        intro="¿Conoces un restaurante, alojamiento, tienda o lugar de Gramalote que debería estar en esta guía? Cuéntanos y el equipo lo revisará."
      />
      <section className="section suggest-page">
        <div className="container suggest-page__inner">
          {form?.embedUrl ? (
            <>
              <iframe
                className="suggest-page__frame"
                src={form.embedUrl}
                title="Formulario para sugerir un establecimiento"
                loading="lazy"
              >
                Cargando…
              </iframe>
              <p className="suggest-page__alt">
                ¿No ves el formulario?{' '}
                <a href={form.url} target="_blank" rel="noreferrer">
                  Ábrelo en Google Forms
                </a>
                .
              </p>
            </>
          ) : form?.url ? (
            <div className="suggest-page__empty">
              <p>El formulario se abre en Google Forms.</p>
              <Button href={form.url} target="_blank" rel="noreferrer">
                Abrir el formulario
              </Button>
            </div>
          ) : form || failed ? (
            <div className="suggest-page__empty">
              <p>
                {failed
                  ? 'No pudimos cargar el formulario. Revisa tu conexión e inténtalo de nuevo.'
                  : 'Muy pronto podrás enviarnos tus sugerencias desde aquí.'}
              </p>
              <Button to="/" variant="secondary">
                Volver al inicio
              </Button>
            </div>
          ) : (
            <p className="note">Cargando el formulario…</p>
          )}
        </div>
      </section>
    </>
  )
}
