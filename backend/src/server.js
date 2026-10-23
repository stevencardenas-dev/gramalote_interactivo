import app from './app.js'
import { config } from './config.js'
import { closePool, ping } from './db.js'

const server = app.listen(config.port, config.host, async () => {
  try {
    await ping()
    console.log(
      `Gramalote API disponible en http://${config.host}:${config.port}/api`,
    )
  } catch (error) {
    console.error('No fue posible conectar con MySQL:', error.message)
  }
})

async function shutdown(signal) {
  console.log(`${signal} recibido, cerrando API`)
  server.close(async () => {
    await closePool()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
