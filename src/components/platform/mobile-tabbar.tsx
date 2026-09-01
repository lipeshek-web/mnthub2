'use client'

import { Compass, CalendarDays, MessageCircle, Ellipsis, Gift, LayoutDashboard, LogOut, PlusCircle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/platform/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { firstName } from '@/lib/helpers'
import { useBadges } from '@/components/platform/navbar'
import { cn } from '@/lib/utils'

/**
 * Tab bar inferior (mobile <md) — navegação estilo app. O navbar do topo
 * esconde os links abaixo de sm: aqui ficam sempre ao alcance do polegar.
 * "Menu" abre o mesmo conteúdo do dropdown do usuário (desktop).
 */
export function MobileTabbar() {
  const view = useAppStore((s) => s.view)
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const setUser = useAppStore((s) => s.setUser)
  const badges = useBadges()

  const tab = (target: Parameters<typeof navigate>[0], label: string, icon: React.ReactNode, badgeCount = 0) => {
    const active = view.name === target.name
    return (
      <button
        key={label}
        onClick={() => navigate(target)}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
          active ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300'
        )}
      >
        <span className="relative">
          {icon}
          {badgeCount > 0 && (
            <span
              aria-label={`${badgeCount} não lidas`}
              className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white"
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </span>
          )}
        </span>
        {label}
      </button>
    )
  }

  const handleLogout = () => {
    setUser(null)
    toast.info('Você saiu da sua conta. Até logo!')
    navigate({ name: 'home' })
  }

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/80 bg-white/95 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-950/95"
    >
      <div className="mx-auto flex max-w-lg items-stretch pb-[env(safe-area-inset-bottom)]">
        {tab({ name: 'marketplace' }, 'Explorar', <Compass className="h-5 w-5" />)}
        {tab({ name: 'dashboard' }, 'Sessões', <CalendarDays className="h-5 w-5" />)}
        {user && tab({ name: 'messages' }, 'Mensagens', <MessageCircle className="h-5 w-5" />, badges.messages + badges.notifications)}

        {/* Menu (perfil): mesmo conteúdo do dropdown do usuário no desktop */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Abrir menu"
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold text-stone-400 transition-colors hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" className="h-5 w-5 ring-1 ring-stone-200 dark:ring-stone-700" />
                Menu
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5">
                  <Avatar name={user.name} src={user.avatarUrl} size="md" className="ring-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold">{user.name}</p>
                      {user.isMentor && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          Mentor
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                <CalendarDays className="h-4 w-4" /> Minhas mentorias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ name: 'referrals' })}>
                <Gift className="h-4 w-4" /> Indicar amigos
              </DropdownMenuItem>
              {user.isMentor ? (
                <DropdownMenuItem onClick={() => navigate({ name: 'onboarding' })}>
                  <LayoutDashboard className="h-4 w-4" /> Painel do mentor
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate({ name: 'onboarding' })}>
                  <PlusCircle className="h-4 w-4" /> Criar perfil de mentor
                </DropdownMenuItem>
              )}
              {user.role === 'ADMIN' && (
                <DropdownMenuItem onClick={() => navigate({ name: 'admin' })}>
                  <ShieldCheck className="h-4 w-4" /> Administração
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600">
                <LogOut className="h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          tab({ name: 'auth', mode: 'login' }, 'Entrar', <Ellipsis className="h-5 w-5" />)
        )}
      </div>
    </nav>
  )
}
