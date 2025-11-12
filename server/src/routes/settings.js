import express from 'express'
import { MAILER_ENABLED, SAFE_TEST_ADDRESSES, RETENTION_DAYS } from '../config.js'
import { requireRole } from '../utils/auth.js'
import { logAudit } from '../utils/audit.js'

const router = express.Router()

router.get('/', requireRole('admin'), async (req, res) => {
  res.json({
    mailerEnabled: MAILER_ENABLED,
    safeTestAddresses: SAFE_TEST_ADDRESSES,
    retentionDays: RETENTION_DAYS
  })
})

router.post('/request-mailer-enable', requireRole('admin'), async (req, res) => {
  await logAudit({ actorUserId: req.session.user.id, action: 'mailer_enable_requested', details: { requested: true } })
  res.json({
    message: 'Mailer enablement requires MAILER_ENABLED=true in environment. This action has been logged for compliance. Ensure HR/legal approval before enabling.'
  })
})

export default router
