import bcrypt from 'bcryptjs'
import { get } from '../db.js'

export const findUserByEmail = async (email) => {
  return get('SELECT * FROM users WHERE email = ?', [email])
}

export const verifyPassword = (password, hash) => {
  return bcrypt.compare(password, hash)
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Insufficient role for this action.' })
    }
    return next()
  }
}

export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required.' })
  }
  return next()
}
