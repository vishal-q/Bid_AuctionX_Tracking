import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      // Clear all auth state so role-based redirects don't use stale persisted user
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      // Helper used by Login to ensure role matches the selected account
      setAuthForRole: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    { name: 'bid-auth' }
  )
)
