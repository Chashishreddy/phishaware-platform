import React, { useEffect, useState } from 'react'
import { fetchCampaigns, fetchReport } from '../api/campaigns.js'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const Reports = () => {
  const [campaigns, setCampaigns] = useState([])
  const [selected, setSelected] = useState(null)
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    fetchCampaigns().then(data => setCampaigns(data.campaigns))
  }, [])

  useEffect(() => {
    if (selected) {
      fetchReport(selected).then(data => setMetrics(data.counts))
    }
  }, [selected])

  const chartData = {
    labels: Object.keys(metrics),
    datasets: [
      {
        label: 'Events',
        data: Object.values(metrics),
        backgroundColor: '#1b5e20'
      }
    ]
  }

  return (
    <div className="card">
      <h2>Campaign Reporting</h2>
      <p>Review results and schedule prompt debrief communications. Participants should never be left uncertain about the simulation.</p>
      <select value={selected || ''} onChange={e => setSelected(e.target.value)}>
        <option value="" disabled>Select a campaign</option>
        {campaigns.map(c => (
          <option key={c.id} value={c.id}>{c.name} ({c.approval_status})</option>
        ))}
      </select>
      {selected && (
        <div style={{ maxWidth: '480px' }}>
          <Bar data={chartData} />
        </div>
      )}
    </div>
  )
}

export default Reports
