'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarDays,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlusCircle,
  Search,
  UserRoundPlus,
  X,
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

  // ---------- Busca global do header ----------
  const [query, setQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)

  const submitSearch = (value: string) => {
    const q = value.trim()
    if (!q) return
    useAppStore.getState().setExploreQuery(q)
    useAppStore.getState().setExploreTab('all')
    navigate({ name: 'marketplace' })
    setMobileSearchOpen(false)
  }

  // Atalho "/" foca a busca do header (sensação de app nativo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      if (e.key === '/' && !typing) {
        e.preventDefault()
        if (window.matchMedia('(min-width: 768px)').matches) {
          desktopSearchRef.current?.focus()
        } else {
          setMobileSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const searchField = (isMobile: boolean) => {
    const value = query
    const setValue = (v: string) => setQuery(v)
    return (
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submitSearch(value)
        }}
        className="relative w-full"
      >
        <Search
          aria-hidden
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
        />
        <input
          ref={isMobile ? mobileSearchRef : desktopSearchRef}
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar mentores, cursos, trilhas e leituras..."
          aria-label="Buscar na plataforma"
          className={cn(
            'h-9 w-full rounded-full border border-transparent bg-stone-100 pl-10 pr-9 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400',
            'focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100',
            '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue('')}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          !isMobile && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 items-center rounded border border-stone-200 bg-white px-1 font-mono text-[10px] font-medium text-stone-400 md:inline-flex">
              /
            </kbd>
          )
        )}
      </form>
    )
  }

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
    <header className="sticky top-0 z-40 shrink-0 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
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
        </nav>

        {/* Busca global (desktop): envia para o Explorar com o termo aplicado */}
        <div className="mx-auto hidden w-full max-w-xs md:block lg:max-w-sm">
          {searchField(false)}
        </div>

        <div className={cn('flex items-center gap-2', 'md:ml-0 ml-auto')}>
          {/* Busca (mobile): ícone que expande uma linha de busca abaixo */}
          <button
            onClick={() => {
              setMobileSearchOpen((open) => !open)
              setTimeout(() => mobileSearchRef.current?.focus(), 60)
            }}
            aria-expanded={mobileSearchOpen}
            aria-label={mobileSearchOpen ? 'Fechar busca' : 'Abrir busca'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 md:hidden"
          >
            {mobileSearchOpen ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
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

      {/* Linha de busca mobile expansível */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-stone-100 bg-white md:hidden"
          >
            <div className="px-4 py-2.5">{searchField(true)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
