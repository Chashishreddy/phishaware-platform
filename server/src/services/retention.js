import { run } from '../db.js'
import { RETENTION_DAYS } from '../config.js'

export const purgeOldEvents = async () => {
  await run(`DELETE FROM campaign_events WHERE occurred_at < datetime('now', ?)`, [`-${RETENTION_DAYS} days`])
}

export const startRetentionJob = () => {
  setInterval(purgeOldEvents, 24 * 60 * 60 * 1000)
}
