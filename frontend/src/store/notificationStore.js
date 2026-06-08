import { create } from 'zustand'
import { notificationsAPI } from '../api/notifications'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const res = await notificationsAPI.getAll()
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      const unread = list.filter((n) => !n.read).length
      set({ notifications: list, unreadCount: unread })
    } catch {
      set({ notifications: [], unreadCount: 0 })
    }
  },

  markRead: (id) => set((state) => {
    const notifications = state.notifications.map((n) => n._id === id ? { ...n, read: true } : n)
    return { notifications, unreadCount: notifications.filter((n) => !n.read).length }
  }),

  markAllRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  remove: (id) => set((state) => {
    const notifications = state.notifications.filter((n) => n._id !== id)
    return { notifications, unreadCount: notifications.filter((n) => !n.read).length }
  }),

  addNotification: (notif) => set((state) => ({
    notifications: [notif, ...state.notifications],
    unreadCount: state.unreadCount + (notif.read ? 0 : 1),
  })),
}))
