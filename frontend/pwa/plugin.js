// Genera el service worker y la lista de la descarga previa al compilar.
// Sin dependencias: Vite ya conoce los archivos con hash del bundle.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// Carpetas de public/ que entran en "Descargar para usar sin conexión".
// img/ficha es el respaldo de las fotos de las fichas, que ya viven en /media.
const OFFLINE_DIRS = ['img', 'brand', 'icons']
const OFFLINE_SKIP = /^img\/ficha\//

function walk(root, dir = '') {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = dir ? `${dir}/${entry.name}` : entry.name
    return entry.isDirectory() ? walk(root, relative) : [relative]
  })
}

export default function pwa({ tilesUrl }) {
  let config

  return {
    name: 'gramalote-pwa',
    apply: 'build',
    configResolved(resolved) {
      config = resolved
    },
    generateBundle(_options, bundle) {
      const base = config.base
      const files = Object.keys(bundle).filter((file) => !file.endsWith('.map'))
      const precache = [
        base,
        ...files.filter((file) => file !== 'index.html').map((file) => `${base}${file}`),
        `${base}favicon.svg`,
        `${base}manifest.webmanifest`,
        `${base}icons/pwa-192.png`,
      ]

      const offline = OFFLINE_DIRS.flatMap((dir) =>
        walk(config.publicDir, dir).filter((file) => !OFFLINE_SKIP.test(file)).map((file) => ({
          url: `${base}${file}`,
          bytes: statSync(path.join(config.publicDir, file)).size,
        })),
      )

      const version = createHash('sha256')
        .update(JSON.stringify([precache, offline]))
        .digest('hex')
        .slice(0, 12)

      let tileOrigin = null
      try {
        tileOrigin = new URL(tilesUrl.replace(/\{[a-z]\}/g, '0')).origin
      } catch {
        tileOrigin = null
      }

      const template = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8')
      const source = template
        .replace('__VERSION__', JSON.stringify(version))
        .replace('__BASE__', JSON.stringify(base))
        .replace('__PRECACHE__', JSON.stringify(precache))
        .replace('__TILE_ORIGIN__', JSON.stringify(tileOrigin))

      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
      this.emitFile({
        type: 'asset',
        fileName: 'offline-manifest.json',
        source: JSON.stringify({ version, shell: precache, files: offline }),
      })
    },
  }
}
