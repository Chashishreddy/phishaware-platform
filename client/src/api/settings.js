import http from './http.js'
import { getCsrfToken } from './auth.js'

export const fetchSettings = async () => {
  const { data } = await http.get('/api/settings')
  return data
}

export const requestMailerEnable = async () => {
  const token = await getCsrfToken()
  const { data } = await http.post('/api/settings/request-mailer-enable', {}, { headers: { 'x-csrf-token': token } })
  return data
}
