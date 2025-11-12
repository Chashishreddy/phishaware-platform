import http from './http.js'
import { getCsrfToken } from './auth.js'

export const fetchCampaigns = async () => {
  const { data } = await http.get('/api/campaigns')
  return data
}

export const createCampaign = async (payload) => {
  const token = await getCsrfToken()
  const { data } = await http.post('/api/campaigns', payload, { headers: { 'x-csrf-token': token } })
  return data
}

export const approveCampaign = async (id) => {
  const token = await getCsrfToken()
  return http.post(`/api/campaigns/${id}/approve`, { approved: true }, { headers: { 'x-csrf-token': token } })
}

export const rejectCampaign = async (id, comment) => {
  const token = await getCsrfToken()
  return http.post(`/api/campaigns/${id}/reject`, { comment }, { headers: { 'x-csrf-token': token } })
}

export const fetchReport = async (id) => {
  const { data } = await http.get(`/api/analytics/campaign/${id}`)
  return data
}
