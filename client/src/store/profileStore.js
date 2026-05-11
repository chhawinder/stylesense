import { create } from 'zustand'
import { api } from '../utils/api'

const useProfileStore = create((set) => ({
  bodyProfile: null,
  scanResult: null, // temporary scan data before saving
  loading: false,
  error: null,

  // Set scan result from client-side MediaPipe analysis
  setScanResult: (result) => set({ scanResult: result }),

  // Save scan result to backend
  saveProfile: async (scanData) => {
    set({ loading: true, error: null })
    try {
      const profile = await api.saveBodyProfile(scanData)
      set({ bodyProfile: profile, scanResult: null, loading: false })
      return profile
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  // Load existing profile from backend
  loadProfile: async () => {
    set({ loading: true, error: null })
    try {
      const profile = await api.getBodyProfile()
      set({ bodyProfile: profile, loading: false })
      return profile
    } catch (err) {
      set({ loading: false, error: null }) // 404 is expected for new users
      return null
    }
  },

  deleteProfile: async (id) => {
    await api.deleteBodyProfile(id)
    set({ bodyProfile: null })
  },
}))

export default useProfileStore
