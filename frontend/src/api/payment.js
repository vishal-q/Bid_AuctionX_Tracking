import api from './axios'

export const paymentAPI = {
  getPlans: () => api.get('/payments/plans'),
  getMySubscription: () => api.get('/payments/my-subscription'),
  getPaymentHistory: () => api.get('/payments/history'),
  subscribe: (data) => api.post('/payments/subscribe', data),
  cancelSubscription: (data) => api.post('/payments/cancel', data),
  getAllPayments: () => api.get('/payments/all'),
}
