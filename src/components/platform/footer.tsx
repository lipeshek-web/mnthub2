'use client'

import { CalendarDays, Compass, GraduationCap, Library, Sparkles } from 'lucide-react'
import { useAppStore, type AppView } from '@/lib/store'
import { cn } from '@/lib/utils'

const FOOTER_LINKS: { view: AppView; label: string }[] = [
  { view: { name: 'home' }, label: 'Para alunos' },
  { view: { name: 'marketplace' }, label: 'Explorar mentores' },
  { view: { name: 'for-mentors' }, label: 'Para mentores' },
  { view: { name: 'dashboard' }, label: 'Minhas sessões' },
]

const TABS: { view: AppView; label: string; icon: React.ReactNode }[] = [
  { view: { name: 'marketplace' }, label: 'Explorar', icon: <Compass className="h-5 w-5" /> },
  { view: { name: 'dashboard' }, label: 'Sessões', icon: <CalendarDays className="h-5 w-5" /> },
  { view: { name: 'for-mentors' }, label: 'Ser mentor', icon: <Sparkles className="h-5 w-5" /> },
]

export function PlatformFooter() {
  const { navigate, view } = useAppStore()
  const year = new Date().getFullYear()

  return (
    <footer className="shrink-0">
      {/* Desktop: barra fina minimalista, sempre visível */}
      <div className="hidden border-t border-stone-200/70 bg-white sm:block">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white">
              <GraduationCap className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold text-stone-900">MentorHub</span>
            <span className="hidden truncate text-xs text-stone-400 lg:inline">
              · Aprenda com quem vive o que ensina
            </span>
          </div>

          <nav
            aria-label="Links do rodapé"
            className="flex items-center gap-x-5 gap-y-1 text-xs font-medium text-stone-500"
          >
            {FOOTER_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.view)}
                className="transition-colors hover:text-emerald-700"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={() => {
                useAppStore.getState().setExploreTab('library')
                navigate({ name: 'marketplace' })
              }}
              className="inline-flex items-center gap-1 transition-colors hover:text-emerald-700"
            >
              <Library className="h-3 w-3" /> Biblioteca
            </button>
          </nav>

          <p className="shrink-0 text-[11px] text-stone-400">© {year} MentorHub</p>
        </div>
      </div>

      {/* Mobile: tab bar estilo app nativo, sempre visível */}
      <div className="border-t border-stone-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden">
        <nav aria-label="Navegação principal" className="grid h-14 grid-cols-3">
          {TABS.map((tab) => {
            const active = view.name === tab.view.name
            return (
              <button
                key={tab.label}
                onClick={() => navigate(tab.view)}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 transition-colors',
                  active ? 'text-emerald-700' : 'text-stone-400 active:text-stone-600'
                )}
              >
                {tab.icon}
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </footer>
  )
}
