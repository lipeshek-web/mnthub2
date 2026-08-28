'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  Compass,
  GraduationCap,
  LogOut,
  PlusCircle,
  UserRoundPlus,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import type { UserDTO } from '@/lib/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Navbar() {
  const { user, view, setUser, navigate } = useAppStore()
  const [users, setUsers] = useState<UserDTO[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api
      .listUsers()
      .then(setUsers)
      .catch(() => {})
  }, [])

  const pickUser = (u: UserDTO) => {
    setUser(u)
    toast.success(`Olá, ${u.name.split(' ')[0]}! Você entrou na plataforma.`)
  }

  const createUser = async () => {
    if (!newName.trim() || !newEmail.includes('@')) {
      toast.error('Preencha nome e um e-mail válido.')
      return
    }
    setCreating(true)
    try {
      const u = await api.createUser({ name: newName.trim(), email: newEmail.trim() })
      setUsers((prev) => [...prev, u])
      pickUser(u)
      setCreateOpen(false)
      setNewName('')
      setNewEmail('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar conta')
    } finally {
      setCreating(false)
    }
  }

  const navItem = (
    name: 'marketplace' | 'dashboard' | 'onboarding',
    label: string,
    icon: React.ReactNode
  ) => {
    const active = view.name === name
    return (
      <button
        onClick={() => navigate({ name } as never)}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        title={label}
        className={cn(
          'flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors',
          active ? 'bg-emerald-100 text-emerald-800' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        )}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <button
          className="flex items-center gap-2.5"
          onClick={() => navigate({ name: 'marketplace' })}
          aria-label="Ir para a página inicial"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-stone-900">
            Mentor<span className="text-emerald-700">Hub</span>
          </span>
        </button>

        <div className="ml-4 hidden items-center gap-1 sm:flex">
          {navItem('marketplace', 'Explorar', <Compass className="h-4 w-4" />)}
          {navItem('dashboard', 'Minhas sessões', <CalendarDays className="h-4 w-4" />)}
          {navItem('onboarding', 'Tornar-se mentor', <PlusCircle className="h-4 w-4" />)}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2.5 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
                  aria-label="Menu do usuário"
                >
                  <Avatar name={user.name} size="sm" className="ring-transparent" />
                  <span className="hidden max-w-28 truncate text-sm font-semibold text-stone-700 sm:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                  <CalendarDays className="h-4 w-4" /> Minhas sessões
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ name: 'onboarding' })}>
                  <PlusCircle className="h-4 w-4" /> Perfil de mentor
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Trocar usuário (demo)
                </DropdownMenuLabel>
                <div className="max-h-52 overflow-y-auto">
                  {users.map((u) => (
                    <DropdownMenuItem key={u.id} onClick={() => pickUser(u)} className="gap-2.5">
                      <Avatar name={u.name} size="sm" className="h-6 w-6 text-[9px] ring-0" />
                      <span className="flex-1 truncate">{u.name}</span>
                      {u.id === user.id && <Check className="h-4 w-4 text-emerald-600" />}
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <UserRoundPlus className="h-4 w-4" /> Criar nova conta
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setUser(null)
                    navigate({ name: 'marketplace' })
                  }}
                  className="text-rose-600 focus:text-rose-600"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full" size="sm">
                  <Users className="h-4 w-4" /> Entrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Entrar como (demo)</DropdownMenuLabel>
                <div className="max-h-72 overflow-y-auto">
                  {users.map((u) => (
                    <DropdownMenuItem key={u.id} onClick={() => pickUser(u)} className="gap-2.5">
                      <Avatar name={u.name} size="sm" className="h-6 w-6 text-[9px] ring-0" />
                      <span className="flex-1 truncate">{u.name}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <UserRoundPlus className="h-4 w-4" /> Criar nova conta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-t border-stone-100 px-4 py-2 sm:hidden">
        {navItem('marketplace', 'Explorar', <Compass className="h-4 w-4" />)}
        {navItem('dashboard', 'Sessões', <CalendarDays className="h-4 w-4" />)}
        {navItem('onboarding', 'Ser mentor', <PlusCircle className="h-4 w-4" />)}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar nova conta</DialogTitle>
            <DialogDescription>
              Junte-se ao MentorHub como aluno ou futuro mentor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome completo</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex.: Maria Oliveira"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="voce@exemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createUser} disabled={creating}>
              {creating ? 'Criando...' : 'Criar conta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
