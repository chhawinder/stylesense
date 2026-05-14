import { create } from 'zustand'
import { api } from '../utils/api'

const CACHE_KEY = 'stylesense_profile'

// Rehydrate from localStorage on load
function getCachedProfile() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

const useProfileStore = create((set, get) => ({
  bodyProfile: getCachedProfile(),
  scanResult: null,
  loading: false,
  error: null,

  setScanResult: (result) => set({ scanResult: result }),

  saveProfile: async (scanData) => {
    set({ loading: true, error: null })
    try {
      const profile = await api.saveBodyProfile(scanData)
      localStorage.setItem(CACHE_KEY, JSON.stringify(profile))
      set({ bodyProfile: profile, scanResult: null, loading: false })
      return profile
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  loadProfile: async () => {
    // Return cached profile immediately if available
    const cached = get().bodyProfile
    if (cached) return cached

    set({ loading: true, error: null })
    try {
      const profile = await api.getBodyProfile()
      localStorage.setItem(CACHE_KEY, JSON.stringify(profile))
      set({ bodyProfile: profile, loading: false })
      return profile
    } catch {
      set({ loading: false, error: null })
      return null
    }
  },

  deleteProfile: async (id) => {
    await api.deleteBodyProfile(id)
    localStorage.removeItem(CACHE_KEY)
    set({ bodyProfile: null })
  },
}))

export default useProfileStore
