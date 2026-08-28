'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from './types'

export type AppView =
  | { name: 'home' }
  | { name: 'marketplace' }
  | { name: 'mentor'; mentorId: string }
  | { name: 'course'; courseId: string }
  | { name: 'dashboard' }
  | { name: 'meeting'; bookingId: string }
  | { name: 'onboarding' }
  | { name: 'for-mentors' }
  | { name: 'mentor-lp'; slug: string } // LP pública rastreável (tráfego pago)
  | { name: 'checkout'; courseId: string } // checkout de curso pago

/** Aba ativa do Explorar: mentores ou cursos */
export type ExploreTab = 'mentors' | 'courses'

interface AppState {
  user: UserDTO | null
  view: AppView
  /** Termo de busca vindo de outra tela (ex.: hero da home) para pré-preencher o Explorar */
  exploreQuery: string
  /** Aba que o Explorar deve abrir (mentores/cursos); consumida uma única vez */
  exploreTab: ExploreTab
  setUser: (user: UserDTO | null) => void
  navigate: (view: AppView) => void
  setExploreQuery: (q: string) => void
  setExploreTab: (tab: ExploreTab) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      view: { name: 'home' },
      exploreQuery: '',
      exploreTab: 'mentors',
      setUser: (user) => set({ user }),
      navigate: (view) => set({ view }),
      setExploreQuery: (exploreQuery) => set({ exploreQuery }),
      setExploreTab: (exploreTab) => set({ exploreTab }),
    }),
    {
      name: 'mentorhub-session',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
