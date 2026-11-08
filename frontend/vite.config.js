import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import pwa from './pwa/plugin.js'

// https://vite.dev/config/
export default defineConfig(() => {
  // Para probar contra producción sin API local: VITE_API_TARGET=https://… npm run dev
  const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:4000'

  return {
    base: process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? '/gramalote_interactivo/' : '/'),
    plugins: [
      react(),
      pwa(),
    ],
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        // Imágenes subidas desde el panel (disco local, ver docs/ADMIN-PANEL.md).
        '/media': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
