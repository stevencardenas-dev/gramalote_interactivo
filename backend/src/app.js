import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { ping } from './db.js'
import { errorHandler, notFoundHandler } from './http.js'
import authRouter from './routes/auth.js'
import curiositiesRouter from './routes/curiosities.js'
import establishmentsRouter from './routes/establishments.js'
import experiencesRouter from './routes/experiences.js'
import historyRouter from './routes/history.js'
import mapRouter from './routes/map.js'
import metaRouter from './routes/meta.js'
import practicalRouter from './routes/practical.js'
import searchRouter from './routes/search.js'

const app = express()

app.disable('x-powered-by')

if (config.auth.trustProxy) {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api', (_req, res) => {
  res.json({
    name: 'Gramalote Interactivo API',
    version: '0.1.0',
    endpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'GET /api/auth/me',
      'GET /api/meta',
      'GET /api/site',
      'GET /api/settings/:key',
      'GET /api/establishments',
      'GET /api/establishments/:slug',
      'GET /api/experiences',
      'GET /api/experiences/:slug',
      'GET /api/experiences/:slug/tips',
      'GET /api/curiosities',
      'GET /api/curiosities/:slug',
      'GET /api/history',
      'GET /api/history/:slug',
      'GET /api/practical',
      'GET /api/map',
      'GET /api/search?q=',
    ],
  })
})

app.get('/api/health', async (_req, res) => {
  try {
    await ping()
    res.json({
      status: 'ok',
      database: 'ok',
      environment: config.env,
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(503).json({
      status: 'degraded',
      database: 'error',
      environment: config.env,
      timestamp: new Date().toISOString(),
    })
  }
})

app.use(
  '/api',
  authRouter,
  metaRouter,
  establishmentsRouter,
  experiencesRouter,
  curiositiesRouter,
  historyRouter,
  practicalRouter,
  mapRouter,
  searchRouter,
)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
