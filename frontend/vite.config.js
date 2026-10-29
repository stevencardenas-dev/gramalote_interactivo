import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE || (process.env.GITHUB_ACTIONS ? '/gramalote_interactivo/' : '/'),
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:4000',
      // Imágenes subidas desde el panel (disco local, ver docs/ADMIN-PANEL.md).
      '/media': 'http://127.0.0.1:4000',
    },
  },
})
