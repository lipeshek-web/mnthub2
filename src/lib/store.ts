'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from './types'

export type AppView =
  | { name: 'marketplace' }
  | { name: 'mentor'; mentorId: string }
  | { name: 'dashboard' }
  | { name: 'meeting'; bookingId: string }
  | { name: 'onboarding' }

interface AppState {
  user: UserDTO | null
  view: AppView
  setUser: (user: UserDTO | null) => void
  navigate: (view: AppView) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      view: { name: 'marketplace' },
      setUser: (user) => set({ user }),
      navigate: (view) => set({ view }),
    }),
    {
      name: 'mentorhub-session',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
