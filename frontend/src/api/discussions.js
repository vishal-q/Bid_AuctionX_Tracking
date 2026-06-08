import api from './axios'

export const discussionsAPI = {
  // Create or get discussion room for a bid
  createOrGetRoom: (bidId) => api.post('/discussions', { bidId }),

  // Get room for a specific bid
  getRoom: (bidId) => api.get(`/discussions/${bidId}`),

  // Get all messages in a discussion
  getMessages: (roomId) => api.get(`/discussions/messages/${roomId}`),

  // Send a message to discussion
  sendMessage: (roomId, text) => api.post(`/discussions/${roomId}/messages`, { text }),
}
