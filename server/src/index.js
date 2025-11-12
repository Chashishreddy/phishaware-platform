import app from './app.js'
import { APP_PORT } from './config.js'
import { migrate } from './migrate.js'
import { startQueue } from './services/sendQueue.js'
import { startRetentionJob } from './services/retention.js'

const bootstrap = async () => {
  await migrate()
  app.listen(APP_PORT, () => {
    console.log(`PhishAware backend running on port ${APP_PORT}. Use only for authorized defensive training.`)
  })
  startQueue()
  startRetentionJob()
}

bootstrap().catch(err => {
  console.error('Failed to start application safely', err)
  process.exit(1)
})
