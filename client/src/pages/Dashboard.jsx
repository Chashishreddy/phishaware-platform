import React, { useEffect, useState } from 'react'
import { fetchCampaigns } from '../api/campaigns.js'

const Dashboard = ({ user }) => {
  const [campaigns, setCampaigns] = useState([])
  const [mailerEnabled, setMailerEnabled] = useState(false)

  useEffect(() => {
    fetchCampaigns().then(data => {
      setCampaigns(data.campaigns)
      setMailerEnabled(data.mailerEnabled)
    })
  }, [])

  return (
    <div>
      <div className="card">
        <h2>Welcome, {user.name}</h2>
        <p>Role: {user.role}. Remember: do not proceed with campaigns without HR/legal coordination and a planned debrief.</p>
        {!mailerEnabled && (
          <p style={{ color: '#d84315' }}>Mailer is in console-only mode. Email dispatch is disabled unless MAILER_ENABLED=true and SMTP credentials are provided. This prevents accidental phishing.</p>
        )}
      </div>
      <div className="card">
        <h3>Recent Campaigns</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Scheduled</th>
              <th>Debrief Template</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.approval_status}</td>
                <td>{c.scheduled_send_at || 'Not set'}</td>
                <td>{c.debrief_template_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {campaigns.length === 0 && <p>No campaigns yet. Start with a small test using safe test addresses.</p>}
      </div>
    </div>
  )
}

export default Dashboard
