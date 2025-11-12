import express from 'express'
import { requireAuth, requireRole } from '../utils/auth.js'
import { all, get, run } from '../db.js'
import { logAudit } from '../utils/audit.js'
import { MAILER_ENABLED } from '../config.js'

const router = express.Router()

const attachTargets = async (campaignId, targetIds) => {
  await run('DELETE FROM campaign_targets WHERE campaign_id = ?', [campaignId])
  for (const allowlistId of targetIds) {
    await run('INSERT OR IGNORE INTO campaign_targets (campaign_id, allowlist_entry_id) VALUES (?, ?)', [campaignId, allowlistId])
  }
}

router.get('/', requireAuth, async (req, res) => {
  const campaigns = await all(`SELECT campaigns.*, email_templates.name as email_template_name,
    landing_pages.name as landing_page_name,
    debrief_templates.name as debrief_template_name
    FROM campaigns
    JOIN email_templates ON email_templates.id = campaigns.email_template_id
    JOIN landing_pages ON landing_pages.id = campaigns.landing_page_id
    JOIN debrief_templates ON debrief_templates.id = campaigns.debrief_template_id
    ORDER BY campaigns.created_at DESC`)
  res.json({ campaigns, mailerEnabled: MAILER_ENABLED })
})

router.post('/', requireRole('admin'), async (req, res) => {
  const {
    name,
    description,
    emailTemplateId,
    landingPageId,
    debriefTemplateId,
    scheduledSendAt,
    sendRate,
    targetIds,
    safeTestMode,
    seedAddresses
  } = req.body

  if (!name || !emailTemplateId || !landingPageId || !debriefTemplateId) {
    return res.status(400).json({ message: 'Missing required fields.' })
  }
  if (!Array.isArray(targetIds) || targetIds.length === 0) {
    return res.status(400).json({ message: 'Campaigns must target at least one allowlisted user.' })
  }
  const stmt = await run(`INSERT INTO campaigns (name, description, email_template_id, landing_page_id, debrief_template_id, scheduled_send_at, send_rate, safe_test_mode, seed_addresses, approval_status, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
    name,
    description || '',
    emailTemplateId,
    landingPageId,
    debriefTemplateId,
    scheduledSendAt || null,
    sendRate || 60,
    safeTestMode ? 1 : 0,
    (seedAddresses || []).join(','),
    'pending',
    req.session.user.id
  ])
  const campaignId = stmt.lastID
  await attachTargets(campaignId, targetIds)
  await logAudit({ actorUserId: req.session.user.id, action: 'campaign_created', details: { campaignId } })
  res.status(201).json({ campaignId })
})

router.get('/:id', requireAuth, async (req, res) => {
  const campaign = await get('SELECT * FROM campaigns WHERE id = ?', [req.params.id])
  if (!campaign) {
    return res.status(404).json({ message: 'Not found' })
  }
  const targets = await all(`SELECT allowlist_entries.* FROM campaign_targets JOIN allowlist_entries ON allowlist_entries.id = campaign_targets.allowlist_entry_id WHERE campaign_targets.campaign_id = ?`, [req.params.id])
  res.json({ campaign, targets })
})

router.put('/:id', requireRole('admin'), async (req, res) => {
  const campaign = await get('SELECT * FROM campaigns WHERE id = ?', [req.params.id])
  if (!campaign) {
    return res.status(404).json({ message: 'Not found' })
  }
  if (campaign.approval_status !== 'pending' && campaign.approval_status !== 'draft' && campaign.approval_status !== 'rejected') {
    return res.status(400).json({ message: 'Approved campaigns cannot be modified without resetting approval.' })
  }
  const {
    name,
    description,
    emailTemplateId,
    landingPageId,
    debriefTemplateId,
    scheduledSendAt,
    sendRate,
    targetIds,
    safeTestMode,
    seedAddresses
  } = req.body

  await run(`UPDATE campaigns SET name=?, description=?, email_template_id=?, landing_page_id=?, debrief_template_id=?, scheduled_send_at=?, send_rate=?, safe_test_mode=?, seed_addresses=?, updated_at=datetime('now') WHERE id=?`, [
    name,
    description,
    emailTemplateId,
    landingPageId,
    debriefTemplateId,
    scheduledSendAt,
    sendRate,
    safeTestMode ? 1 : 0,
    (seedAddresses || []).join(','),
    req.params.id
  ])
  if (Array.isArray(targetIds)) {
    await attachTargets(req.params.id, targetIds)
  }
  await logAudit({ actorUserId: req.session.user.id, action: 'campaign_updated', details: { campaignId: req.params.id } })
  res.json({ message: 'Campaign updated.' })
})

router.post('/:id/approve', requireRole('approver', 'admin'), async (req, res) => {
  const campaign = await get('SELECT * FROM campaigns WHERE id = ?', [req.params.id])
  if (!campaign) {
    return res.status(404).json({ message: 'Not found' })
  }
  if (campaign.approval_status !== 'pending') {
    return res.status(400).json({ message: 'Only pending campaigns can be approved.' })
  }
  const { approved } = req.body
  if (!approved) {
    return res.status(400).json({ message: 'Use reject endpoint to decline campaigns.' })
  }
  await run(`UPDATE campaigns SET approval_status='approved', approved_by=?, approved_at=datetime('now') WHERE id=?`, [req.session.user.id, req.params.id])
  await logAudit({ actorUserId: req.session.user.id, action: 'campaign_approved', details: { campaignId: req.params.id } })
  res.json({ message: 'Campaign approved. Sending still requires MAILER_ENABLED and queue processing.' })
})

router.post('/:id/reject', requireRole('approver', 'admin'), async (req, res) => {
  const campaign = await get('SELECT * FROM campaigns WHERE id = ?', [req.params.id])
  if (!campaign) {
    return res.status(404).json({ message: 'Not found' })
  }
  if (campaign.approval_status !== 'pending') {
    return res.status(400).json({ message: 'Only pending campaigns can be rejected.' })
  }
  const { comment } = req.body
  await run(`UPDATE campaigns SET approval_status='rejected', approval_comment=? WHERE id=?`, [comment || '', req.params.id])
  await logAudit({ actorUserId: req.session.user.id, action: 'campaign_rejected', details: { campaignId: req.params.id, comment } })
  res.json({ message: 'Campaign rejected.' })
})

router.get('/:id/report', requireAuth, async (req, res) => {
  const stats = await all(`SELECT event_type, COUNT(*) as count FROM campaign_events WHERE campaign_id = ? GROUP BY event_type`, [req.params.id])
  res.json({ stats })
})

export default router
