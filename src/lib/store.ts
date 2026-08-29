'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserDTO } from './types'

export type AppView =
  | { name: 'home' }
  | { name: 'auth'; mode?: 'login' | 'register' } // login / criar conta
  | { name: 'marketplace' }
  | { name: 'mentor'; mentorId: string }
  | { name: 'course'; courseId: string }
  | { name: 'classroom'; courseId: string; lessonId?: string } // sala de aula profissional (overlay tela cheia); lessonId = aula a abrir (retorno do leitor)
  | { name: 'track'; trackId: string } // detalhe da trilha
  | { name: 'reader'; itemId: string; returnTo?: { courseId: string; lessonId: string } } // leitor de artigo/livro (overlay tela cheia); returnTo = aula de origem
  | { name: 'dashboard' }
  | { name: 'meeting'; bookingId: string }
  | { name: 'onboarding' }
  | { name: 'for-mentors' }
  | { name: 'mentor-lp'; slug: string } // LP pública rastreável (tráfego pago)
  | { name: 'checkout'; courseId?: string; trackId?: string } // checkout de curso ou trilha pago
  | { name: 'certificate'; code: string } // certificado público verificável (?cert=CODE)

/** Aba ativa do Explorar: visão geral (tudo), mentores, cursos, trilhas ou biblioteca */
export type ExploreTab = 'all' | 'mentors' | 'courses' | 'tracks' | 'library'

interface AppState {
  user: UserDTO | null
  view: AppView
  /** Termo de busca vindo de outra tela (ex.: header, hero da home) para o Explorar */
  exploreQuery: string
  /** Incrementado a cada busca submetida (header/hero) — faz o Explorar re-consumir o termo */
  exploreSeq: number
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
    (set, get) => ({
      user: null,
      view: { name: 'home' },
      exploreQuery: '',
      exploreSeq: 0,
      exploreTab: 'all',
      bookingTopic: '',
      setUser: (user) => set({ user }),
      navigate: (view) => set({ view }),
      setExploreQuery: (exploreQuery) =>
        set({ exploreQuery, exploreSeq: get().exploreSeq + 1 }),
      setExploreTab: (exploreTab) => set({ exploreTab }),
      setBookingTopic: (bookingTopic) => set({ bookingTopic }),
    }),
    {
      name: 'mentorhub-session',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
