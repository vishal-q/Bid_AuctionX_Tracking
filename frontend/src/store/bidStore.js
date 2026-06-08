import { create } from 'zustand'

export const useBidStore = create((set, get) => ({
  bids: [],
  selectedBid: null,
  filters: { status: 'all', priority: 'all', search: '', minValue: '', maxValue: '', due: 'all' },

  setBids: (bids) => set({ bids }),
  setSelectedBid: (bid) => set({ selectedBid: bid }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  getFilteredBids: () => {
    const { bids, filters } = get()
    return bids.filter((b) => {
      const matchStatus = filters.status === 'all' || b.status === filters.status
      const matchPriority = filters.priority === 'all' || b.priority === filters.priority
      const matchSearch = !filters.search || b.title.toLowerCase().includes(filters.search.toLowerCase()) || b.clientName.toLowerCase().includes(filters.search.toLowerCase()) || b.bidNumber?.toLowerCase().includes(filters.search.toLowerCase())
      const value = Number(b.value || 0)
      const matchMin = !filters.minValue || value >= Number(filters.minValue)
      const matchMax = !filters.maxValue || value <= Number(filters.maxValue)
      const deadline = b.deadline ? new Date(b.deadline) : null
      const now = new Date()
      const inSevenDays = new Date(now.getTime() + 7 * 86400000)
      const inThirtyDays = new Date(now.getTime() + 30 * 86400000)
      const matchDue = filters.due === 'all'
        || (filters.due === 'overdue' && deadline && deadline < now)
        || (filters.due === '7' && deadline && deadline >= now && deadline <= inSevenDays)
        || (filters.due === '30' && deadline && deadline >= now && deadline <= inThirtyDays)
      return matchStatus && matchPriority && matchSearch && matchMin && matchMax && matchDue
    })
  },

  addBid: (bid) => set((state) => ({ bids: [bid, ...state.bids] })),
  updateBid: (id, updates) => set((state) => ({
    bids: state.bids.map((b) => b._id === id ? { ...b, ...updates } : b)
  })),
  removeBid: (id) => set((state) => ({ bids: state.bids.filter((b) => b._id !== id) })),
}))
