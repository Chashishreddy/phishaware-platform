# PhishAware Platform

> **Use this platform only for authorized, internal phishing awareness simulations. Never deploy it to test external parties, contractors, or without clear HR/legal approval.**

This repository provides a production-ready scaffold for a phishing detection awareness platform with strict safety and governance controls. It includes:

- Node.js (Express) backend with SQLite storage
- React administrative frontend (Vite)
- Allowlist management, approval workflow, audit logging, reporting, and safe mailer abstraction
- Sample email templates, landing pages, and allowlist CSV
- Docker Compose configuration for local evaluation

## Features & Safety Controls

- **Allowlist enforcement**: Campaigns target only entries imported via CSV. No ad-hoc email additions are allowed.
- **Approval workflow**: Campaigns remain pending until an approver or admin explicitly approves them. All approvals and enablement requests are audited.
- **Mailer gating**: Email sending defaults to console logging. Live SMTP requires `MAILER_ENABLED=true`, valid credentials, and prior approval.
- **No credential storage**: Simulated landing pages never capture or store raw credentials—only `simulated_entry=true` with a GUID and timestamp.
- **Mandatory debrief**: Every campaign references a debrief template so participants receive context and resources.
- **Privacy**: IP addresses are SHA256 hashed with a salt. Data retention automatically purges historical events after the configured number of days.
- **Legal reminders** are displayed throughout the UI and documented below.

## Quick Start

1. Clone the repository and install dependencies.

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. Copy environment template and adjust values (especially secrets).

   ```bash
   cp ../.env.example ../.env
   ```

3. Initialize the database and seed sample data (default admin credentials are for local testing only—change immediately in production).

   ```bash
   cd server
   npm run migrate
   npm run seed
   ```

4. Start backend and frontend in development mode.

   ```bash
   # Terminal 1
   cd server
   npm run dev

   # Terminal 2
   cd client
   npm run dev
   ```

5. Sign in at `http://localhost:5173` using one of the seeded accounts:

   - `admin@example.com` / `ChangeMeAdmin123!`
   - `approver@example.com` / `ChangeMeApprover123!`
   - `observer@example.com` / `ChangeMeObserver123!`

   Update these passwords immediately before any internal use.

## Docker Usage

For a containerized local setup:

```bash
docker-compose up --build
```

The backend listens on `localhost:4000` and the Vite preview frontend on `localhost:5173`.

## Running Tests

Backend unit tests verify key safety controls.

```bash
cd server
npm test
```

Tests ensure campaigns cannot bypass approval, allowlists are required, and simulated submissions do not store raw passwords.

## Legal & Ethical Checklist

Before each campaign:

- ✅ Confirm HR and legal approval is documented.
- ✅ Verify union agreements and local labor laws permit simulated phishing.
- ✅ Exclude contractors, external vendors, and jurisdictions where consent is not granted.
- ✅ Provide a clear escalation path for employees who are concerned or distressed.
- ✅ Schedule and deliver a debrief to all participants immediately after the campaign.
- ✅ Coordinate with IT support so suspected real phishing can still be reported without confusion.

Failure to meet these conditions means the campaign must not proceed.

## Mailer Configuration

- By default, the server uses the `ConsoleMailer` to log email bodies instead of sending.
- To enable SMTP sends you must set `MAILER_ENABLED=true` and provide `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in the environment.
- Enabling the mailer should only occur after the approval workflow is complete and leadership signs off. Attempts to enable are logged to the audit trail.

## Data Retention & Privacy

- Configure `RETENTION_DAYS` in `.env`. The backend purges campaign events older than this value every 24 hours.
- IP addresses and recipient identifiers are hashed with a salted SHA256 digest prior to storage.
- CSV exports contain pseudonymous metadata; emails are included only when admins explicitly request them.

## Allowlist Import

Use the provided sample CSV (`data/sample-allowlist.csv`) structure:

```csv
email,first_name,last_name,dept,manager
alex.jordan@example.com,Alex,Jordan,Security,Jamie Rivera
```

Upload allowlists via the admin UI. Only include employees who have consented to awareness exercises.

## Sample Email Templates

Templates use Handlebars-style placeholders: `{{first_name}}`, `{{last_name}}`, `{{dept}}`, `{{manager}}`, `{{tracking_link}}`.

1. **Package Delivery Check-In** – Friendly reminder to confirm a package.
2. **Security Update Reminder** – Encourages reviewing MFA guidance.
3. **HR Policy Review** – Prompts acknowledgement of HR commitments.

Edit or extend templates under `server/templates/email/` while keeping messaging non-deceptive and focused on awareness.

## Landing Pages

Two example landing pages live under `server/templates/landing/`:

- `safety-message.html` – Delivery preference confirmation with explicit simulation notice after submission.
- `security-advice.html` – Security reminder acknowledgement with positive reinforcement.

Each page displays a clear disclosure once the user interacts or if `?debug=1` is appended to the URL. Forms never transmit raw credentials—only simulation markers.

## Tracking Endpoints

Example cURL requests for validation (replace IDs and emails with test accounts):

```bash
# Open tracking pixel
curl "http://localhost:4000/track/pixel?campaign_id=1&email=test@example.com" --output pixel.gif

# Click tracking (follows redirect)
curl -L "http://localhost:4000/track/click?campaign_id=1&email=test@example.com&redirect=http://localhost:4000/landing"

# Simulated submission
curl -X POST http://localhost:4000/simulate/submit \
  -H 'Content-Type: application/json' \
  -d '{"campaignId":1,"email":"test@example.com"}'
```

## Analytics & SQL Examples

The `/api/analytics/campaign/:id` endpoint returns aggregated counts by event type. For deeper analysis in SQLite:

```sql
-- Click rate for a campaign
SELECT
  SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS click_rate
FROM campaign_events
WHERE campaign_id = 1;

-- Simulated submissions by department
SELECT al.dept, COUNT(*) AS submissions
FROM campaign_events ce
JOIN allowlist_entries al ON al.id = ce.allowlist_entry_id
WHERE ce.campaign_id = 1 AND ce.event_type = 'simulated_submission'
GROUP BY al.dept;
```

Always interpret metrics with care—reinforce positive behaviors and avoid shaming individuals.

## Debrief Distribution

The queue marks campaigns as completed after sends and should trigger your debrief process (e.g., send debrief emails via the console mailer output). Ensure follow-up communications are sent promptly.

## Human Oversight Requirements

- Attempts to bypass allowlist or disable safety checks must be logged and reviewed.
- Never modify the code to store real passwords or personal data. Comments in the code highlight sections where sensitive data must **never** be recorded.
- Approvers must be named individuals. Maintain an audit of who approved each campaign and why.

## Support

Questions or suggested improvements should go through your internal security governance team. If an employee becomes distressed, pause the campaign and coordinate with HR for follow-up support.
