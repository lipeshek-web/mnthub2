'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Eye,
  EyeOff,
  GraduationCap,
  Library,
  Loader2,
  Users,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { firstName } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { UserDTO } from '@/lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEMO_PASSWORD = 'demo123'

const PANEL_BULLETS = [
  { icon: Video, text: 'Cursos com aulas ao vivo, temas e materiais' },
  { icon: Users, text: 'Mentorias 1:1 com especialistas de verdade' },
  { icon: Library, text: 'Biblioteca com artigos e livros para ler na plataforma' },
]

interface FieldErrors {
  name?: string
  email?: string
  password?: string
}

export function AuthView({ initialMode }: { initialMode?: 'login' | 'register' }) {
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useAppStore((s) => s.navigate)

  const [tab, setTab] = useState<'login' | 'register'>(initialMode ?? 'login')

  // ----- Entrar -----
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginErrors, setLoginErrors] = useState<FieldErrors>({})
  const [loginFormError, setLoginFormError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // ----- Criar conta -----
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [regErrors, setRegErrors] = useState<FieldErrors>({})
  const [regFormError, setRegFormError] = useState<string | null>(null)
  const [regLoading, setRegLoading] = useState(false)

  // ----- Contas de demonstração -----
  const [demoUsers, setDemoUsers] = useState<UserDTO[]>([])
  const [demoLoading, setDemoLoading] = useState(true)
  const [demoBusyId, setDemoBusyId] = useState<string | null>(null)

  // Sincroniza quando a view chega com outro modo (ex.: clique em "Criar conta" no navbar)
  useEffect(() => {
    if (initialMode) setTab(initialMode)
  }, [initialMode])

  useEffect(() => {
    let active = true
    api
      .listUsers()
      .then((users) => {
        if (active) setDemoUsers(users)
      })
      .catch(() => {
        if (active) setDemoUsers([])
      })
      .finally(() => {
        if (active) setDemoLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  /** Ao trocar de tab, limpa os erros inline */
  const switchTab = (next: string) => {
    setTab(next as 'login' | 'register')
    setLoginErrors({})
    setLoginFormError(null)
    setRegErrors({})
    setRegFormError(null)
  }

  // ---------- Entrar ----------
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loginLoading) return // bloqueia duplo submit

    const errors: FieldErrors = {}
    if (!EMAIL_RE.test(loginEmail.trim())) errors.email = 'Informe um e-mail válido.'
    if (loginPassword.length < 6) errors.password = 'A senha deve ter pelo menos 6 caracteres.'
    setLoginErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoginLoading(true)
    setLoginFormError(null)
    try {
      const user = await api.login({ email: loginEmail.trim(), password: loginPassword })
      setUser(user)
      toast.success(`Bem-vindo(a) de volta, ${firstName(user.name)}! 👋`)
      navigate({ name: 'home' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.'
      toast.error(msg)
      setLoginFormError(msg)
    } finally {
      setLoginLoading(false)
    }
  }

  // ---------- Criar conta ----------
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (regLoading) return // bloqueia duplo submit

    const errors: FieldErrors = {}
    if (regName.trim().length < 2) errors.name = 'Informe seu nome completo.'
    if (!EMAIL_RE.test(regEmail.trim())) errors.email = 'Informe um e-mail válido.'
    if (regPassword.length < 6) errors.password = 'A senha deve ter pelo menos 6 caracteres.'
    setRegErrors(errors)
    if (Object.keys(errors).length > 0) return

    setRegLoading(true)
    setRegFormError(null)
    try {
      const user = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      })
      setUser(user)
      toast.success(`Conta criada! Bem-vindo(a), ${firstName(user.name)}! 🎉`)
      navigate({ name: 'home' })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Não foi possível criar sua conta. Tente novamente.'
      toast.error(msg)
      if (msg.includes('Já existe') || msg.includes('e-mail')) {
        setRegErrors((prev) => ({ ...prev, email: 'Já existe conta com este e-mail. Faça login.' }))
      } else {
        setRegFormError(msg)
      }
    } finally {
      setRegLoading(false)
    }
  }

  // ---------- Contas demo ----------
  const handleDemoLogin = async (u: UserDTO) => {
    if (demoBusyId) return
    setDemoBusyId(u.id)
    try {
      const user = await api.login({ email: u.email, password: DEMO_PASSWORD })
      setUser(user)
      toast.success(`Entrou como ${user.name}`)
      navigate({ name: 'home' })
    } catch {
      toast.info('Esta conta demo ainda está sendo preparada. Crie a sua!')
    } finally {
      setDemoBusyId(null)
    }
  }

  const handleForgotPassword = () => {
    toast.info('Em breve! Por enquanto, use uma conta demo ou crie a sua.')
  }

  return (
    <div className="grid min-h-full bg-stone-50 lg:grid-cols-2">
      {/* ---------- Painel esquerdo (header compacto no mobile, completo no lg+) ---------- */}
      <section
        aria-label="Sobre o MentorHub"
        className="relative flex flex-col gap-10 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-6 text-white lg:justify-between lg:gap-12 lg:p-10 xl:p-14"
      >
        {/* Blobs decorativos */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-extrabold tracking-tight">MentorHub</span>
        </div>

        {/* Headline + bullets */}
        <div className="relative">
          <h1 className="max-w-lg text-2xl font-extrabold leading-tight tracking-tight lg:text-4xl lg:leading-[1.1]">
            Aprenda com quem vive o que ensina.
          </h1>
          <p className="mt-3 max-w-md text-sm text-emerald-100/80 lg:mt-4 lg:text-base">
            Cursos ao vivo, mentorias 1:1 e biblioteca — tudo o que você precisa para evoluir de
            verdade, em um só lugar.
          </p>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {PANEL_BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm text-emerald-50/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prova social (rodapé do painel) */}
        <div className="relative hidden lg:block">
          <div className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-4">
            <Stars rating={5} size={16} />
            <p className="mt-2 text-sm text-emerald-50/90">
              4,9 de média · +2.400 alunos aprendendo todos os dias
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Painel direito: formulário ---------- */}
      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <Tabs value={tab} onValueChange={switchTab}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-stone-100 p-1">
              <TabsTrigger
                value="login"
                className="rounded-full text-sm font-semibold text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-full text-sm font-semibold text-stone-500 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
              >
                Criar conta
              </TabsTrigger>
            </TabsList>

            {/* ----- Tab Entrar ----- */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-stone-900">
                    Bem-vindo de volta
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Entre para continuar sua jornada de aprendizado.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium text-stone-700">
                    E-mail
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value)
                      if (loginErrors.email)
                        setLoginErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(loginErrors.email)}
                    aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                  />
                  {loginErrors.email && (
                    <p id="login-email-error" className="text-xs text-rose-600">
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-stone-700">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value)
                        if (loginErrors.password)
                          setLoginErrors((prev) => ({ ...prev, password: undefined }))
                      }}
                      placeholder="Sua senha"
                      autoComplete="current-password"
                      className="h-11 rounded-xl pr-11"
                      aria-invalid={Boolean(loginErrors.password)}
                      aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-stone-400 transition-colors hover:text-stone-600"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p id="login-password-error" className="text-xs text-rose-600">
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-emerald-700 underline-offset-2 transition-colors hover:text-emerald-800 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {loginFormError && (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {loginFormError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="h-11 w-full rounded-full text-sm font-bold"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Entrando…
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* ----- Tab Criar conta ----- */}
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} noValidate className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-stone-900">
                    Crie sua conta
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    Estude com os melhores e, se quiser, vire mentor.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm font-medium text-stone-700">
                    Nome completo
                  </Label>
                  <Input
                    id="reg-name"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value)
                      if (regErrors.name) setRegErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    placeholder="Ex.: Maria Oliveira"
                    autoComplete="name"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(regErrors.name)}
                    aria-describedby={regErrors.name ? 'reg-name-error' : undefined}
                  />
                  {regErrors.name && (
                    <p id="reg-name-error" className="text-xs text-rose-600">
                      {regErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-stone-700">
                    E-mail
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value)
                      if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    className="h-11 rounded-xl"
                    aria-invalid={Boolean(regErrors.email)}
                    aria-describedby={regErrors.email ? 'reg-email-error' : undefined}
                  />
                  {regErrors.email && (
                    <p id="reg-email-error" className="text-xs text-rose-600">
                      {regErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-stone-700">
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value)
                        if (regErrors.password)
                          setRegErrors((prev) => ({ ...prev, password: undefined }))
                      }}
                      placeholder="Crie uma senha"
                      autoComplete="new-password"
                      className="h-11 rounded-xl pr-11"
                      aria-invalid={Boolean(regErrors.password)}
                      aria-describedby={
                        regErrors.password ? 'reg-password-error' : 'reg-password-hint'
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword((v) => !v)}
                      aria-label={showRegPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-stone-400 transition-colors hover:text-stone-600"
                    >
                      {showRegPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {regErrors.password ? (
                    <p id="reg-password-error" className="text-xs text-rose-600">
                      {regErrors.password}
                    </p>
                  ) : (
                    <p id="reg-password-hint" className="text-xs text-stone-400">
                      Mínimo de 6 caracteres
                    </p>
                  )}
                </div>

                {regFormError && (
                  <p role="alert" className="text-xs font-medium text-rose-600">
                    {regFormError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={regLoading}
                  className="h-11 w-full rounded-full text-sm font-bold"
                >
                  {regLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Criando conta…
                    </>
                  ) : (
                    'Criar minha conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* ----- Divisor + contas de demonstração ----- */}
          <div className="mt-7">
            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-stone-200" />
              <span className="text-xs font-medium text-stone-400">ou continue com</span>
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-stone-500">Contas de demonstração</p>
              <p className="mt-0.5 text-xs text-stone-400">
                Ideal para conhecer a plataforma · senha: demo123
              </p>

              {demoLoading ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-32 rounded-full" />
                  ))}
                </div>
              ) : demoUsers.length > 0 ? (
                <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-200 [&::-webkit-scrollbar]:w-1">
                  {demoUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleDemoLogin(u)}
                      disabled={demoBusyId !== null}
                      aria-label={`Entrar como ${u.name}`}
                      className="flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white pl-1.5 pr-4 text-xs font-semibold text-stone-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-wait disabled:opacity-60"
                    >
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" className="ring-0" />
                      <span className="max-w-36 truncate">{u.name}</span>
                      {demoBusyId === u.id && (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin text-emerald-700"
                          aria-hidden
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
