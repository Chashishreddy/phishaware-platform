import http from './http.js'
import { getCsrfToken } from './auth.js'

export const fetchAllowlist = async () => {
  const { data } = await http.get('/api/allowlist')
  return data.entries
}

export const importAllowlist = async (file) => {
  const token = await getCsrfToken()
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await http.post('/api/allowlist/import', formData, {
    headers: { 'x-csrf-token': token }
  })
  return data
}
