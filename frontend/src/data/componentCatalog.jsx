import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import { FilterToggle } from '../components/ui/FilterBar.jsx'
import { StarsRow } from '../components/ui/RatingStars.jsx'

// Piezas de interfaz del sitio que el buscador puede mostrar con su estilo real.
// `keywords` ayuda a encontrarlas por palabras que la gente usaría.
export const componentCatalog = [
  {
    id: 'boton',
    name: 'Botón',
    keywords: 'boton primario secundario enlace accion cta',
    description: 'Acción principal y secundaria de las fichas y secciones.',
    preview: () => (
      <div className="cmp-row">
        <Button variant="primary">Ver más</Button>
        <Button variant="ghost">Cómo llegar</Button>
      </div>
    ),
  },
  {
    id: 'etiqueta',
    name: 'Etiqueta de tipo',
    keywords: 'etiqueta pill chip tipo categoria',
    description: 'Píldora de color que indica el tipo de lugar o experiencia.',
    preview: () => (
      <div className="cmp-row">
        <span className="ficha-hero__pill ficha-hero__pill--olive">Restaurante</span>
        <span className="ficha-hero__pill ficha-hero__pill--gold">Hotel</span>
        <span className="ficha-hero__pill ficha-hero__pill--brick">Artesanías</span>
      </div>
    ),
  },
  {
    id: 'estrellas',
    name: 'Calificación con estrellas',
    keywords: 'estrellas calificacion valoracion rating votos puntuacion',
    description: 'Promedio de votos de visitantes en el encabezado de cada ficha.',
    preview: () => (
      <div className="stars stars--static">
        <span className="stars__button">
          <StarsRow value={4.5} />
          <span className="stars__text">4,5 · 12 votos</span>
        </span>
      </div>
    ),
  },
  {
    id: 'buscador',
    name: 'Campo de búsqueda',
    keywords: 'buscador buscar input campo texto lupa',
    description: 'Caja de búsqueda del encabezado.',
    preview: () => (
      <div className="search-field cmp-search">
        <Icon name="search" className="search-field__icon" />
        <input type="search" placeholder="Buscar en el sitio…" aria-label="Ejemplo" readOnly tabIndex={-1} />
      </div>
    ),
  },
  {
    id: 'candado',
    name: 'Acceso (candado)',
    keywords: 'acceso candado login iniciar sesion admin ingresar',
    description: 'Icono de acceso al panel, junto al buscador.',
    preview: () => (
      <span className="site-login cmp-lock">
        <Icon name="lock" />
      </span>
    ),
  },
  {
    id: 'interruptor',
    name: 'Conmutador',
    keywords: 'conmutador interruptor switch toggle filtro abierto',
    description: 'Interruptor de los filtros de los listados.',
    preview: () => <FilterToggle label="Abierto ahora" active onChange={() => {}} />,
  },
  {
    id: 'compartir',
    name: 'Botones sociales',
    keywords: 'compartir redes sociales social instagram facebook',
    description: 'Círculos de redes y compartir del encabezado de las fichas.',
    preview: () => (
      <div className="cmp-row cmp-row--dark">
        <span className="social-dot"><Icon name="instagram" /></span>
        <span className="social-dot"><Icon name="facebook" /></span>
        <span className="social-dot"><Icon name="share" /></span>
      </div>
    ),
  },
  {
    id: 'migas',
    name: 'Migas de pan',
    keywords: 'migas pan breadcrumb ruta navegacion',
    description: 'Ruta de navegación sobre el encabezado de cada ficha.',
    preview: () => (
      <div className="cmp-row cmp-row--dark">
        <ol className="breadcrumb cmp-breadcrumb">
          <li>Inicio</li>
          <li>Dónde ir</li>
          <li aria-current="page">Dónde comer</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'barra-info',
    name: 'Barra de información',
    keywords: 'barra informacion horario direccion telefono datos',
    description: 'Datos clave (horario, dirección, contacto) en una franja.',
    preview: () => (
      <InfoBar
        overlap={false}
        items={[
          { icon: 'info', label: 'Horario', value: '8:00 a. m. – 6:00 p. m.' },
          { icon: 'telefono', label: 'Contacto', value: '300 000 0000' },
        ]}
      />
    ),
  },
]
