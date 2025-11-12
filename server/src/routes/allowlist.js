import express from 'express'
import multer from 'multer'
import { parse } from 'csv-parse/sync'
import { requireRole, requireAuth } from '../utils/auth.js'
import { all, run } from '../db.js'
import { logAudit } from '../utils/audit.js'

const upload = multer({ storage: multer.memoryStorage() })
const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  const entries = await all('SELECT * FROM allowlist_entries ORDER BY email ASC')
  res.json({ entries })
})

router.post('/import', requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'CSV file required.' })
  }
  const records = parse(req.file.buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  })
  let imported = 0
  for (const record of records) {
    if (!record.email) continue
    await run(`INSERT OR IGNORE INTO allowlist_entries (email, first_name, last_name, dept, manager) VALUES (?,?,?,?,?)`, [
      record.email.trim().toLowerCase(),
      record.first_name || '',
      record.last_name || '',
      record.dept || '',
      record.manager || ''
    ])
    imported += 1
  }
  await logAudit({ actorUserId: req.session.user.id, action: 'allowlist_import', details: { count: imported } })
  res.json({ message: 'Allowlist updated.', imported })
})

router.delete('/:id', requireRole('admin'), async (req, res) => {
  await run('DELETE FROM allowlist_entries WHERE id = ?', [req.params.id])
  await logAudit({ actorUserId: req.session.user.id, action: 'allowlist_delete', details: { id: req.params.id } })
  res.json({ message: 'Entry removed.' })
})

export default router
