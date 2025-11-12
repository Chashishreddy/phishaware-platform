import http from './http.js'

export const getCsrfToken = async () => {
  const { data } = await http.get('/api/csrf')
  return data.token
}

export const login = async (email, password) => {
  const token = await getCsrfToken()
  const { data } = await http.post('/api/auth/login', { email, password }, { headers: { 'x-csrf-token': token } })
  return data.user
}

export const logout = async () => {
  const token = await getCsrfToken()
  await http.post('/api/auth/logout', {}, { headers: { 'x-csrf-token': token } })
}

export const getSession = async () => {
  try {
    const { data } = await http.get('/api/auth/me')
    return data.user
  } catch (err) {
    return null
  }
}
