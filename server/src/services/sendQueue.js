import { createMailer } from './mailer.js'
import { all, run, get } from '../db.js'
import { MAILER_ENABLED, SAFE_TEST_ADDRESSES } from '../config.js'
import { logAudit } from '../utils/audit.js'
import Handlebars from 'handlebars'

const mailer = createMailer()
let processing = false

const hydrateTargets = async (campaignId) => {
  const targets = await all(`SELECT allowlist_entries.* FROM campaign_targets
    JOIN allowlist_entries ON allowlist_entries.id = campaign_targets.allowlist_entry_id
    WHERE campaign_targets.campaign_id = ?`, [campaignId])
  return targets
}

const renderTemplate = (templateString, variables) => {
  const compiled = Handlebars.compile(templateString)
  return compiled(variables)
}

const markCampaignCompleted = async (campaignId) => {
  await run('UPDATE campaigns SET approval_status = ? WHERE id = ?', ['completed', campaignId])
}

export const processQueue = async () => {
  if (processing) return
  processing = true
  try {
    const campaigns = await all(`SELECT * FROM campaigns WHERE approval_status = 'approved' AND scheduled_send_at IS NOT NULL AND datetime(scheduled_send_at) <= datetime('now')`)
    for (const campaign of campaigns) {
      const targets = await hydrateTargets(campaign.id)
      if (!targets.length) {
        console.warn('Campaign has no targets; skipping send to maintain allowlist protection', campaign.id)
        continue
      }
      const template = await get('SELECT * FROM email_templates WHERE id = ?', [campaign.email_template_id])
      if (!template) {
        console.error('Email template missing; skipping campaign', campaign.id)
        continue
      }
      const perMinute = campaign.send_rate || 60
      const delay = Math.ceil(60000 / perMinute)
      for (const target of targets) {
        const recipient = target.email
        if (campaign.safe_test_mode) {
          if (!SAFE_TEST_ADDRESSES.includes(recipient)) {
            console.warn('Safe test mode prevents sending to non-test address:', recipient)
            continue
          }
        }
        if (!MAILER_ENABLED) {
          console.warn('MAILER_ENABLED is false; using console mailer for all sends to prevent live dispatch.')
        }
        const trackingLink = `${process.env.PUBLIC_BASE_URL || 'http://localhost:4000'}/r/${campaign.id}/${encodeURIComponent(recipient)}`
        const html = renderTemplate(template.body_html, {
          first_name: target.first_name || '',
          last_name: target.last_name || '',
          dept: target.dept || '',
          manager: target.manager || '',
          tracking_link: trackingLink
        })
        const text = `Awareness training simulation for ${target.first_name || target.email}. Visit ${trackingLink}. If unsure, report to security.`
        await mailer.sendMail({
          to: recipient,
          subject: template.subject,
          text,
          html
        })
        await run('INSERT INTO audit_logs (actor_user_id, action, details) VALUES (?, ?, ?)', [campaign.approved_by, 'email_sent', JSON.stringify({ campaignId: campaign.id, recipient })])
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      await markCampaignCompleted(campaign.id)
      await logAudit({ actorUserId: campaign.approved_by, action: 'campaign_completed', details: { campaignId: campaign.id } })
    }
  } catch (err) {
    console.error('Queue processing error', err)
  } finally {
    processing = false
  }
}

export const startQueue = () => {
  setInterval(processQueue, 15000)
}
