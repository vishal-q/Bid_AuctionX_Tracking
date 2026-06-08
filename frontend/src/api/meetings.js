import axios from './axios'

export const meetingsAPI = {
  scheduleMeeting: (data) => axios.post('/meetings', data),
  getMeeting: (id) => axios.get(`/meetings/${id}`),
  getUserMeetings: () => axios.get('/meetings'),
  getMeetingsByBid: (bidId) => axios.get(`/meetings/bid/${bidId}`),
  updateMeeting: (id, data) => axios.put(`/meetings/${id}`, data),
  cancelMeeting: (id) => axios.post(`/meetings/${id}/cancel`),
  completeMeeting: (id) => axios.post(`/meetings/${id}/complete`),
}
