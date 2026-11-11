import { useRef, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import { sendSuggestion } from '../lib/ratingsApi.js'

// Sugerir un establecimiento: formulario propio del sitio. Cada envío llega a
// Panel › Sugerencias y, con el correo activo, avisa al equipo.

const TYPES = [
  { value: 'Dónde comer', hint: 'Restaurantes, cafeterías, comidas' },
  { value: 'Dónde dormir', hint: 'Hoteles, hostales, glampings' },
  { value: 'Dónde comprar', hint: 'Tiendas, artesanías, productos' },
  { value: 'Dónde ir', hint: 'Atractivos, miradores, sitios' },
  { value: 'Experiencia o actividad', hint: 'Recorridos, talleres, planes' },
  { value: 'Otro', hint: 'Algo que no encaja arriba' },
]
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EMPTY = {
  nombre: '',
  tipo: '',
  direccion: '',
  telefono: '',
  redes: '',
  motivo: '',
  esDueno: '',
  sugeridoPor: '',
  correo: '',
  website: '',
}

export default function Sugerir() {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)
  const startedAt = useRef(0)

  const set = (key) => (event) => {
    if (!startedAt.current) startedAt.current = Date.now()
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (form.nombre.trim().length < 2) return setError('Escribe el nombre del establecimiento.')
    if (!form.tipo) return setError('Elige qué tipo de lugar es.')
    if (form.motivo.trim().length < 10) return setError('Cuéntanos un poco más de por qué lo recomiendas.')
    if (form.correo.trim() && !EMAIL.test(form.correo.trim())) return setError('Revisa tu correo.')
    setError('')
    setBusy(true)
    try {
      await sendSuggestion({
        ...Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])),
        elapsedMs: startedAt.current ? Date.now() - startedAt.current : 0,
      })
      setSent({ name: form.nombre.trim(), email: form.correo.trim() })
      setForm(EMPTY)
      startedAt.current = 0
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Ayúdanos a crecer"
        title="Sugerir un establecimiento"
        intro="¿Conoces un restaurante, alojamiento, tienda o lugar de Gramalote que debería estar en esta guía? Cuéntanos y el equipo lo revisará."
      />
      <section className="section suggest">
        <div className="container suggest__layout">
          <div className="suggest__card">
            {sent ? (
              <div className="suggest__done" role="status">
                <h2>¡Gracias por tu sugerencia!</h2>
                <p>
                  Recibimos «{sent.name}». El equipo de Gramalote Interactivo la revisará y, si cumple con lo
                  necesario, la agregaremos al sitio.
                  {sent.email ? ' Te escribiremos al correo que dejaste.' : ''}
                </p>
                <div className="suggest__done-actions">
                  <Button type="button" onClick={() => setSent(null)}>
                    Sugerir otro lugar
                  </Button>
                  <Button to="/" variant="secondary">
                    Volver al inicio
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <fieldset className="suggest__group">
                  <legend>El lugar</legend>
                  <label className="suggest__field">
                    <span>
                      Nombre del establecimiento <em aria-hidden="true">*</em>
                    </span>
                    <input value={form.nombre} onChange={set('nombre')} maxLength={190} required autoComplete="off" />
                  </label>

                  <div className="suggest__field" role="radiogroup" aria-labelledby="suggest-type">
                    <span id="suggest-type">
                      ¿Qué tipo de lugar es? <em aria-hidden="true">*</em>
                    </span>
                    <div className="suggest__types">
                      {TYPES.map((type) => (
                        <label key={type.value} className={`suggest__type${form.tipo === type.value ? ' is-on' : ''}`}>
                          <input
                            type="radio"
                            name="tipo"
                            value={type.value}
                            checked={form.tipo === type.value}
                            onChange={set('tipo')}
                          />
                          <strong>{type.value}</strong>
                          <small>{type.hint}</small>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="suggest__row">
                    <label className="suggest__field">
                      <span>Dirección o cómo llegar</span>
                      <input value={form.direccion} onChange={set('direccion')} maxLength={500} />
                    </label>
                    <label className="suggest__field">
                      <span>Teléfono o WhatsApp</span>
                      <input value={form.telefono} onChange={set('telefono')} maxLength={120} inputMode="tel" />
                    </label>
                  </div>
                  <label className="suggest__field">
                    <span>Redes sociales o página web</span>
                    <input value={form.redes} onChange={set('redes')} maxLength={500} placeholder="Instagram, Facebook, enlace…" />
                  </label>
                  <label className="suggest__field">
                    <span>
                      ¿Por qué lo recomiendas? <em aria-hidden="true">*</em>
                    </span>
                    <textarea
                      value={form.motivo}
                      onChange={set('motivo')}
                      maxLength={2000}
                      rows={5}
                      placeholder="Qué ofrece, horarios, precios aproximados o qué lo hace especial."
                    />
                    <small>{form.motivo.length}/2000</small>
                  </label>
                </fieldset>

                <fieldset className="suggest__group">
                  <legend>Tú (opcional)</legend>
                  <div className="suggest__field" role="radiogroup" aria-labelledby="suggest-owner">
                    <span id="suggest-owner">¿Eres el dueño o trabajas allí?</span>
                    <div className="suggest__pills">
                      {['Sí', 'No'].map((value) => (
                        <label key={value} className={`suggest__pill${form.esDueno === value ? ' is-on' : ''}`}>
                          <input
                            type="radio"
                            name="esDueno"
                            value={value}
                            checked={form.esDueno === value}
                            onChange={set('esDueno')}
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="suggest__row">
                    <label className="suggest__field">
                      <span>Tu nombre</span>
                      <input value={form.sugeridoPor} onChange={set('sugeridoPor')} maxLength={160} autoComplete="name" />
                    </label>
                    <label className="suggest__field">
                      <span>Tu correo</span>
                      <input
                        type="email"
                        value={form.correo}
                        onChange={set('correo')}
                        maxLength={190}
                        autoComplete="email"
                      />
                      <small>Para agradecerte y, si hace falta, pedirte más datos.</small>
                    </label>
                  </div>
                </fieldset>

                {/* Trampa para bots: invisible para personas. */}
                <label className="suggest__trap" aria-hidden="true">
                  Sitio web
                  <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </label>

                {error ? (
                  <p className="auth-error" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" disabled={busy} className="suggest__submit">
                  {busy ? 'Enviando…' : 'Enviar sugerencia'}
                </Button>
              </form>
            )}
          </div>

          <aside className="suggest__aside" aria-label="Qué pasa después">
            <h2>¿Qué pasa después?</h2>
            <ol>
              <li>
                <strong>Lo revisamos</strong>
                <span>El equipo verifica que el lugar exista y esté en Gramalote.</span>
              </li>
              <li>
                <strong>Lo visitamos o contactamos</strong>
                <span>Reunimos fotos, horarios y datos de contacto.</span>
              </li>
              <li>
                <strong>Lo publicamos</strong>
                <span>Aparece en la guía y en el mapa para todos los visitantes.</span>
              </li>
            </ol>
          </aside>
        </div>
      </section>
    </>
  )
}
