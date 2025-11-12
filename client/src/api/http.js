import axios from 'axios'

const http = axios.create({
  withCredentials: true
})

http.interceptors.response.use((resp) => resp, (error) => {
  if (error.response?.status === 401) {
    console.warn('Authentication required. Redirecting to login.')
  }
  return Promise.reject(error)
})

export default http
