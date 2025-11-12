import bcrypt from 'bcryptjs'
import { run } from './db.js'

const seed = async () => {
  const adminPassword = bcrypt.hashSync('ChangeMeAdmin123!', 10)
  const approverPassword = bcrypt.hashSync('ChangeMeApprover123!', 10)
  const observerPassword = bcrypt.hashSync('ChangeMeObserver123!', 10)

  await run(`INSERT OR IGNORE INTO users (email, name, password_hash, role) VALUES
    ('admin@example.com', 'Admin User', ?, 'admin'),
    ('approver@example.com', 'Approver User', ?, 'approver'),
    ('observer@example.com', 'Observer User', ?, 'observer')
  `, [adminPassword, approverPassword, observerPassword])

  await run(`INSERT OR IGNORE INTO email_templates (id, name, subject, body_html) VALUES
    (1, 'Package Delivery Check-In', 'Package delivery confirmation needed', '<p>Hello {{first_name}},</p><p>Our mailroom noticed a package addressed to you. Please <a href="{{tracking_link}}">confirm delivery preferences</a> within 24 hours.</p><p>If this looks suspicious, please report it immediately.</p>'),
    (2, 'Security Update Reminder', 'Security update acknowledgement required', '<p>{{first_name}},</p><p>We are validating awareness of our latest security reminder. Please review the short notice <a href="{{tracking_link}}">here</a> and acknowledge you have read it.</p><p>If unsure, contact the security team.</p>'),
    (3, 'HR Policy Review', 'HR policy update review', '<p>Hi {{first_name}},</p><p>HR has issued a refresh of our respectful workplace commitments. Please <a href="{{tracking_link}}">review the highlights</a> and confirm receipt.</p><p>If anything seems off, alert HR right away.</p>')
  `)

  await run(`INSERT OR IGNORE INTO landing_pages (id, name, body_html) VALUES
    (1, 'Package Delivery Landing', '<h1>Delivery Preference Center</h1><p>Please confirm how you would like to receive your package.</p>'),
    (2, 'Security Update Landing', '<h1>Security Awareness Check</h1><p>Review the update and confirm your understanding.</p>'),
    (3, 'HR Policy Landing', '<h1>HR Policy Review</h1><p>Please acknowledge that you have read the HR summary.</p>')
  `)

  await run(`INSERT OR IGNORE INTO debrief_templates (id, name, body_markdown) VALUES
    (1, 'Delivery Debrief', '# Delivery Simulation Debrief\nThis was a training email. Review secure package handling tips.\n- Confirm unexpected deliveries with the mailroom.\n- Do not enter credentials on unfamiliar sites.\n- Contact security@company.test with questions.'),
    (2, 'Security Update Debrief', '# Security Update Simulation\nThank you for participating. Review multi-factor guidance and report suspicious links.'),
    (3, 'HR Policy Debrief', '# HR Awareness Simulation\nRevisit HR resources on the intranet and talk with your manager if unsure.')
  `)

  console.log('Seed data ready. Update default passwords immediately in production!')
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('Seed failed', err)
  process.exit(1)
})
