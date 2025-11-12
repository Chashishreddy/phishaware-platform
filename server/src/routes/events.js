import express from 'express'
import { run, get } from '../db.js'
import { hashValue } from '../utils/hash.js'
import { v4 as uuidv4 } from 'uuid'
import { logAudit } from '../utils/audit.js'
import Handlebars from 'handlebars'

const router = express.Router()

const findAllowlistEntry = async (email) => {
  return get('SELECT * FROM allowlist_entries WHERE email = ?', [email.toLowerCase()])
}

router.get('/track/pixel', async (req, res) => {
  const { campaign_id: campaignId, email } = req.query
  if (!campaignId || !email) {
    return res.status(400).send('Missing parameters')
  }
  const allowlistEntry = await findAllowlistEntry(email)
  await run(`INSERT INTO campaign_events (campaign_id, allowlist_entry_id, event_type, metadata) VALUES (?, ?, 'open', ?)`, [campaignId, allowlistEntry?.id || null, JSON.stringify({ hashedEmail: hashValue(email), ip: hashValue(req.ip) })])
  const img = Buffer.from('R0lGODlhAQABAIAAAP///////ywAAAAAAQABAAACAkQBADs=', 'base64')
  res.set('Content-Type', 'image/gif')
  res.send(img)
})

router.get('/track/click', async (req, res) => {
  const { campaign_id: campaignId, email, redirect } = req.query
  if (!campaignId || !email || !redirect) {
    return res.status(400).send('Missing parameters')
  }
  const allowlistEntry = await findAllowlistEntry(email)
  await run(`INSERT INTO campaign_events (campaign_id, allowlist_entry_id, event_type, metadata) VALUES (?, ?, 'click', ?)`, [campaignId, allowlistEntry?.id || null, JSON.stringify({ hashedEmail: hashValue(email), redirect, ip: hashValue(req.ip) })])
  res.redirect(302, redirect)
})

router.get('/r/:campaignId/:email', async (req, res) => {
  const { campaignId } = req.params
  const email = decodeURIComponent(req.params.email)
  const campaign = await get('SELECT * FROM campaigns WHERE id = ?', [campaignId])
  if (!campaign) {
    return res.status(404).send('Campaign not found')
  }
  const allowlistEntry = await findAllowlistEntry(email)
  if (!allowlistEntry) {
    return res.status(403).send('Recipient not authorized for this training exercise.')
  }
  const allowedTarget = await get('SELECT 1 FROM campaign_targets WHERE campaign_id = ? AND allowlist_entry_id = ?', [campaignId, allowlistEntry.id])
  if (!allowedTarget) {
    return res.status(403).send('Recipient not in campaign allowlist.')
  }
  const landing = await get('SELECT * FROM landing_pages WHERE id = ?', [campaign.landing_page_id])
  if (!landing) {
    return res.status(500).send('Landing page missing')
  }
  await run(`INSERT INTO campaign_events (campaign_id, allowlist_entry_id, event_type, metadata) VALUES (?, ?, 'click', ?)`, [campaignId, allowlistEntry.id, JSON.stringify({ hashedEmail: hashValue(email), ip: hashValue(req.ip), via: 'redirect' })])
  const template = Handlebars.compile(landing.body_html)
  const html = template({
    campaign_id: campaignId,
    email,
    first_name: allowlistEntry.first_name || '',
    dept: allowlistEntry.dept || ''
  })
  res.send(html)
})

router.post('/simulate/submit', async (req, res) => {
  const { campaignId, email, requestedSupport } = req.body
  if (!campaignId || !email) {
    return res.status(400).json({ message: 'Missing campaignId or email' })
  }
  const allowlistEntry = await findAllowlistEntry(email)
  const guid = uuidv4()
  // WARNING: DO NOT store or log raw credential data here. This endpoint intentionally discards sensitive fields.
  await run(`INSERT INTO campaign_events (campaign_id, allowlist_entry_id, event_type, metadata) VALUES (?, ?, 'simulated_submission', ?)`, [
    campaignId,
    allowlistEntry?.id || null,
    JSON.stringify({
      hashedEmail: hashValue(email),
      simulated_entry: true,
      guid,
      timestamp: new Date().toISOString(),
      requestedSupport: requestedSupport ? 'flagged' : 'not_provided'
    })
  ])
  await logAudit({ actorUserId: null, action: 'simulated_submission', details: { campaignId } })
  res.json({ message: 'Simulation recorded safely.', reference: guid })
})

export default router
