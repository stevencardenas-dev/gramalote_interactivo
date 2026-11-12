import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { ping } from './db.js'
import { errorHandler, notFoundHandler } from './http.js'
import { mediaRoot } from './media.js'
import adminRouter from './routes/admin.js'
import adminMailRouter from './routes/admin-mail.js'
import adminExperiencesRouter from './routes/admin-experiences.js'
import adminExtrasRouter from './routes/admin-extras.js'
import adminRatingsRouter from './routes/admin-ratings.js'
import authRouter from './routes/auth.js'
import curiositiesRouter from './routes/curiosities.js'
import establishmentsRouter from './routes/establishments.js'
import experiencesRouter from './routes/experiences.js'
import historyRouter from './routes/history.js'
import mapRouter from './routes/map.js'
import metaRouter from './routes/meta.js'
import pagesRouter from './routes/pages.js'
import practicalRouter from './routes/practical.js'
import ratingsRouter from './routes/ratings.js'
import searchRouter from './routes/search.js'
import suggestionsRouter from './routes/suggestions.js'
import usersRouter from './routes/users.js'

const app = express()

app.disable('x-powered-by')

if (config.auth.trustProxy) {
  app.set('trust proxy', config.auth.trustProxy)
}

app.use(
  cors({
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
  }),
)
app.use(express.json({ limit: '1mb' }))

// En producción nginx sirve /media/ directo desde el volumen; esto mantiene
// el entorno local y el acceso directo a la API funcionando igual.
app.use(
  config.media.publicBase,
  express.static(mediaRoot(), {
    index: false,
    immutable: true,
    maxAge: '30d',
    fallthrough: false,
  }),
)

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
      'POST /api/auth/forgot',
      'POST /api/auth/reset',
      'POST /api/auth/change-password',
      'GET|POST /api/admin/users',
      'PATCH /api/admin/users/:id',
      'POST /api/admin/users/:id/reset-link',
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
      'GET|POST /api/admin/extras',
      'PATCH|DELETE /api/admin/extras/:id',
      'GET /api/search?q=',
      'GET /api/ratings/top',
      'GET|POST /api/ratings/:kind/:slug (establecimiento|experiencia)',
      'POST /api/ratings/confirm',
      'POST /api/suggestions',
      'GET|PUT /api/admin/mail-settings',
      'POST /api/admin/mail-settings/test',
      'GET /api/admin/mail-log',
      'GET /api/admin/suggestions',
      'PATCH|DELETE /api/admin/suggestions/:id',
      'GET /api/pages/:page',
      'GET /api/admin/pages',
      'PUT|DELETE /api/admin/pages/:page',
      'POST /api/admin/pages/media',
      'GET|DELETE /api/admin/:kind/:id/ratings (establishments|experiences)',
      'DELETE /api/admin/:kind/:id/ratings/:ratingId',
      'GET /api/admin/establishments',
      'GET /api/admin/establishments/:id',
      'PATCH /api/admin/establishments/:id',
      'POST /api/admin/media',
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
  adminRouter,
  adminExperiencesRouter,
  adminExtrasRouter,
  adminRatingsRouter,
  adminMailRouter,
  suggestionsRouter,
  pagesRouter,
  usersRouter,
  metaRouter,
  establishmentsRouter,
  experiencesRouter,
  curiositiesRouter,
  historyRouter,
  practicalRouter,
  ratingsRouter,
  mapRouter,
  searchRouter,
)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
