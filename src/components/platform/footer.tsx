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
import { BrandMark } from '@/components/platform/brand'

export function PlatformFooter() {
  // Seletores atômicos: footer re-renderiza só quando user ou navigate mudarem
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
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
    { label: 'Minhas mentorias', icon: <CalendarDays className="h-3.5 w-3.5" />, onClick: () => navigate({ name: 'dashboard' }) },
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
    <footer className="mt-auto shrink-0 border-t border-slate-200/70 bg-slate-50 pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca */}
          <div className="flex flex-col items-start gap-3">
            <button
              className="group flex items-center gap-2.5"
              onClick={() => navigate({ name: 'home' })}
              aria-label="Órbita — ir para a página inicial"
            >
              <BrandMark className="h-9 w-9 transition-transform duration-200 group-hover:scale-[1.04]" />
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Órbita
              </span>
            </button>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Seu universo de aprendizado — mentorias 1:1, cursos, trilhas guiadas e uma
              biblioteca de artigos e livros em um só lugar.
            </p>
          </div>

          {/* Plataforma */}
          <nav aria-label="Explorar no rodapé">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Plataforma
            </p>
            <ul className="mt-3 space-y-1">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.onClick}
                    className="inline-flex items-center gap-2 rounded-md py-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
                  >
                    <span className="text-slate-400 dark:text-slate-500">{link.icon}</span>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Conta */}
          <nav aria-label="Sua conta no rodapé">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {user ? 'Sua conta' : 'Comece agora'}
            </p>
            <ul className="mt-3 space-y-1">
              {accountLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={link.onClick}
                    className="inline-flex items-center gap-2 rounded-md py-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300"
                  >
                    <span className="text-slate-400 dark:text-slate-500">{link.icon}</span>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">© {year} Órbita · Todos os direitos reservados</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Feito com dedicação para quem ensina e aprende 💙</p>
        </div>
      </div>
    </footer>
  )
}
