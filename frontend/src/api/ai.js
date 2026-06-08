import api from './axios'

export const aiAPI = {
  predictWinProbability: (bidId) => api.get(`/ai/predict/${bidId}`),
  generateSummary: (bidId) => api.post(`/ai/summary/${bidId}`),
  analyzeSentiment: (text) => api.post('/ai/sentiment', { text }),
  detectDuplicates: (bidData) => api.post('/ai/duplicates', bidData),
  getRecommendations: (bidId) => api.get(`/ai/recommendations/${bidId}`),
  assignPriority: (bidId) => api.post(`/ai/priority/${bidId}`),
  chatAssistant: (message) => api.post('/ai/chat', { message }),
  summarizeText: (text) => api.post('/ai/summary-text', { text }),
}
