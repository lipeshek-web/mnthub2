'use client'

import { motion } from 'framer-motion'
import {
  CalendarDays,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlusCircle,
  Search,
  Sparkles,
  UserRoundPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/platform/avatar'
import { useAppStore, type AppView } from '@/lib/store'
import { firstName } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Navbar() {
  const { user, view, setUser, navigate } = useAppStore()

  const navItem = (target: AppView, label: string, icon: React.ReactNode) => {
    const active = view.name === target.name
    return (
      <button
        key={label}
        onClick={() => navigate(target)}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        title={label}
        className={cn(
          'relative flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors',
          active ? 'text-emerald-800' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        {active && (
          <motion.span
            layoutId="navbar-nav-pill"
            aria-hidden
            transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
            className="absolute inset-0 -z-10 rounded-full bg-emerald-50"
          />
        )}
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>
    )
  }

  const handleLogout = () => {
    setUser(null)
    toast.info('Você saiu da sua conta. Até logo!')
    navigate({ name: 'home' })
  }

  return (
    <header className="z-40 shrink-0 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <button
          className="flex items-center gap-2.5"
          onClick={() => navigate({ name: 'home' })}
          aria-label="Ir para a página inicial"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white transition-transform duration-200 hover:scale-[1.02]">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <span className="text-base font-extrabold tracking-tight text-stone-900">
            Mentor<span className="text-emerald-700">Hub</span>
          </span>
        </button>

        <nav aria-label="Navegação principal" className="ml-4 hidden items-center gap-1 sm:flex">
          {navItem({ name: 'marketplace' }, 'Explorar', <Compass className="h-4 w-4" />)}
          {navItem({ name: 'dashboard' }, 'Minhas sessões', <CalendarDays className="h-4 w-4" />)}
          {navItem({ name: 'for-mentors' }, 'Para mentores', <Sparkles className="h-4 w-4" />)}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate({ name: 'marketplace' })}
            aria-label="Explorar mentores e cursos"
            title="Explorar mentores e cursos"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  aria-label="Menu do usuário"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" className="ring-transparent" />
                  <span className="hidden max-w-28 truncate text-sm font-semibold text-stone-700 sm:inline">
                    {firstName(user.name)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
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
                      <p className="truncate text-xs font-normal text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                  <CalendarDays className="h-4 w-4" /> Minhas sessões
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'marketplace' })}>
                  <Compass className="h-4 w-4" /> Explorar
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Mobile (<sm): apenas o botão primário "Entrar" */}
              <Button
                size="sm"
                className="h-9 rounded-full px-3.5 font-semibold sm:hidden"
                onClick={() => navigate({ name: 'auth', mode: 'login' })}
                aria-label="Entrar na plataforma"
              >
                <LogIn className="h-4 w-4" /> Entrar
              </Button>

              {/* Desktop (sm+): "Entrar" (ghost) + "Criar conta" (primário) */}
              <div className="hidden items-center gap-1.5 sm:flex">
                <Button
                  variant="ghost"
                  className="h-9 rounded-full px-3.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  onClick={() => navigate({ name: 'auth', mode: 'login' })}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  className="h-9 rounded-full px-3.5 font-semibold"
                  onClick={() => navigate({ name: 'auth', mode: 'register' })}
                >
                  <UserRoundPlus className="h-4 w-4" /> Criar conta
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
