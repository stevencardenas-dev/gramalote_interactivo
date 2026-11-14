import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Logo from '../components/ui/Logo.jsx'
import { confirmRating, formatAverage } from '../lib/ratingsApi.js'

// Destino del enlace del correo «Confirma tu calificación». Pide un clic en
// lugar de confirmar al cargar: así los antivirus de correo que abren los
// enlaces por su cuenta no confirman votos ajenos.
export default function ConfirmarCalificacion() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState({ status: 'idle', data: null, error: '' })

  async function confirm() {
    setState({ status: 'busy', data: null, error: '' })
    try {
      setState({ status: 'done', data: await confirmRating(token), error: '' })
    } catch (failure) {
      setState({ status: 'error', data: null, error: failure.message })
    }
  }

  const data = state.data
  const back = data
    ? data.kind === 'experiencia'
      ? `/que-hacer/${data.slug}`
      : `/establecimiento/${data.slug}`
    : '/'

  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-card">
          <Logo variant="iso" className="auth-card__logo" alt="" />
          {state.status === 'done' ? (
            <>
              <h1>¡Voto confirmado!</h1>
              <p>
                Tu calificación de {data.stars} {data.stars === 1 ? 'estrella' : 'estrellas'} ya cuenta
                para {data.title}. Ahora tiene {formatAverage(data.average)} de 5 con{' '}
                {data.votes} {data.votes === 1 ? 'voto' : 'votos'}.
              </p>
              <Button to={back}>Volver a {data.title}</Button>
            </>
          ) : !token ? (
            <>
              <h1>Enlace incompleto</h1>
              <p className="auth-error" role="alert">
                Abre el enlace completo del correo o vuelve a calificar para recibir uno nuevo.
              </p>
              <Link className="link-arrow" to="/">
                Ir al inicio
              </Link>
            </>
          ) : (
            <>
              <h1>Confirma tu calificación</h1>
              <p>Un clic más y tu voto queda contado. Gracias por ayudar a otros visitantes.</p>
              {state.error ? <p className="auth-error" role="alert">{state.error}</p> : null}
              <Button type="button" onClick={confirm} disabled={state.status === 'busy'}>
                {state.status === 'busy' ? 'Confirmando…' : 'Confirmar mi calificación'}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
