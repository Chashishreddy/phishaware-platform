process.env.DATABASE_PATH = ':memory:'
process.env.SESSION_SECRET = 'test-secret'
process.env.ADMIN_DOMAIN = 'http://localhost'

import request from 'supertest'
import bcrypt from 'bcryptjs'
import { migrate } from '../src/migrate.js'
import app from '../src/app.js'
import { run, all } from '../src/db.js'

beforeAll(async () => {
  await migrate()
  const passwordHash = bcrypt.hashSync('password', 10)
  await run(`INSERT INTO users (email, name, password_hash, role) VALUES ('admin@test', 'Admin', ?, 'admin')`, [passwordHash])
  await run(`INSERT INTO users (email, name, password_hash, role) VALUES ('approver@test', 'Approver', ?, 'approver')`, [passwordHash])
  await run(`INSERT INTO allowlist_entries (id, email) VALUES (1, 'user1@example.com')`)
  await run(`INSERT INTO email_templates (id, name, subject, body_html) VALUES (1,'tmpl','subject','<p>{{first_name}}</p>')`)
  await run(`INSERT INTO landing_pages (id, name, body_html) VALUES (1,'landing','<p>Landing</p>')`)
  await run(`INSERT INTO debrief_templates (id, name, body_markdown) VALUES (1,'debrief','# Debrief')`)
})

const getToken = async (agent) => {
  const res = await agent.get('/api/csrf')
  return res.body.token
}

describe('Safety controls', () => {
  it('prevents campaign creation without allowlist targets', async () => {
    const agent = request.agent(app)
    const token = await getToken(agent)
    await agent.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'admin@test', password: 'password' })
    const newToken = await getToken(agent)
    const res = await agent.post('/api/campaigns').set('x-csrf-token', newToken).send({
      name: 'Test',
      emailTemplateId: 1,
      landingPageId: 1,
      debriefTemplateId: 1,
      targetIds: []
    })
    expect(res.statusCode).toBe(400)
  })

  it('records simulated submissions without raw secrets', async () => {
    const res = await request(app).post('/simulate/submit').send({ campaignId: 1, email: 'user1@example.com', password: 'secret' })
    expect(res.statusCode).toBe(200)
    const events = await all(`SELECT metadata FROM campaign_events WHERE event_type='simulated_submission'`)
    expect(events.length).toBeGreaterThan(0)
    const payload = JSON.parse(events[0].metadata)
    expect(payload.simulated_entry).toBe(true)
    expect(payload.guid).toBeDefined()
    expect(payload).not.toHaveProperty('password')
  })

  it('requires approval workflow', async () => {
    const admin = request.agent(app)
    const token = await getToken(admin)
    await admin.post('/api/auth/login').set('x-csrf-token', token).send({ email: 'admin@test', password: 'password' })
    const createToken = await getToken(admin)
    const create = await admin.post('/api/campaigns').set('x-csrf-token', createToken).send({
      name: 'Another',
      emailTemplateId: 1,
      landingPageId: 1,
      debriefTemplateId: 1,
      targetIds: [1]
    })
    expect(create.statusCode).toBe(201)
    const campaignId = create.body.campaignId
    const approver = request.agent(app)
    const approverToken = await getToken(approver)
    await approver.post('/api/auth/login').set('x-csrf-token', approverToken).send({ email: 'approver@test', password: 'password' })
    const approveToken = await getToken(approver)
    const approve = await approver.post(`/api/campaigns/${campaignId}/approve`).set('x-csrf-token', approveToken).send({ approved: true })
    expect(approve.statusCode).toBe(200)
  })
})
