import { run } from './db.js'

const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'approver', 'observer')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS allowlist_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    dept TEXT,
    manager TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS landing_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    body_html TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS debrief_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    email_template_id INTEGER NOT NULL REFERENCES email_templates(id),
    landing_page_id INTEGER NOT NULL REFERENCES landing_pages(id),
    debrief_template_id INTEGER NOT NULL REFERENCES debrief_templates(id),
    scheduled_send_at TEXT,
    send_rate INTEGER DEFAULT 60,
    safe_test_mode INTEGER DEFAULT 1,
    seed_addresses TEXT DEFAULT '',
    approval_status TEXT DEFAULT 'draft' CHECK(approval_status IN ('draft','pending','approved','rejected','cancelled','completed')),
    approval_comment TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS campaign_targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    allowlist_entry_id INTEGER NOT NULL REFERENCES allowlist_entries(id),
    UNIQUE(campaign_id, allowlist_entry_id)
  );`,
  `CREATE TABLE IF NOT EXISTS campaign_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    allowlist_entry_id INTEGER REFERENCES allowlist_entries(id),
    event_type TEXT NOT NULL,
    metadata TEXT,
    occurred_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`
]

export const migrate = async () => {
  for (const sql of migrations) {
    await run(sql)
  }
  console.log('Database migrations completed with safety controls ready.')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed', err)
    process.exit(1)
  })
}
