import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import { DialogProvider } from './lib/dialog.jsx'
import { registerServiceWorker } from './lib/offline.js'
import { startOutbox } from './lib/outbox.js'
import { initAdminTheme } from './lib/adminTheme.js'
import { initAccessibility } from './lib/accessibility.js'
import { initImageOrientation } from './lib/imageOrientation.js'
import './styles/tokens.css'
import './styles/global.css'
import './styles/ui.css'
import './styles/layout.css'
import './styles/home.css'
import './styles/pages.css'
import './styles/vistas.css'
import './styles/historia.css'
import './styles/mejoras.css'
import './styles/dialog.css'
import './styles/admin.css'
import './styles/admin-panel.css'
import './styles/admin-light.css'
import './styles/accessibility.css'

// Tema guardado del panel, puesto antes del primer pintado.
initAdminTheme()
// Preferencias del menú de accesibilidad, puestas antes del primer pintado.
initAccessibility()
initImageOrientation()

// Data router: hace falta para useBlocker (aviso de cambios sin guardar). Una sola
// ruta comodín envuelve a App, que sigue declarando sus <Routes> como antes.
const router = createBrowserRouter(
  [
    {
      path: '*',
      element: (
        <DialogProvider>
          <App />
        </DialogProvider>
      ),
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

registerServiceWorker()
// Reenvía calificaciones y sugerencias guardadas cuando vuelve la señal.
startOutbox()
