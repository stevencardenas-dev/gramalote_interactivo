import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Inicio from './pages/Inicio.jsx'
import QueHacer from './pages/QueHacer.jsx'
import Experiencia from './pages/Experiencia.jsx'
import { AdminExperiencia, AdminExperiencias } from './pages/AdminExperiencias.jsx'
import DondeIr from './pages/DondeIr.jsx'
import DondeComer from './pages/DondeComer.jsx'
import DondeDormir from './pages/DondeDormir.jsx'
import DondeComprar from './pages/DondeComprar.jsx'
import Establecimiento from './pages/Establecimiento.jsx'
import Historia from './pages/Historia.jsx'
import Curiosidades from './pages/Curiosidades.jsx'
import CuriosidadDetalle from './pages/CuriosidadDetalle.jsx'
import InformacionPractica from './pages/InformacionPractica.jsx'
import Mapa from './pages/Mapa.jsx'
import Buscar from './pages/Buscar.jsx'
import Acceder from './pages/Acceder.jsx'
import Restablecer from './pages/Restablecer.jsx'
import ConfirmarCalificacion from './pages/ConfirmarCalificacion.jsx'
import Sugerir from './pages/Sugerir.jsx'
import AdminCorreo from './pages/AdminCorreo.jsx'
import AdminSugerencias from './pages/AdminSugerencias.jsx'
import AdminExtras from './pages/AdminExtras.jsx'
import Admin from './pages/Admin.jsx'
import AdminUsuarios from './pages/AdminUsuarios.jsx'
import AdminPaginas from './pages/AdminPaginas.jsx'
import AdminEstablecimientos from './pages/AdminEstablecimientos.jsx'
import AdminEstablecimiento from './pages/AdminEstablecimiento.jsx'
import RequireAdmin from './components/admin/RequireAdmin.jsx'
import NoEncontrada from './pages/NoEncontrada.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />

        <Route path="que-hacer" element={<QueHacer />} />
        <Route path="que-hacer/:slug" element={<Experiencia />} />

        <Route path="donde-ir" element={<DondeIr />} />
        <Route path="donde-comer" element={<DondeComer />} />
        <Route path="donde-dormir" element={<DondeDormir />} />
        <Route path="donde-comprar" element={<DondeComprar />} />
        <Route path="establecimiento/:slug" element={<Establecimiento />} />

        <Route path="historia" element={<Historia />} />
        <Route path="curiosidades" element={<Curiosidades />} />
        <Route path="curiosidades/:slug" element={<CuriosidadDetalle />} />
        <Route path="informacion-practica" element={<InformacionPractica />} />
        <Route path="mapa" element={<Mapa />} />
        <Route path="buscar" element={<Buscar />} />
        <Route path="acceder" element={<Acceder />} />
        <Route path="restablecer" element={<Restablecer />} />
        <Route path="confirmar-calificacion" element={<ConfirmarCalificacion />} />
        <Route path="sugerir" element={<Sugerir />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/establecimientos"
          element={
            <RequireAdmin>
              <AdminEstablecimientos />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/establecimientos/:id"
          element={
            <RequireAdmin>
              <AdminEstablecimiento />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/experiencias"
          element={
            <RequireAdmin>
              <AdminExperiencias />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/experiencias/:id"
          element={
            <RequireAdmin>
              <AdminExperiencia />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/extras"
          element={
            <RequireAdmin>
              <AdminExtras />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/paginas"
          element={
            <RequireAdmin>
              <AdminPaginas />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/usuarios"
          element={
            <RequireAdmin>
              <AdminUsuarios />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/sugerencias"
          element={
            <RequireAdmin>
              <AdminSugerencias />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/correo"
          element={
            <RequireAdmin>
              <AdminCorreo />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  )
}
