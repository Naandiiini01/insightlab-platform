import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        set({ token: res.data.token, user: res.data.user })
        return res.data
      },

      register: async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password })
        set({ token: res.data.token, user: res.data.user })
        return res.data
      },

      logout: () => {
        set({ token: null, user: null })
      },

      updateUser: (user) => set({ user }),
    }),
    { name: 'auth-storage', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
