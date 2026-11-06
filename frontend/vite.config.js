import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import pwa from './pwa/plugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Para probar contra producción sin API local: VITE_API_TARGET=https://… npm run dev
  const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:4000'

  return {
    base: process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? '/gramalote_interactivo/' : '/'),
    plugins: [
      react(),
      pwa({
        tilesUrl: env.VITE_MAP_TILES_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      }),
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
