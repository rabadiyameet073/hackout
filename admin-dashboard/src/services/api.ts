import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/admin-login', credentials),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () =>
    api.get('/admin/dashboard/stats'),
  
  getRecentActivity: () =>
    api.get('/admin/dashboard/recent-activity'),
  
  getSystemHealth: () =>
    api.get('/admin/dashboard/system-health'),
}

// Incidents API
export const incidentsAPI = {
  getIncidents: (params?: any) =>
    api.get('/admin/incidents', { params }),
  
  getIncident: (id: string) =>
    api.get(`/admin/incidents/${id}`),
  
  updateIncident: (id: string, data: any) =>
    api.put(`/admin/incidents/${id}`, data),
  
  deleteIncident: (id: string) =>
    api.delete(`/admin/incidents/${id}`),
  
  bulkUpdate: (data: any) =>
    api.post('/admin/incidents/bulk-update', data),
  
  exportIncidents: (params?: any) =>
    api.get('/admin/incidents/export', { params, responseType: 'blob' }),
}

// Users API
export const usersAPI = {
  getUsers: (params?: any) =>
    api.get('/admin/users', { params }),
  
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),
  
  updateUser: (id: string, data: any) =>
    api.put(`/admin/users/${id}`, data),
  
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
  
  suspendUser: (id: string, reason: string) =>
    api.post(`/admin/users/${id}/suspend`, { reason }),
  
  unsuspendUser: (id: string) =>
    api.post(`/admin/users/${id}/unsuspend`),
  
  getUserActivity: (id: string) =>
    api.get(`/admin/users/${id}/activity`),
}

// Validations API
export const validationsAPI = {
  getValidations: (params?: any) =>
    api.get('/admin/validations', { params }),
  
  getValidation: (id: string) =>
    api.get(`/admin/validations/${id}`),
  
  approveValidation: (id: string) =>
    api.post(`/admin/validations/${id}/approve`),
  
  rejectValidation: (id: string, reason: string) =>
    api.post(`/admin/validations/${id}/reject`, { reason }),
  
  getAIValidationStats: () =>
    api.get('/ai-validation/stats'),
  
  revalidateIncident: (incidentId: string) =>
    api.post(`/admin/validations/revalidate/${incidentId}`),
}

// Analytics API
export const analyticsAPI = {
  getOverviewStats: (timeRange: string) =>
    api.get(`/admin/analytics/overview?timeRange=${timeRange}`),
  
  getIncidentTrends: (timeRange: string) =>
    api.get(`/admin/analytics/incident-trends?timeRange=${timeRange}`),
  
  getUserEngagement: (timeRange: string) =>
    api.get(`/admin/analytics/user-engagement?timeRange=${timeRange}`),
  
  getGeographicData: () =>
    api.get('/admin/analytics/geographic'),
  
  getPerformanceMetrics: () =>
    api.get('/admin/analytics/performance'),
  
  exportReport: (type: string, params?: any) =>
    api.get(`/admin/analytics/export/${type}`, { params, responseType: 'blob' }),
}

// Settings API
export const settingsAPI = {
  getSettings: () =>
    api.get('/admin/settings'),
  
  updateSettings: (data: any) =>
    api.put('/admin/settings', data),
  
  getSystemLogs: (params?: any) =>
    api.get('/admin/settings/logs', { params }),
  
  backupDatabase: () =>
    api.post('/admin/settings/backup'),
  
  getBackups: () =>
    api.get('/admin/settings/backups'),
  
  restoreBackup: (backupId: string) =>
    api.post(`/admin/settings/restore/${backupId}`),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: () =>
    api.get('/admin/notifications'),
  
  markAsRead: (id: string) =>
    api.put(`/admin/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.put('/admin/notifications/read-all'),
  
  sendBroadcast: (data: any) =>
    api.post('/admin/notifications/broadcast', data),
}

export default api
