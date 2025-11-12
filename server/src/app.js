import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import rateLimit from 'express-rate-limit'
import { SESSION_SECRET, ADMIN_DOMAIN } from './config.js'
import authRoutes from './routes/auth.js'
import allowlistRoutes from './routes/allowlist.js'
import campaignRoutes from './routes/campaigns.js'
import eventRoutes from './routes/events.js'
import analyticsRoutes from './routes/analytics.js'
import settingsRoutes from './routes/settings.js'

const app = express()

app.use(helmet({
  contentSecurityPolicy: false
}))
app.use(cors({
  origin: ADMIN_DOMAIN,
  credentials: true
}))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.set('trust proxy', 1)
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
}))

const csrfProtection = csrf({ cookie: false, value: (req) => req.headers['x-csrf-token'] })
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 120 }))
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }
  return csrfProtection(req, res, next)
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Use only for authorized internal awareness training. Unauthorized use is prohibited.' })
})

app.get('/api/csrf', csrfProtection, (req, res) => {
  res.json({ token: req.csrfToken() })
})

app.use('/api/auth', authRoutes)
app.use('/api/allowlist', allowlistRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/', eventRoutes)

app.use((err, req, res, next) => {
  console.error('Unhandled error', err)
  res.status(500).json({ message: 'Internal error. Review logs and ensure safety controls remain in place.' })
})

export default app
