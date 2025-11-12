import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import CampaignForm from './pages/CampaignForm.jsx'
import Approvals from './pages/Approvals.jsx'
import Allowlist from './pages/Allowlist.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import { getSession } from './api/auth.js'

const App = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getSession().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    setUser(null)
    navigate('/login')
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <header>
        <h1>PhishAware Awareness Training Console</h1>
        <p>Authorized internal use only. All campaigns must be debriefed and approved.</p>
        {user && (
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/campaigns/new">Create Campaign</Link>
            <Link to="/approvals">Approvals</Link>
            <Link to="/allowlist">Allowlist</Link>
            <Link to="/reports">Reports</Link>
            {user.role === 'admin' && <Link to="/settings">Safety Settings</Link>}
            <button className="secondary" onClick={handleLogout}>Sign out</button>
          </nav>
        )}
      </header>
      <main style={{ padding: '1.5rem 2rem' }}>
        {user && (
          <div className="warning-banner">
            🚨 This platform is for defensive security awareness only. Never send real credential harvesters. Mailer sends require explicit HR/legal approval and the MAILER_ENABLED flag.
          </div>
        )}
        <Routes>
          <Route path="/login" element={<Login onAuth={setUser} />} />
          <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/campaigns/new" element={user ? <CampaignForm user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/approvals" element={user ? <Approvals user={user} /> : <Navigate to="/login" replace />} />
          <Route path="/allowlist" element={user ? <Allowlist /> : <Navigate to="/login" replace />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={user?.role === 'admin' ? <Settings /> : <Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
