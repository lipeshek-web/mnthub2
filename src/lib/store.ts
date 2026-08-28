'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from './types'

export type AppView =
  | { name: 'home' }
  | { name: 'marketplace' }
  | { name: 'mentor'; mentorId: string }
  | { name: 'dashboard' }
  | { name: 'meeting'; bookingId: string }
  | { name: 'onboarding' }
  | { name: 'for-mentors' }

interface AppState {
  user: UserDTO | null
  view: AppView
  /** Termo de busca vindo de outra tela (ex.: hero da home) para pré-preencher o Explorar */
  exploreQuery: string
  setUser: (user: UserDTO | null) => void
  navigate: (view: AppView) => void
  setExploreQuery: (q: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      view: { name: 'home' },
      exploreQuery: '',
      setUser: (user) => set({ user }),
      navigate: (view) => set({ view }),
      setExploreQuery: (exploreQuery) => set({ exploreQuery }),
    }),
    {
      name: 'mentorhub-session',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
