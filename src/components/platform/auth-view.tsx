'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Library,
  Loader2,
  Orbit,
  ShieldCheck,
  Users,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { firstName } from '@/lib/helpers'
import { clearStoredRefCode, getStoredRefCode } from '@/lib/referral'
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

export function AuthView({
  initialMode,
  resetToken,
}: {
  initialMode?: 'login' | 'register' | 'reset'
  resetToken?: string
}) {
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useAppStore((s) => s.navigate)

  const [tab, setTab] = useState<'login' | 'register'>(
    initialMode === 'register' ? 'register' : 'login'
  )

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
  const [demoUsers, setDemoUsers] = useState<
    { id: string; name: string; email: string; avatarUrl: string | null }[]
  >([])
  const [demoLoading, setDemoLoading] = useState(true)
  const [demoBusyId, setDemoBusyId] = useState<string | null>(null)

  // ----- MFA (segundo fator): ativo após senha correta de conta com MFA -----
  const [mfaTicket, setMfaTicket] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaMode, setMfaMode] = useState<'totp' | 'recovery'>('totp')
  const [mfaRecoveryCode, setMfaRecoveryCode] = useState('')

  // ----- Esqueci minha senha (dialog) -----
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotResult, setForgotResult] = useState<{ delivery: 'email' | 'outbox'; resetUrl?: string } | null>(null)

  // ----- Redefinir senha (link do e-mail, modo reset) -----
  const isReset = initialMode === 'reset' && Boolean(resetToken)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetDone, setResetDone] = useState(false)

  // Sincroniza quando a view chega com outro modo (ex.: clique em "Criar conta" no navbar)
  useEffect(() => {
    if (initialMode === 'login' || initialMode === 'register') setTab(initialMode)
  }, [initialMode])

  useEffect(() => {
    let active = true
    api
      .demoAccounts()
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
      const result = await api.login({ email: loginEmail.trim(), password: loginPassword })

      // Conta com MFA: mostra a etapa do código de 6 dígitos
      if ('mfaRequired' in result && result.mfaRequired) {
        setMfaTicket(result.mfaTicket)
        setMfaCode('')
        setMfaError(null)
        setMfaMode('totp')
        setMfaRecoveryCode('')
        toast.info('Confirme com o código do seu app autenticador 🔐')
        return
      }

      const user = result as UserDTO
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

  // ---------- MFA: verifica o código TOTP ou de recuperação ----------
  const handleMfaVerify = async (code?: string) => {
    if (!mfaTicket || mfaLoading) return
    const value =
      mfaMode === 'totp'
        ? (code ?? mfaCode).replace(/\D/g, '')
        : (code ?? mfaRecoveryCode).trim().toUpperCase()
    if (mfaMode === 'totp' && value.length !== 6) return
    if (mfaMode === 'recovery' && value.length < 6) return
    setMfaLoading(true)
    setMfaError(null)
    try {
      const user = await api.verifyMfa({ ticket: mfaTicket, code: value })
      setUser(user)
      if (user.usedRecoveryCode) {
        toast.warning(
          `Você entrou com um código de recuperação. Restam ${user.recoveryCodesRemaining ?? 0} — gere novos no painel admin. ⚠️`
        )
      } else {
        toast.success(`Bem-vindo(a) de volta, ${firstName(user.name)}! 👋`)
      }
      setMfaTicket(null)
      setMfaCode('')
      setMfaRecoveryCode('')
      setMfaMode('totp')
      navigate({ name: 'home' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Código inválido.'
      setMfaError(msg)
      setMfaCode('')
      setMfaRecoveryCode('')
    } finally {
      setMfaLoading(false)
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
      // Convite capturado em ?ref= (localStorage, janela de 7 dias)
      const refCode = getStoredRefCode() ?? undefined
      const user = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        refCode,
      })
      if (refCode) clearStoredRefCode()
      setUser(user)
      toast.success(
        user.referralApplied
          ? `Conta criada! R$ 10 de crédito de convite adicionados, ${firstName(user.name)}! 🎁`
          : `Conta criada! Bem-vindo(a), ${firstName(user.name)}! 🎉`
      )
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
      const result = await api.login({ email: u.email, password: DEMO_PASSWORD })
      // Contas demo não têm MFA — mas o tipo cobre o caso
      if ('mfaRequired' in result && result.mfaRequired) {
        setMfaTicket(result.mfaTicket)
        toast.info('Confirme com o código do seu app autenticador 🔐')
        return
      }
      const user = result as UserDTO
      setUser(user)
      toast.success(`Entrou como ${user.name}`)
      navigate({ name: 'home' })
    } catch (err) {
      // Mostra o erro real (ex.: 429 de rate limit) em vez de mascarar
      const msg = err instanceof Error ? err.message : ''
      toast.info(msg || 'Esta conta demo ainda está sendo preparada. Crie a sua!')
    } finally {
      setDemoBusyId(null)
    }
  }

  const handleForgotPassword = () => {
    setForgotError(null)
    setForgotResult(null)
    setForgotOpen(true)
  }

  const handleForgotSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    const email = forgotEmail.trim()
    if (!EMAIL_RE.test(email)) {
      setForgotError('Informe um e-mail válido.')
      return
    }
    setForgotLoading(true)
    try {
      const res = await api.forgotPassword(email)
      setForgotResult(res)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setForgotLoading(false)
    }
  }

  /** Modo demonstração (sem SMTP): segue direto para o formulário de nova senha */
  const openResetFromLink = (url: string) => {
    try {
      const t = new URL(url).searchParams.get('reset')
      if (t) {
        setForgotOpen(false)
        navigate({ name: 'auth', mode: 'reset', resetToken: t })
        return
      }
    } catch {
      /* cai no fallback */
    }
    window.location.href = url
  }

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setResetError(null)
    if (resetPassword.length < 6) {
      setResetError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (resetPassword !== resetConfirm) {
      setResetError('As senhas não coincidem.')
      return
    }
    if (!resetToken) {
      setResetError('Link inválido. Peça um novo e-mail de redefinição.')
      return
    }
    setResetLoading(true)
    try {
      await api.resetPassword(resetToken, resetPassword)
      setResetDone(true)
      toast.success('Senha alterada com sucesso!')
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Não foi possível redefinir a senha.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="grid min-h-full bg-slate-50 dark:bg-slate-950 lg:grid-cols-2">
      {/* ---------- Painel esquerdo (header compacto no mobile, completo no lg+) ---------- */}
      <section
        aria-label="Sobre o Órbita"
        className="relative flex flex-col gap-10 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-6 text-white lg:justify-between lg:gap-12 lg:p-10 xl:p-14"
      >
        {/* Blobs decorativos (brilho quente sobre graphite) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-white/[0.07] blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          {/* Anel orbital decorativo */}
          <div className="absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full border border-white/10" />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Orbit className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-extrabold tracking-tight">Órbita</span>
        </div>

        {/* Headline + bullets */}
        <div className="relative">
          <h1 className="max-w-lg text-2xl font-extrabold leading-tight tracking-tight lg:text-4xl lg:leading-[1.1]">
            Aprenda com quem vive o que ensina.
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-300 lg:mt-4 lg:text-base">
            Cursos ao vivo, mentorias 1:1 e biblioteca — tudo o que você precisa para evoluir de
            verdade, em um só lugar.
          </p>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {PANEL_BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                  <Icon className="h-5 w-5 text-blue-300" aria-hidden />
                </span>
                <span className="text-sm text-slate-100/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prova social (rodapé do painel) */}
        <div className="relative hidden lg:block">
          <div className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <Stars rating={5} size={16} />
            <p className="mt-2 text-sm text-slate-100/90">
              4,9 de média · +2.400 alunos aprendendo todos os dias
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Painel direito: formulário ---------- */}
      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-sm sm:p-8">
          {/* ----- Modo redefinir senha (chegou pelo link do e-mail) ----- */}
          {isReset ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Definir nova senha
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Escolha uma nova senha para acessar sua conta.
                </p>
              </div>

              {resetDone ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Senha alterada com sucesso! Faça login com a nova senha.</p>
                  </div>
                  <Button
                    onClick={() => navigate({ name: 'auth', mode: 'login' })}
                    className="h-11 w-full rounded-full text-sm font-bold"
                  >
                    Entrar na plataforma
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Nova senha
                    </Label>
                    <Input
                      id="reset-password"
                      type="password"
                      value={resetPassword}
                      onChange={(e) => {
                        setResetPassword(e.target.value)
                        if (resetError) setResetError(null)
                      }}
                      autoComplete="new-password"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Confirmar nova senha
                    </Label>
                    <Input
                      id="reset-confirm"
                      type="password"
                      value={resetConfirm}
                      onChange={(e) => {
                        setResetConfirm(e.target.value)
                        if (resetError) setResetError(null)
                      }}
                      autoComplete="new-password"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  {resetError && (
                    <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {resetError}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    className="h-11 w-full rounded-full text-sm font-bold"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Salvando…
                      </>
                    ) : (
                      'Salvar nova senha'
                    )}
                  </Button>
                </form>
              )}
            </div>
          ) : (
          <>
          <Tabs value={tab} onValueChange={switchTab}>
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger
                value="login"
                className="rounded-full text-sm font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-full text-sm font-semibold text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:text-slate-400 dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50"
              >
                Criar conta
              </TabsTrigger>
            </TabsList>

            {/* ----- Tab Entrar ----- */}
            <TabsContent value="login" className="mt-6">
              {mfaTicket ? (
                <div className="flex flex-col items-center text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                    <ShieldCheck className="h-7 w-7" aria-hidden />
                  </span>
                  <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    Verificação em duas etapas
                  </h2>
                  <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {mfaMode === 'totp' ? (
                      <>Digite o código de 6 dígitos do seu app autenticador (Google Authenticator, Authy…).</>
                    ) : (
                      <>Digite um dos seus códigos de recuperação (formato XXXX-XXXX). Cada código funciona uma única vez.</>
                    )}
                  </p>

                  <div className="mt-6">
                    {mfaMode === 'totp' ? (
                      <InputOTP
                        maxLength={6}
                        value={mfaCode}
                        onChange={(v) => {
                          setMfaCode(v)
                          setMfaError(null)
                          if (v.length === 6) void handleMfaVerify(v)
                        }}
                        disabled={mfaLoading}
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="h-12 w-11 rounded-lg border-slate-300 text-lg font-bold dark:border-slate-700" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    ) : (
                      <Input
                        value={mfaRecoveryCode}
                        onChange={(e) => {
                          setMfaRecoveryCode(e.target.value.toUpperCase())
                          setMfaError(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleMfaVerify()
                        }}
                        placeholder="XXXX-XXXX"
                        autoComplete="off"
                        disabled={mfaLoading}
                        className="h-12 w-56 rounded-xl text-center font-mono text-lg font-bold tracking-widest uppercase"
                        aria-label="Código de recuperação"
                      />
                    )}
                  </div>

                  {mfaError && (
                    <p role="alert" className="mt-4 text-xs font-medium text-rose-600 dark:text-rose-400">
                      {mfaError}
                    </p>
                  )}

                  <Button
                    onClick={() => void handleMfaVerify()}
                    disabled={
                      mfaLoading ||
                      (mfaMode === 'totp'
                        ? mfaCode.replace(/\D/g, '').length !== 6
                        : mfaRecoveryCode.trim().length < 6)
                    }
                    className="mt-6 h-11 w-full rounded-full text-sm font-bold"
                  >
                    {mfaLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Verificando…
                      </>
                    ) : (
                      'Confirmar código'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      if (mfaMode === 'recovery') {
                        setMfaMode('totp')
                        setMfaRecoveryCode('')
                      } else {
                        setMfaMode('recovery')
                        setMfaCode('')
                      }
                      setMfaError(null)
                    }}
                    className="mt-4 text-xs font-medium text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {mfaMode === 'recovery'
                      ? 'Usar o app autenticador'
                      : 'Não tem o app? Usar código de recuperação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaTicket(null)
                      setMfaCode('')
                      setMfaRecoveryCode('')
                      setMfaError(null)
                      setMfaMode('totp')
                    }}
                    className="mt-2 text-xs font-medium text-slate-400 underline-offset-2 transition-colors hover:text-slate-600 hover:underline dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    Voltar para o login
                  </button>
                </div>
              ) : (
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    Bem-vindo de volta
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Entre para continuar sua jornada de aprendizado.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                    <p id="login-email-error" className="text-xs text-rose-600 dark:text-rose-400">
                      {loginErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p id="login-password-error" className="text-xs text-rose-600 dark:text-rose-400">
                      {loginErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-blue-700 underline-offset-2 transition-colors hover:text-blue-800 hover:underline dark:text-blue-300 dark:hover:text-blue-300"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                {loginFormError && (
                  <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
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
              )}
            </TabsContent>

            {/* ----- Tab Criar conta ----- */}
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} noValidate className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    Crie sua conta
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Estude com os melhores e, se quiser, vire mentor.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                    <p id="reg-name-error" className="text-xs text-rose-600 dark:text-rose-400">
                      {regErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                    <p id="reg-email-error" className="text-xs text-rose-600 dark:text-rose-400">
                      {regErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      {showRegPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {regErrors.password ? (
                    <p id="reg-password-error" className="text-xs text-rose-600 dark:text-rose-400">
                      {regErrors.password}
                    </p>
                  ) : (
                    <p id="reg-password-hint" className="text-xs text-slate-400 dark:text-slate-500">
                      Mínimo de 6 caracteres
                    </p>
                  )}
                </div>

                {regFormError && (
                  <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
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
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">ou continue com</span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contas de demonstração</p>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                Ideal para conhecer a plataforma · senha: demo123
              </p>

              {demoLoading ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-32 rounded-full" />
                  ))}
                </div>
              ) : demoUsers.length > 0 ? (
                <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar]:w-1">
                  {demoUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleDemoLogin(u)}
                      disabled={demoBusyId !== null}
                      aria-label={`Entrar como ${u.name}`}
                      className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-4 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 disabled:cursor-wait disabled:opacity-60"
                    >
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" className="ring-0" />
                      <span className="max-w-36 truncate">{u.name}</span>
                      {demoBusyId === u.id && (
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin text-blue-700 dark:text-blue-300"
                          aria-hidden
                        />
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          </>
          )}

          {/* ----- Dialog: esqueci minha senha ----- */}
          <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Recuperar senha</DialogTitle>
                <DialogDescription>
                  Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
                </DialogDescription>
              </DialogHeader>

              {forgotResult ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      {forgotResult.delivery === 'email'
                        ? 'Enviamos um link de redefinição para o seu e-mail. Ele vale por 30 minutos.'
                        : 'Link de redefinição gerado (ambiente de demonstração, sem e-mail configurado).' }
                    </p>
                  </div>
                  {forgotResult.resetUrl && (
                    <Button onClick={() => openResetFromLink(forgotResult.resetUrl!)} className="w-full rounded-full">
                      <KeyRound className="h-4 w-4" /> Definir nova senha agora
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      E-mail da conta
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value)
                        if (forgotError) setForgotError(null)
                      }}
                      placeholder="voce@exemplo.com"
                      autoComplete="email"
                      className="h-11 rounded-xl"
                    />
                    {forgotError && (
                      <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        {forgotError}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    className="h-11 w-full rounded-full text-sm font-bold"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Enviando…
                      </>
                    ) : (
                      'Enviar link de redefinição'
                    )}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  )
}
