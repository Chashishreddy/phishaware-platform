import React, { useEffect, useState } from 'react'
import { approveCampaign, rejectCampaign, fetchCampaigns } from '../api/campaigns.js'

const Approvals = ({ user }) => {
  const [campaigns, setCampaigns] = useState([])
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCampaigns().then(data => setCampaigns(data.campaigns))
  }, [])

  const pending = campaigns.filter(c => c.approval_status === 'pending')

  const handleApprove = async (id) => {
    await approveCampaign(id)
    setMessage('Campaign approved. Reminder: Sends still require MAILER_ENABLED=true and only after final go/no-go meeting.')
    setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, approval_status: 'approved' } : c)))
  }

  const handleReject = async (id) => {
    await rejectCampaign(id, comment)
    setMessage('Campaign rejected with comment. Ensure creator is notified and debrief plan remains scheduled.')
    setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, approval_status: 'rejected', approval_comment: comment } : c)))
    setComment('')
  }

  if (user.role === 'observer') {
    return <p>Observers can review campaign status but cannot approve.</p>
  }

  return (
    <div className="card">
      <h2>Pending Campaign Approvals</h2>
      <p>Approvers must verify allowlist, templates, and debrief plan before approving. Document your review.</p>
      {message && <p style={{ color: '#1b5e20' }}>{message}</p>}
      {pending.map(c => (
        <div key={c.id} style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h3>{c.name}</h3>
          <p>{c.description}</p>
          <p>Scheduled: {c.scheduled_send_at || 'Not set'} | Send rate: {c.send_rate} emails/min | Safe test mode: {c.safe_test_mode ? 'Enabled' : 'Disabled'}</p>
          <p>Debrief template: {c.debrief_template_name}</p>
          <textarea placeholder="Approval comment" value={comment} onChange={e => setComment(e.target.value)} />
          <div>
            <button className="primary" onClick={() => handleApprove(c.id)}>Approve</button>
            <button className="secondary" onClick={() => handleReject(c.id)}>Reject</button>
          </div>
        </div>
      ))}
      {pending.length === 0 && <p>No campaigns awaiting approval.</p>}
    </div>
  )
}

export default Approvals
