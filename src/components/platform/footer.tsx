'use client'

import {
  BookOpen,
  CalendarDays,
  Compass,
  GraduationCap,
  LayoutDashboard,
  Library,
  PlusCircle,
  Route,
  Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function PlatformFooter() {
  const { navigate, user } = useAppStore()
  const year = new Date().getFullYear()

  const goToExploreTab = (tab: 'all' | 'mentors' | 'courses' | 'tracks' | 'library') => {
    useAppStore.getState().setExploreTab(tab)
    navigate({ name: 'marketplace' })
  }

  const platformLinks = [
    { label: 'Explorar tudo', icon: <Compass className="h-3.5 w-3.5" />, onClick: () => goToExploreTab('all') },
    { label: 'Mentores', icon: <Sparkles className="h-3.5 w-3.5" />, onClick: () => goToExploreTab('mentors') },
    { label: 'Cursos', icon: <BookOpen className="h-3.5 w-3.5" />, onClick: () => goToExploreTab('courses') },
    { label: 'Trilhas', icon: <Route className="h-3.5 w-3.5" />, onClick: () => goToExploreTab('tracks') },
    { label: 'Biblioteca', icon: <Library className="h-3.5 w-3.5" />, onClick: () => goToExploreTab('library') },
  ]

  const accountLinks = [
    { label: 'Minhas sessões', icon: <CalendarDays className="h-3.5 w-3.5" />, onClick: () => navigate({ name: 'dashboard' }) },
    { label: 'Para mentores', icon: <Sparkles className="h-3.5 w-3.5" />, onClick: () => navigate({ name: 'for-mentors' }) },
    user
      ? {
          label: user.isMentor ? 'Painel do mentor' : 'Criar perfil de mentor',
          icon: user.isMentor ? <LayoutDashboard className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />,
          onClick: () => navigate({ name: 'onboarding' }),
        }
      : {
          label: 'Entrar / Criar conta',
          icon: <GraduationCap className="h-3.5 w-3.5" />,
          onClick: () => navigate({ name: 'auth', mode: 'login' }),
        },
  ]

  return (
    <footer className="mt-auto shrink-0 border-t border-stone-200/70 bg-stone-50 pb-[env(safe-area-inset-bottom)] dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca */}
          <div className="flex flex-col items-start gap-3">
            <button
              className="flex items-center gap-2.5"
              onClick={() => navigate({ name: 'home' })}
              aria-label="Ir para a página inicial"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                Mentor<span className="text-emerald-700">Hub</span>
              </span>
            </button>
            <p className="max-w-xs text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Aprenda com quem vive o que ensina — mentorias 1:1, cursos, trilhas guiadas e uma
              biblioteca de artigos e livros em um só lugar.
            </p>
          </div>

          {/* Plataforma */}
          <nav aria-label="Explorar no rodapé">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
              Plataforma
            </p>
            <ul className="mt-3 space-y-1">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.onClick}
                    className="inline-flex items-center gap-2 rounded-md py-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-300"
                  >
                    <span className="text-stone-400 dark:text-stone-500">{link.icon}</span>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Conta */}
          <nav aria-label="Sua conta no rodapé">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
              {user ? 'Sua conta' : 'Comece agora'}
            </p>
            <ul className="mt-3 space-y-1">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.onClick}
                    className="inline-flex items-center gap-2 rounded-md py-1.5 text-sm font-medium text-stone-600 transition-colors hover:text-emerald-700 dark:text-stone-300 dark:hover:text-emerald-300"
                  >
                    <span className="text-stone-400 dark:text-stone-500">{link.icon}</span>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-stone-200 pt-5 sm:flex-row sm:items-center dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500">© {year} MentorHub · Todos os direitos reservados</p>
          <p className="text-xs text-stone-400 dark:text-stone-500">Feito com dedicação para quem ensina e aprende 💚</p>
        </div>
      </div>
    </footer>
  )
}
