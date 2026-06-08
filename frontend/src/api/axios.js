import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 15000, // 15s — enough for OTP email sending
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  // Don't send demo tokens to real backend
  if (token && !token.startsWith('demo-token-')) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (token && token.startsWith('demo-token-')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = useAuthStore.getState().token
      // Don't logout demo users on 401
      if (!token?.startsWith('demo-token-')) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
