// In dev, Vite proxy handles /api → localhost:8069
// In prod, same origin serves both frontend and API
const API_BASE = '/api/v1'

const api = {
  token: null,

  async request(endpoint, options = {}) {
    const headers = { ...options.headers }
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(options.body)
    }

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })

    if (res.status === 401 || res.status === 403) {
      this.token = null
      localStorage.removeItem('vn_token')
      window.dispatchEvent(new Event('vn_logout'))
      throw new Error('Session expired')
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(err.detail || JSON.stringify(err))
    }

    if (res.status === 204) return null
    return res.json()
  },

  get: (e) => api.request(e),
  post: (e, b) => api.request(e, { method: 'POST', body: b }),
  put: (e, b) => api.request(e, { method: 'PUT', body: b }),
  del: (e) => api.request(e, { method: 'DELETE' }),
  patch: (e) => api.request(e, { method: 'PATCH' }),
  upload: (e, fd) => api.request(e, { method: 'POST', body: fd }),
}

export default api
