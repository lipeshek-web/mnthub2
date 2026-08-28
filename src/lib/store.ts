'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from './types'

export type AppView =
  | { name: 'home' }
  | { name: 'marketplace' }
  | { name: 'mentor'; mentorId: string }
  | { name: 'course'; courseId: string }
  | { name: 'classroom'; courseId: string } // sala de aula profissional (tela cheia, só header)
  | { name: 'track'; trackId: string } // detalhe da trilha
  | { name: 'dashboard' }
  | { name: 'meeting'; bookingId: string }
  | { name: 'onboarding' }
  | { name: 'for-mentors' }
  | { name: 'mentor-lp'; slug: string } // LP pública rastreável (tráfego pago)
  | { name: 'checkout'; courseId?: string; trackId?: string } // checkout de curso ou trilha pago

/** Aba ativa do Explorar: mentores, cursos ou trilhas */
export type ExploreTab = 'mentors' | 'courses' | 'tracks'

interface AppState {
  user: UserDTO | null
  view: AppView
  /** Termo de busca vindo de outra tela (ex.: hero da home) para pré-preencher o Explorar */
  exploreQuery: string
  /** Aba que o Explorar deve abrir (mentores/cursos/trilhas); consumida uma única vez */
  exploreTab: ExploreTab
  /** Tópico pré-preenchido para agendar mentoria inclusa em curso/trilha (consumido uma vez) */
  bookingTopic: string
  setUser: (user: UserDTO | null) => void
  navigate: (view: AppView) => void
  setExploreQuery: (q: string) => void
  setExploreTab: (tab: ExploreTab) => void
  setBookingTopic: (topic: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      view: { name: 'home' },
      exploreQuery: '',
      exploreTab: 'mentors',
      bookingTopic: '',
      setUser: (user) => set({ user }),
      navigate: (view) => set({ view }),
      setExploreQuery: (exploreQuery) => set({ exploreQuery }),
      setExploreTab: (exploreTab) => set({ exploreTab }),
      setBookingTopic: (bookingTopic) => set({ bookingTopic }),
    }),
    {
      name: 'mentorhub-session',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
