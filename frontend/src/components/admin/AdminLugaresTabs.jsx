import { useLocation, useNavigate } from 'react-router-dom'
import AdminNavSelect from './AdminNavSelect.jsx'

// Tipos de lugar del panel. Van en un desplegable y no en una hilera de
// pestañas: en móvil no cabían y se cortaban.
const TIPOS = [
  { to: '/admin/lugares/establecimientos', label: 'Establecimientos' },
  { to: '/admin/lugares/experiencias', label: 'Experiencias' },
  { to: '/admin/lugares/patrimonio', label: 'Patrimonio' },
  { to: '/admin/lugares/extras', label: 'Extras' },
  { to: '/admin/lugares/sugerencias', label: 'Sugerencias' },
]

export default function AdminLugaresTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = TIPOS.find((tipo) => pathname.startsWith(tipo.to))?.to ?? TIPOS[0].to

  return (
    <AdminNavSelect
      id="admin-tipo-lugar"
      label="Tipo de lugar"
      value={current}
      options={TIPOS.map((tipo) => ({ value: tipo.to, label: tipo.label }))}
      onChange={(to) => navigate(to)}
    />
  )
}
