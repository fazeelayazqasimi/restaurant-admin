import axios from 'axios'

const API_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5000/api'                          // Local
  : 'https://restaurant-server-phi-two.vercel.app/api'  // Live

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export default api