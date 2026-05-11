const API_BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const token = localStorage.getItem('stylesense_token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  // Auth
  googleLogin: (token) => request('/api/auth/google', { method: 'POST', body: JSON.stringify({ token }) }),
  getMe: () => request('/api/auth/me'),

  // Profile
  saveBodyProfile: (data) => request('/api/profile/body', { method: 'POST', body: JSON.stringify(data) }),
  getBodyProfile: () => request('/api/profile/body'),
  deleteBodyProfile: (id) => request(`/api/profile/body/${id}`, { method: 'DELETE' }),

  // Recommendations
  getRecommendations: (params) => request('/api/recommendations', { method: 'POST', body: JSON.stringify(params) }),
  listRecommendations: () => request('/api/recommendations'),
  getFashionRules: () => request('/api/recommendations/rules'),

  // Products
  searchProducts: (q, category) => request(`/api/products/search?q=${q}&category=${category}`),
  trackClick: (productId, recId) => request('/api/products/click', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, recommendation_id: recId }),
  }),
}
