import api from './axios'

export const locationAPI = {
  updateLocation: (data) => api.patch('/location/update', data),
  getAllLocations: () => api.get('/location/all'),
  getMyLocation: () => api.get('/location/me'),
  toggleSharing: (locationSharing) => api.patch('/location/toggle-sharing', { locationSharing }),
  getBidContextLocations: () => api.get('/location/bid-context'),
}
