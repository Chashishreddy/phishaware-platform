import express from 'express'
import { all } from '../db.js'
import { requireRole, requireAuth } from '../utils/auth.js'
import { Parser } from 'json2csv'

const router = express.Router()

router.get('/campaign/:id', requireAuth, async (req, res) => {
  const campaignId = req.params.id
  const events = await all('SELECT event_type, metadata FROM campaign_events WHERE campaign_id = ?', [campaignId])
  const counts = events.reduce((acc, evt) => {
    acc[evt.event_type] = (acc[evt.event_type] || 0) + 1
    return acc
  }, {})
  res.json({ counts })
})

router.get('/campaign/:id/export', requireRole('admin'), async (req, res) => {
  const campaignId = req.params.id
  const events = await all('SELECT event_type, metadata, occurred_at FROM campaign_events WHERE campaign_id = ?', [campaignId])
  const rows = events.map(evt => ({
    event_type: evt.event_type,
    occurred_at: evt.occurred_at,
    metadata: evt.metadata
  }))
  const parser = new Parser({ fields: ['event_type', 'occurred_at', 'metadata'] })
  const csv = parser.parse(rows)
  res.header('Content-Type', 'text/csv')
  res.attachment(`campaign-${campaignId}-events.csv`)
  res.send(csv)
})

export default router
