import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Logo from '../components/ui/Logo.jsx'
import { confirmSuggestion } from '../lib/ratingsApi.js'

// Destino del enlace «Confirma tu correo» que se manda la primera vez que un
// correo envía una sugerencia. Pide un clic en lugar de confirmar al cargar,
// como el de las calificaciones.
export default function ConfirmarSugerencia() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState({ status: 'idle', data: null, error: '' })

  async function confirm() {
    setState({ status: 'busy', data: null, error: '' })
    try {
      setState({ status: 'done', data: await confirmSuggestion(token), error: '' })
    } catch (failure) {
      setState({ status: 'error', data: null, error: failure.message })
    }
  }

  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-card">
          <Logo variant="iso" className="auth-card__logo" alt="" />
          {state.status === 'done' ? (
            <>
              <h1>¡Correo confirmado!</h1>
              <p>
                Enviamos tu sugerencia «{state.data?.name}» al equipo de Turismo Gramalote, que la
                revisará. Tu correo queda verificado, así que no volveremos a pedírtelo.
              </p>
              <Button to="/">Volver al inicio</Button>
            </>
          ) : !token ? (
            <>
              <h1>Enlace incompleto</h1>
              <p className="auth-error">
                Abre el enlace completo del correo o envía otra sugerencia para recibir uno nuevo.
              </p>
              <Link className="link-arrow" to="/sugerir">
                Sugerir un lugar
              </Link>
            </>
          ) : (
            <>
              <h1>Confirma tu correo</h1>
              <p>
                Un clic más: tu correo queda verificado y tu sugerencia le llega al equipo. Solo hace
                falta la primera vez; después, tus sugerencias se envían sin este paso.
              </p>
              {state.error ? <p className="auth-error">{state.error}</p> : null}
              <Button type="button" onClick={confirm} disabled={state.status === 'busy'}>
                {state.status === 'busy' ? 'Confirmando…' : 'Confirmar mi correo'}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
