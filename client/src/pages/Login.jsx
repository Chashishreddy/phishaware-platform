import React, { useState } from 'react'
import { login } from '../api/auth.js'

const Login = ({ onAuth }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const user = await login(email, password)
      onAuth(user)
    } catch (err) {
      setError('Login failed. Confirm authorization and credentials.')
    }
  }

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '2rem auto' }}>
      <h2>Authorized Staff Login</h2>
      <p>This system is for sanctioned awareness campaigns only. Proceeding confirms HR/legal approval.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        <button className="primary" type="submit">Sign In</button>
      </form>
    </div>
  )
}

export default Login
