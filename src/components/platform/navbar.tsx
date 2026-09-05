'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {Bell,
  BellOff,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Compass,
  Gift,
  LayoutDashboard,
  ListVideo,
  LogIn,
  LogOut,
  MessageCircle,
  MessageSquareQuote,
  Moon,
  PlusCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Sun,
  UserPlus,
  UserRoundPlus,
  X,
  Radio,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { api } from '@/lib/api'
import type { NotificationDTO } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/platform/avatar'
import { BrandMark } from '@/components/platform/brand'
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

// ==================== Sino de notificações in-app ====================

type NotificationChip = { icon: LucideIcon; chipClass: string }

/** Chip de ícone por tipo de notificação (neutros slate + destaque azul, verde p/ sucesso) */
const NOTIFICATION_KINDS: Record<string, NotificationChip> = {
  booking_new: { icon: CalendarClock, chipClass: 'bg-blue-100 text-blue-600' },
  booking_confirmed: { icon: CalendarCheck, chipClass: 'bg-emerald-100 text-emerald-700' },
  booking_cancelled: { icon: CalendarX, chipClass: 'bg-rose-100 text-rose-600' },
  booking_completed: { icon: CheckCircle2, chipClass: 'bg-emerald-100 text-emerald-700' },
  review_new: { icon: Star, chipClass: 'bg-blue-100 text-blue-600' },
  lesson_new: { icon: ListVideo, chipClass: 'bg-violet-100 text-violet-600' },
  enrollment_new: { icon: UserPlus, chipClass: 'bg-blue-100 text-blue-700' },
  course_review_new: { icon: MessageSquareQuote, chipClass: 'bg-violet-100 text-violet-600' },
  purchase_new: { icon: ShoppingBag, chipClass: 'bg-blue-100 text-blue-700' },
  message_new: { icon: MessageCircle, chipClass: 'bg-teal-100 text-teal-700' },
}
const DEFAULT_KIND: NotificationChip = { icon: Bell, chipClass: 'bg-slate-100 text-slate-500' }

/** Tempo relativo compacto: "agora", "há 5 min", "há 2 h", "há 3 d" (data p/ antigos) */
function relativeTime(iso: string) {
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000))
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const hours = Math.floor(diffMin / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ==================== Contadores do header (1 poll para os 2 sininhos) ====================

/**
 * Badge único: mensagens + notificações não lidas em UM request autenticado
 * (antes eram 2 polls — messages/unread 45s + notifications 60s). Pausa com a
 * aba oculta e atualiza ao voltar o foco. `refresh()` força revalidação depois
 * de ações locais (ex.: marcar tudo como lido). Compartilhado com a tab bar mobile.
 */
export function useBadges() {
  const userId = useAppStore((s) => s.user?.id)
  const [badges, setBadges] = useState({ messages: 0, notifications: 0 })
  const aliveRef = useRef(true)
  const reqIdRef = useRef(0)

  const refresh = useCallback(() => {
    if (!userId) return
    const reqId = ++reqIdRef.current
    api
      .badges()
      .then((res) => {
        if (!aliveRef.current || reqId !== reqIdRef.current) return
        setBadges((prev) =>
          prev.messages === res.messages && prev.notifications === res.notifications
            ? prev
            : { messages: res.messages, notifications: res.notifications }
        )
      })
      .catch(() => {
        /* silencioso */
      })
  }, [userId])

  useEffect(() => {
    if (!userId) return
    aliveRef.current = true
    refresh()
    const timer = setInterval(() => {
      if (document.hidden) return // economia: aba em segundo plano não faz polling
      refresh()
    }, 45_000)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      aliveRef.current = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [userId, refresh])

  // Sem login os badges são sempre zero (derivado — sem setState em efeito)
  const shown = userId ? badges : { messages: 0, notifications: 0 }
  return { ...shown, refresh }
}

// ==================== Mensagens diretas (chat) ====================

/** Ícone de mensagens com badge de não lidas (alimenta-se do badge único do header) */
function MessagesButton({ unread }: { unread: number }) {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)

  if (!user) return null

  return (
    <button
      type="button"
      onClick={() => navigate({ name: 'messages' })}
      aria-label={
        unread > 0 ? `Mensagens, ${unread} não lida${unread === 1 ? '' : 's'}` : 'Mensagens'
      }
      title="Mensagens"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      <MessageCircle className="h-4.5 w-4.5" />
      {unread > 0 && (
        <span
          aria-live="polite"
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}

// ==================== Alternador de tema (claro/escuro) ====================

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // next-themes só sabe o tema no cliente — evita mismatch de hidratação
  // (useSyncExternalStore em vez de setState em effect: sem render cascata)
  const emptySubscribe = useCallback(() => () => {}, [])
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const isDark = mounted && resolvedTheme === 'dark'
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-4.5 w-4.5" />
        ) : (
          <Moon className="h-4.5 w-4.5" />
        )
      ) : (
        <span className="h-4.5 w-4.5" aria-hidden />
      )}
    </button>
  )
}

function NotificationsBell({
  badgeCount,
  refreshBadges,
}: {
  badgeCount: number
  refreshBadges: () => void
}) {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationDTO[]>([])
  // Contador exibido = sobrescrita otimista local ?? badge do header (poll 45s).
  // Sem setState em efeito: o badge chega como prop e a otimização vence até o
  // servidor confirmar.
  const [localOverride, setLocalOverride] = useState<number | null>(null)
  const unreadCount = localOverride ?? badgeCount

  // Guard `alive` + contador de requisição: evita setState de respostas
  // obsoletas (unmount, troca de usuário ou fetch sobreposto)
  const aliveRef = useRef(true)
  const reqIdRef = useRef(0)

  const loadNotifications = useCallback(async (userId: string) => {
    const reqId = ++reqIdRef.current
    try {
      const res = await api.listNotifications(userId)
      if (!aliveRef.current || reqId !== reqIdRef.current) return
      setItems(res.items)
      setLocalOverride(res.unreadCount)
    } catch {
      // Erro silencioso: badge apenas não aparece (sem toast)
    }
  }, [])

  const userId = user?.id
  // Itens do dropdown: carregados ao ABRIR o painel (sem poll e sem fetch no
  // mount — o contador vem do badge único; a lista só importa ao abrir)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && userId) loadNotifications(userId) // refetch ao abrir o dropdown
  }
  const handleItemClick = (item: NotificationDTO) => {
    // Marca como lida de forma otimista (badge/zumbido atualizam na hora)
    if (!item.read) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
      setLocalOverride((count) => Math.max(0, unreadCount - 1))
      if (userId) api.markNotificationsRead(userId, [item.id]).catch(() => {})
      refreshBadges()
    }
    // Navega conforme o destino sugerido pela notificação
    if (item.linkView === 'dashboard') navigate({ name: 'dashboard' })
    else if (item.linkView === 'course' && item.refId) navigate({ name: 'course', courseId: item.refId })
    else if (item.linkView === 'onboarding') navigate({ name: 'onboarding' })
    else if (item.linkView === 'messages') navigate({ name: 'messages', peerId: item.refId ?? undefined })
    else if (item.linkView === 'referrals') navigate({ name: 'referrals' })
    setOpen(false)
  }

  const handleMarkAll = () => {
    if (!userId || unreadCount === 0) return
    const prevItems = items
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setLocalOverride(0)
    api.markNotificationsRead(userId).catch(() => {
      // Falhou: restaura o estado anterior
      setItems(prevItems)
      setLocalOverride(prevItems.filter((n) => !n.read).length)
    })
    refreshBadges()
  }

  if (!user) return null

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notificações, ${unreadCount} não lida${unreadCount === 1 ? '' : 's'}`
              : 'Notificações'
          }
          title="Notificações"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span
              aria-live="polite"
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-88 overflow-hidden p-0 sm:w-96">
        {/* Cabeçalho do painel */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
          <DropdownMenuLabel className="p-0 font-semibold text-slate-900 dark:text-slate-100">
            Notificações
          </DropdownMenuLabel>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="rounded text-xs font-semibold text-blue-700 transition-colors hover:text-blue-900 disabled:pointer-events-none disabled:text-slate-300 dark:text-blue-400 dark:hover:text-blue-300 dark:disabled:text-slate-600"
          >
            Marcar todas como lidas
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <BellOff className="h-8 w-8 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="text-sm text-slate-500 dark:text-slate-400">Você está em dia! Nenhuma notificação.</p>
          </div>
        ) : (
          <div
            role="list"
            aria-label="Lista de notificações"
            className="max-h-[380px] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {items.map((item) => {
              const chip = NOTIFICATION_KINDS[item.kind] ?? DEFAULT_KIND
              const Icon = chip.icon
              return (
                <div key={item.id} role="listitem">
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none',
                      item.read
                        ? 'hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60'
                        : 'bg-blue-50/50 hover:bg-blue-50 focus-visible:bg-blue-50 dark:bg-blue-950/40 dark:hover:bg-blue-900/30 dark:focus-visible:bg-blue-900/30'
                    )}
                  >
                    {!item.read && (
                      <span
                        aria-hidden
                        className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-blue-500"
                      />
                    )}
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        chip.chipClass
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-sm font-semibold',
                            item.read ? 'text-slate-500' : 'text-slate-900'
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                      {item.body && (
                        <span className="mt-0.5 block text-xs leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
                          {item.body}
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Navbar() {
  // Seletores atômicos (não destruturar a store inteira: Navbar re-renderizaria
  // a cada commit de qualquer campo, incluindo a cada digitação da busca)
  const user = useAppStore((s) => s.user)
  const view = useAppStore((s) => s.view)
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useAppStore((s) => s.navigate)
  const badges = useBadges()

  // ---------- Busca global do header (a busca principal, sempre visível) ----------
  const [query, setQuery] = useState('')
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // O texto do campo acompanha o termo ativo em qualquer tela (ex.: busca feita
  // em outra aba/session) — a busca é uma só, centralizada no header.
  const externalQuery = useAppStore((s) => s.exploreQuery)

  useEffect(() => {
    setQuery(externalQuery)
  }, [externalQuery])

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [])

  /** Aplica o termo na store e leva o usuário ao Explorar (modo resultados) */
  const applySearch = (value: string) => {
    const q = value.trim()
    const state = useAppStore.getState()
    state.setExploreQuery(q)
    if (q && state.view.name !== 'marketplace') {
      state.setExploreTab('all')
      state.navigate({ name: 'marketplace' })
    }
  }

  /** Digitação ao vivo: navega e filtra com debounce — o corpo vira só resultados */
  const onSearchInput = (value: string) => {
    setQuery(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    const trimmed = value.trim()
    if (!trimmed) {
      useAppStore.getState().setExploreQuery('')
      if (useAppStore.getState().view.name === 'marketplace') setMobileSearchOpen(false)
      return
    }
    searchDebounceRef.current = setTimeout(() => {
      const wasOnMarketplace = useAppStore.getState().view.name === 'marketplace'
      applySearch(value)
      if (!wasOnMarketplace) setMobileSearchOpen(false)
    }, 250)
  }

  const submitSearch = (value: string) => {
    const q = value.trim()
    if (!q) return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    useAppStore.getState().setExploreQuery(q)
    useAppStore.getState().setExploreTab('all')
    navigate({ name: 'marketplace' })
    setMobileSearchOpen(false)
  }

  // Atalho "/" foca a busca principal do header (sensação de app nativo)
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
          setTimeout(() => mobileSearchRef.current?.focus(), 60)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const searchField = (isMobile: boolean) => {
    const value = query
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
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />
        <input
          ref={isMobile ? mobileSearchRef : desktopSearchRef}
          type="search"
          value={value}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="Buscar mentores, cursos, trilhas e leituras..."
          aria-label="Buscar na plataforma"
          className={cn(
            'h-10 w-full rounded-full border border-transparent bg-slate-100 pl-10 pr-9 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400',
            'focus:border-blue-300 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-blue-500/10',
            'dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none',
            'dark:focus:border-blue-700 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20',
            '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden'
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onSearchInput('')}
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          !isMobile && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 items-center rounded border border-slate-200 bg-white px-1 font-mono text-[10px] font-medium text-slate-400 md:inline-flex dark:border-slate-700 dark:bg-slate-900">
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
          'relative flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-all duration-200',
          active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
        )}
      >
        {active && (
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-blue-100/80 ring-1 ring-blue-200/70 ring-inset dark:bg-blue-900/40 dark:ring-blue-800/60"
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
    /* Estático no topo do shell (fora do container de rolagem): o corpo da
       página rola no <main> e NUNCA passa por baixo do header. */
    <header className="shrink-0 border-b border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        <button
          className="group flex items-center gap-2.5"
          onClick={() => navigate({ name: 'home' })}
          aria-label="Órbita — ir para a página inicial"
        >
          <BrandMark className="h-8 w-8 rounded-[0.7rem] transition-transform duration-200 group-hover:scale-[1.04]" iconClassName="h-4.5 w-4.5" />
          <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Órbita
          </span>
        </button>

        <nav aria-label="Navegação principal" className="ml-2 hidden items-center gap-1 sm:flex">
          {navItem({ name: 'marketplace' }, 'Explorar', <Compass className="h-4 w-4" />)}
          {user && navItem({ name: 'events' }, 'Eventos', <Radio className="h-4 w-4" />)}
          {/* "Minhas mentorias" só faz sentido para quem está logado — some para visitantes */}
          {user && navItem({ name: 'dashboard' }, 'Minhas mentorias', <CalendarDays className="h-4 w-4" />)}
        </nav>

        {/* Busca principal (desktop): sempre visível, centralizada no header */}
        <div className="mx-auto hidden w-full max-w-sm md:block lg:max-w-md">
          {searchField(false)}
        </div>

        <div className={cn('flex items-center gap-1 sm:gap-1.5', 'md:ml-0 ml-auto')}>
          {/* Tema claro/escuro (todos) + mensagens e sino (apenas logado) */}
          <ThemeToggle />
          {user && <MessagesButton unread={badges.messages} />}
          {user && (
            <NotificationsBell badgeCount={badges.notifications} refreshBadges={badges.refresh} />
          )}

          {/* Busca (mobile): ícone que expande a linha de busca abaixo do header */}
          <button
            onClick={() => {
              setMobileSearchOpen((open) => !open)
              setTimeout(() => mobileSearchRef.current?.focus(), 60)
            }}
            aria-expanded={mobileSearchOpen}
            aria-label={mobileSearchOpen ? 'Fechar busca' : 'Abrir busca'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {mobileSearchOpen ? <X className="h-4.5 w-4.5" /> : <Search className="h-4.5 w-4.5" />}
          </button>

          {/* Divisor fino entre ações e conta — toque de toolbar de sistema */}
          <div aria-hidden className="mx-0.5 hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-800" />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700/80 dark:bg-slate-900 dark:shadow-none dark:hover:border-blue-700 dark:hover:bg-blue-950/50"
                  aria-label="Menu do usuário"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size="sm" className="ring-transparent" />
                  <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 sm:inline dark:text-slate-200">
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
                  <CalendarDays className="h-4 w-4" /> Minhas mentorias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'messages' })}>
                  <MessageCircle className="h-4 w-4" /> Mensagens
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'marketplace' })}>
                  <Compass className="h-4 w-4" /> Explorar
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
                  className="h-9 rounded-full px-3.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

      {/* Linha de busca mobile expansível (animação CSS, sem lib) */}
      {mobileSearchOpen && (
        <div className="mh-slide-down overflow-hidden border-t border-slate-100 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="px-4 py-2.5">{searchField(true)}</div>
        </div>
      )}
    </header>
  )
}
