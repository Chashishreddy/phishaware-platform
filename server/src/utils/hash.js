import crypto from 'crypto'
import { HASH_SALT } from '../config.js'

export const hashValue = (value) => {
  if (!value) return null
  return crypto.createHash('sha256').update(`${HASH_SALT}:${value}`).digest('hex')
}
