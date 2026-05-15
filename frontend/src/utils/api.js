// src/utils/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('dtc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dtc_token')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || err)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

export const busAPI = {
  getAll: (params) => api.get('/buses', { params }),
  getStats: () => api.get('/buses/stats'),
  getLiveLocations: () => api.get('/buses/live/locations'),
  updateStatus: (id, status) => api.patch(`/buses/${id}/status`, { status }),
}

export const scheduleAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getStats: () => api.get('/schedules/stats'),
  generate: (date) => api.post('/schedules/generate', { date }),
  update: (id, data) => api.patch(`/schedules/${id}`, data),
}

export const routeAPI = {
  getAll: () => api.get('/routes'),
  search: (from, to) => api.get('/routes/search', { params: { from, to } }),
  getById: (id) => api.get(`/routes/${id}`),
}

export const incidentAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getStats: () => api.get('/incidents/stats'),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.patch(`/incidents/${id}`, data),
}

export const depotAPI = {
  getAll: () => api.get('/depots'),
}

export const driverAPI = {
  getAll: (params) => api.get('/drivers', { params }),
  getStats: () => api.get('/drivers/stats'),
}

export const trackingAPI = {
  getByRoute: (routeId) => api.get(`/tracking/route/${routeId}`),
  getByBus: (busId) => api.get(`/tracking/bus/${busId}`),
}

export default api
