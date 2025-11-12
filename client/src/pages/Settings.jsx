import React, { useEffect, useState } from 'react'
import { fetchSettings, requestMailerEnable } from '../api/settings.js'

const Settings = () => {
  const [settings, setSettings] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings().then(setSettings)
  }, [])

  const handleRequest = async () => {
    const response = await requestMailerEnable()
    setMessage(response.message)
  }

  if (!settings) return <p>Loading settings…</p>

  return (
    <div className="card">
      <h2>Safety Settings</h2>
      <p>Mailer is currently <strong>{settings.mailerEnabled ? 'ENABLED (Live emails may send)' : 'DISABLED (console logging only)'}</strong>. Keep disabled until leadership approves and SMTP credentials are properly stored.</p>
      <p>Safe test addresses: {settings.safeTestAddresses.join(', ') || 'None configured'}.</p>
      <p>Data retention policy: {settings.retentionDays} days. Ensure this aligns with HR/privacy requirements.</p>
      <button className="primary" onClick={handleRequest}>Log request to enable mailer</button>
      {message && <p style={{ color: '#1b5e20' }}>{message}</p>}
    </div>
  )
}

export default Settings
