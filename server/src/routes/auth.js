import express from 'express'
import { findUserByEmail, verifyPassword } from '../utils/auth.js'
import { logAudit } from '../utils/audit.js'

const router = express.Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }
  const user = await findUserByEmail(email)
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }
  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' })
  }
  req.session.user = { id: user.id, email: user.email, role: user.role, name: user.name }
  await logAudit({ actorUserId: user.id, action: 'login', details: { email: user.email } })
  return res.json({ user: req.session.user })
})

router.post('/logout', async (req, res) => {
  const actor = req.session.user
  req.session.destroy(() => {})
  if (actor) {
    await logAudit({ actorUserId: actor.id, action: 'logout', details: {} })
  }
  res.json({ message: 'Logged out.' })
})

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not authenticated.' })
  }
  return res.json({ user: req.session.user })
})

export default router
