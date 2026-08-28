'use client'

import { GraduationCap } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function PlatformFooter() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <footer className="mt-auto border-t bg-stone-50 pb-[calc(env(safe-area-inset-bottom)+0.25rem)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-bold">MentorHub</p>
            <p className="text-xs text-muted-foreground">Aprenda com quem vive o que ensina</p>
          </div>
        </div>

        <nav aria-label="Links do rodapé" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <button
            className="transition-colors hover:text-emerald-700"
            onClick={() => navigate({ name: 'marketplace' })}
          >
            Explorar mentores
          </button>
          <button
            className="transition-colors hover:text-emerald-700"
            onClick={() => navigate({ name: 'onboarding' })}
          >
            Tornar-se mentor
          </button>
          <button
            className="transition-colors hover:text-emerald-700"
            onClick={() => navigate({ name: 'dashboard' })}
          >
            Minhas sessões
          </button>
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} MentorHub · Reuniões por vídeo integradas
        </p>
      </div>
    </footer>
  )
}
