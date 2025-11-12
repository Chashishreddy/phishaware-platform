import { run } from '../db.js'

export const logAudit = async ({ actorUserId, action, details }) => {
  await run('INSERT INTO audit_logs (actor_user_id, action, details) VALUES (?, ?, ?)', [actorUserId, action, JSON.stringify(details || {})])
}
