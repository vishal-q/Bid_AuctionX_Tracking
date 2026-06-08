import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark',
      initTheme: () => applyTheme(get().theme),
      toggleTheme: () => set((state) => {
        const theme = state.theme === 'dark' ? 'light' : 'dark'
        applyTheme(theme)
        return { theme }
      }),
    }),
    {
      name: 'bid-theme',
      onRehydrateStorage: () => (state) => state?.initTheme(),
    }
  )
)
