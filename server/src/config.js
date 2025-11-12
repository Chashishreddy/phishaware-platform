import dotenv from 'dotenv'

dotenv.config()

export const APP_PORT = process.env.PORT || 4000
export const SESSION_SECRET = process.env.SESSION_SECRET || 'development-session-secret-change-me'
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
export const DATABASE_PATH = process.env.DATABASE_PATH || './data/phishaware.db'
export const MAILER_ENABLED = process.env.MAILER_ENABLED === 'true'
export const SMTP_HOST = process.env.SMTP_HOST || ''
export const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASS = process.env.SMTP_PASS || ''
export const SAFE_TEST_ADDRESSES = (process.env.SAFE_TEST_ADDRESSES || '').split(',').filter(Boolean)
export const RETENTION_DAYS = process.env.RETENTION_DAYS ? parseInt(process.env.RETENTION_DAYS, 10) : 90
export const HASH_SALT = process.env.HASH_SALT || 'phishaware-safety-salt'
export const ADMIN_DOMAIN = process.env.ADMIN_DOMAIN || 'http://localhost:5173'
