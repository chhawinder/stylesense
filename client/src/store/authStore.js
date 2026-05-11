import { create } from 'zustand'
import { api } from '../utils/api'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('stylesense_user') || 'null'),
  token: localStorage.getItem('stylesense_token') || null,
  loading: false,

  loginWithGoogle: async (credential) => {
    set({ loading: true })
    try {
      const data = await api.googleLogin(credential)
      localStorage.setItem('stylesense_token', data.access_token)
      localStorage.setItem('stylesense_user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return data.user
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('stylesense_token')
    localStorage.removeItem('stylesense_user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
