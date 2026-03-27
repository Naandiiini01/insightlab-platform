import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  // Django routes are defined with trailing slashes.
  // Normalize client URLs so POST/PUT/PATCH don't fail with APPEND_SLASH.
  if (typeof config.url === 'string' && config.url.length > 0) {
    const [path, query = ''] = config.url.split('?')
    if (!path.endsWith('/')) {
      config.url = `${path}/${query ? `?${query}` : ''}`
    }
  }

  try {
    const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
    const token = auth?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
