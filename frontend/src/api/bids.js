import api from './axios'

export const bidsAPI = {
  getAll: (params) => api.get('/bids', { params }),
  getById: (id) => api.get(`/bids/${id}`),
  create: (data) => api.post('/bids', data),
  update: (id, data) => api.put(`/bids/${id}`, data),
  delete: (id) => api.delete(`/bids/${id}`),
  updateStatus: (id, status) => api.patch(`/bids/${id}/status`, { status }),
  bulkUpdateStatus: (ids, status) => api.post('/bids/bulk/status', { ids, status }),
  assignEmployee: (id, employeeId) => api.patch(`/bids/${id}/assign`, { employeeId }),
  getHistory: (id) => api.get(`/bids/${id}/history`),
  uploadDocument: (id, data) => api.post(`/bids/${id}/documents`, data),
  addComment: (id, comment) => api.post(`/bids/${id}/comments`, { comment }),
  getComments: (id) => api.get(`/bids/${id}/comments`),
  getAnalytics: () => api.get('/bids/analytics'),
  getMyBids: () => api.get('/bids/my-bids'),
  // Workflow
  verifyBid: (id, data) => api.patch(`/bids/${id}/verify`, data),
  getTracking: (id) => api.get(`/bids/${id}/tracking`),
  submitCompletion: (id, data) => api.patch(`/bids/${id}/submit-completion`, data),
  finalApproval: (id, data) => api.patch(`/bids/${id}/final-approval`, data),
  getEmployees: () => api.get('/bids/employees/list'),
  updateProgress: (id, progress) => api.patch(`/bids/${id}/progress`, { progress }),
  submitFeedback: (id, data) => api.post(`/bids/${id}/feedback`, data),
}
