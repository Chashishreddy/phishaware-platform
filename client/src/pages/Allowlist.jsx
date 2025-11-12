import React, { useEffect, useState } from 'react'
import { fetchAllowlist, importAllowlist } from '../api/allowlist.js'

const Allowlist = () => {
  const [entries, setEntries] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = () => fetchAllowlist().then(setEntries)

  useEffect(() => {
    load()
  }, [])

  const handleImport = async (e) => {
    e.preventDefault()
    const file = e.target.elements.file.files[0]
    if (!file) {
      setError('Select a CSV file to import.')
      return
    }
    try {
      const result = await importAllowlist(file)
      setMessage(`Imported ${result.imported} records. Double-check duplicates.`)
      setError('')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed')
    }
  }

  return (
    <div className="card">
      <h2>Allowlist Management</h2>
      <p>Only employees who have agreed to awareness exercises should be included. Never upload external contacts or contractors without written consent.</p>
      {message && <p style={{ color: '#1b5e20' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleImport}>
        <input name="file" type="file" accept=".csv" />
        <button className="primary" type="submit">Upload CSV</button>
      </form>
      <table className="table" style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Dept</th>
            <th>Manager</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id}>
              <td>{entry.email}</td>
              <td>{entry.dept}</td>
              <td>{entry.manager}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Allowlist
