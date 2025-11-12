import React, { useEffect, useState } from 'react'
import { fetchAllowlist } from '../api/allowlist.js'
import { createCampaign } from '../api/campaigns.js'

const CampaignForm = ({ user }) => {
  const [allowlist, setAllowlist] = useState([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    emailTemplateId: 1,
    landingPageId: 1,
    debriefTemplateId: 1,
    scheduledSendAt: '',
    sendRate: 60,
    targetIds: [],
    safeTestMode: true,
    seedAddresses: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllowlist().then(setAllowlist)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        targetIds: form.targetIds.map(id => Number(id)),
        seedAddresses: form.seedAddresses.split(',').map(s => s.trim()).filter(Boolean)
      }
      await createCampaign(payload)
      setMessage('Campaign created and moved to pending approval. An approver must review before any sends occur.')
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign.')
      setMessage('')
    }
  }

  const toggleTarget = (id) => {
    setForm(prev => ({
      ...prev,
      targetIds: prev.targetIds.includes(id) ? prev.targetIds.filter(x => x !== id) : [...prev.targetIds, id]
    }))
  }

  return (
    <div className="card">
      <h2>Create Campaign</h2>
      <p>Ensure the allowlist contains only employees who have consented to simulated training. Document HR/legal approvals before proceeding.</p>
      {message && <p style={{ color: '#1b5e20' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <label>Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <label>Email Template</label>
        <select value={form.emailTemplateId} onChange={e => setForm({ ...form, emailTemplateId: Number(e.target.value) })}>
          <option value={1}>Package Delivery</option>
          <option value={2}>Security Update</option>
          <option value={3}>HR Policy Change</option>
        </select>
        <label>Landing Page</label>
        <select value={form.landingPageId} onChange={e => setForm({ ...form, landingPageId: Number(e.target.value) })}>
          <option value={1}>Delivery Landing</option>
          <option value={2}>Security Landing</option>
          <option value={3}>HR Landing</option>
        </select>
        <label>Debrief Template (required)</label>
        <select value={form.debriefTemplateId} onChange={e => setForm({ ...form, debriefTemplateId: Number(e.target.value) })}>
          <option value={1}>Delivery Debrief</option>
          <option value={2}>Security Debrief</option>
          <option value={3}>HR Debrief</option>
        </select>
        <label>Scheduled Send (UTC)</label>
        <input type="datetime-local" value={form.scheduledSendAt} onChange={e => setForm({ ...form, scheduledSendAt: e.target.value })} />
        <label>Send Rate (emails per minute)</label>
        <input type="number" min="1" value={form.sendRate} onChange={e => setForm({ ...form, sendRate: Number(e.target.value) })} />
        <label>Safe Test Mode</label>
        <input type="checkbox" checked={form.safeTestMode} onChange={e => setForm({ ...form, safeTestMode: e.target.checked })} />
        <p style={{ fontSize: '0.9rem' }}>Safe test mode restricts sends to the comma-separated seed addresses listed below and is strongly recommended for dry runs.</p>
        <label>Seed / Test Addresses</label>
        <input value={form.seedAddresses} onChange={e => setForm({ ...form, seedAddresses: e.target.value })} placeholder="test1@example.com, test2@example.com" />
        <div>
          <h4>Select Allowlisted Targets</h4>
          {allowlist.map(entry => (
            <label key={entry.id} style={{ display: 'block', marginBottom: '0.25rem' }}>
              <input type="checkbox" checked={form.targetIds.includes(entry.id)} onChange={() => toggleTarget(entry.id)} /> {entry.email} ({entry.dept})
            </label>
          ))}
          {allowlist.length === 0 && <p>Upload allowlist entries before launching campaigns.</p>}
        </div>
        <button className="primary" type="submit">Submit for Approval</button>
      </form>
    </div>
  )
}

export default CampaignForm
