'use client'

// Painel de administração da plataforma — exclusivo para role=ADMIN.
// Segurança: a sessão admin (x-admin-token) é emitida no login (senha + MFA
// quando ativo) com validade de 12h. Sem token válido, nenhuma API responde.
// Abas: Visão geral · Pagamentos (Asaas) · Usuários · Cupons · Segurança (MFA) · Auditoria

import { useCallback, useEffect, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  BadgeCheck,
  Ban,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  CloudUpload,
  Copy,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  GraduationCap,
  HardDrive,
  KeyRound,
  Library,
  Loader2,
  Mail,
  QrCode,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  TicketPercent,
  TrendingUp,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { CATEGORIES, currencyBRL } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type {
  AdminCouponsResponseDTO,
  AdminPaymentsResponseDTO,
  AdminStatsDTO,
  AdminUserDTO,
  AdminUsersResponseDTO,
  AdminEmailDTO,
  AdminEmailsResponseDTO,
  AsaasSettingsDTO,
  PersistenceStatusDTO,
  PlatformCouponDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const PAYMENT_STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pendente', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900' },
  RECEIVED: { label: 'Recebido', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900' },
  CONFIRMED: { label: 'Confirmado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900' },
  OVERDUE: { label: 'Vencido', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900' },
  REFUNDED: { label: 'Estornado', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800' },
  CANCELED: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = PAYMENT_STATUS_META[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800' }
  return (
    <Badge variant="outline" className={cn('rounded-full text-[10px] font-bold', meta.cls)}>
      {meta.label}
    </Badge>
  )
}

/** 2.3 MB / 480 KB / 12 B */
function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

export function AdminPanel() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const token = user?.adminToken ?? ''

  const [tab, setTab] = useState('overview')

  // ---------- Visão geral ----------
  const [stats, setStats] = useState<AdminStatsDTO | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // ---------- Pagamentos ----------
  const [payments, setPayments] = useState<AdminPaymentsResponseDTO | null>(null)
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentsFilter, setPaymentsFilter] = useState('ALL')
  const [paymentsQuery, setPaymentsQuery] = useState('')
  const [busyPayment, setBusyPayment] = useState<string | null>(null)

  // ---------- Configuração do Asaas ----------
  const [asaas, setAsaas] = useState<AsaasSettingsDTO | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [envInput, setEnvInput] = useState<'sandbox' | 'production'>('sandbox')
  const [savingSettings, setSavingSettings] = useState(false)
  const [testing, setTesting] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEmail, setWebhookEmail] = useState(user?.email ?? '')
  const [creatingWebhook, setCreatingWebhook] = useState(false)

  // ---------- Usuários ----------
  const [users, setUsers] = useState<AdminUsersResponseDTO | null>(null)
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersQuery, setUsersQuery] = useState('')
  const [busyUser, setBusyUser] = useState<string | null>(null)

  // ---------- Segurança (MFA) ----------
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; uri: string; qrDataUrl: string } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [recoveryRemaining, setRecoveryRemaining] = useState<number | null>(null)
  const [regenPassword, setRegenPassword] = useState('')
  const [showRegen, setShowRegen] = useState(false)

  // ---------- Cupons de plataforma ----------
  const [coupons, setCoupons] = useState<AdminCouponsResponseDTO | null>(null)
  const [couponsLoading, setCouponsLoading] = useState(true)
  const [cpCode, setCpCode] = useState('')
  const [cpKind, setCpKind] = useState<'percent' | 'amount'>('percent')
  const [cpPercent, setCpPercent] = useState('')
  const [cpAmount, setCpAmount] = useState('')
  const [cpScope, setCpScope] = useState<'SITE_WIDE' | 'NEW_ACCOUNTS' | 'CATEGORY' | 'MENTOR'>('SITE_WIDE')
  const [cpCategory, setCpCategory] = useState<string>(CATEGORIES[0] ?? 'Tecnologia')
  const [cpMentorId, setCpMentorId] = useState('')
  const [cpMaxUses, setCpMaxUses] = useState('')
  const [cpExpires, setCpExpires] = useState('')
  const [cpPromoBar, setCpPromoBar] = useState(true)
  const [cpPromoMessage, setCpPromoMessage] = useState('')
  const [cpBusy, setCpBusy] = useState(false)
  const [busyCoupon, setBusyCoupon] = useState<string | null>(null)

  // ---------- Auditoria ----------
  const [auditLogs, setAuditLogs] = useState<{ logs: { id: string; actorName: string; action: string; meta: string; createdAt: string }[]; total: number } | null>(null)
  const [auditLoading, setAuditLoading] = useState(true)
  const [emails, setEmails] = useState<AdminEmailsResponseDTO | null>(null)
  const [emailsLoading, setEmailsLoading] = useState(true)
  const [emailPreview, setEmailPreview] = useState<AdminEmailDTO | null>(null)

  // ---------- Persistência (aba Dados) ----------
  const [persistence, setPersistence] = useState<PersistenceStatusDTO | null>(null)
  const [persistenceLoading, setPersistenceLoading] = useState(false)
  const [backupBusy, setBackupBusy] = useState(false)
  const [exportBusy, setExportBusy] = useState(false)
  const [restoringFile, setRestoringFile] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null)

  /** Sem token de sessão admin (login antigo ou expirado) — pede novo login */
  const needsRelogin = !token

  // ==================== Cargas ====================
  const loadStats = useCallback(() => {
    if (!token) return
    setStatsLoading(true)
    api.admin
      .stats(token)
      .then(setStats)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar números.'))
      .finally(() => setStatsLoading(false))
  }, [token])

  const loadPayments = useCallback(
    (filter = paymentsFilter, q = paymentsQuery) => {
      if (!token) return
      setPaymentsLoading(true)
      api.admin
        .payments(token, { status: filter, q: q || undefined })
        .then(setPayments)
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar cobranças.'))
        .finally(() => setPaymentsLoading(false))
    },
    [token, paymentsFilter, paymentsQuery]
  )

  const loadSettings = useCallback(() => {
    if (!token) return
    api.admin
      .settings(token)
      .then(({ asaas: s }) => {
        setAsaas(s)
        setEnvInput(s.env)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar configuração.'))
  }, [token])

  const loadUsers = useCallback(
    (q = usersQuery) => {
      if (!token) return
      setUsersLoading(true)
      api.admin
        .users(token, { q: q || undefined })
        .then(setUsers)
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar usuários.'))
        .finally(() => setUsersLoading(false))
    },
    [token, usersQuery]
  )

  const loadMfa = useCallback(() => {
    if (!token) return
    api.admin
      .mfaStatus(token)
      .then(({ mfaEnabled: enabled, recoveryCodesRemaining }) => {
        setMfaEnabled(enabled)
        setRecoveryRemaining(recoveryCodesRemaining)
      })
      .catch(() => setMfaEnabled(null))
  }, [token])

  const loadAudit = useCallback(() => {
    if (!token) return
    setAuditLoading(true)
    api.admin
      .audit(token)
      .then(setAuditLogs)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar auditoria.'))
      .finally(() => setAuditLoading(false))
  }, [token])

  const loadEmails = useCallback(() => {
    if (!token) return
    setEmailsLoading(true)
    api.admin
      .emails(token)
      .then(setEmails)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar e-mails.'))
      .finally(() => setEmailsLoading(false))
  }, [token])

  const loadCoupons = useCallback(() => {
    if (!token) return
    setCouponsLoading(true)
    api.admin
      .coupons(token)
      .then(setCoupons)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar cupons.'))
      .finally(() => setCouponsLoading(false))
  }, [token])

  const loadPersistence = useCallback(() => {
    if (!token) return
    setPersistenceLoading(true)
    api.admin
      .persistence(token)
      .then(setPersistence)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar persistência.'))
      .finally(() => setPersistenceLoading(false))
  }, [token])

  useEffect(() => {
    loadStats()
    loadSettings()
    loadMfa()
  }, [loadStats, loadSettings, loadMfa])
  useEffect(() => {
    if (tab === 'payments') loadPayments()
    if (tab === 'users') loadUsers()
    if (tab === 'coupons') loadCoupons()
    if (tab === 'security') loadMfa()
    if (tab === 'audit') loadAudit()
    if (tab === 'emails') loadEmails()
    if (tab === 'dados') loadPersistence()
  }, [tab])

  // ==================== Ações ====================
  /** Snapshot do banco agora (modo arquivo) */
  const createBackupNow = async () => {
    setBackupBusy(true)
    try {
      const res = await api.admin.createBackup(token)
      setPersistence(res)
      toast.success('Snapshot criado em /backups.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar o snapshot.')
    } finally {
      setBackupBusy(false)
    }
  }

  /** Restaura um snapshot (o estado atual é salvo automaticamente antes) */
  const restoreNow = async (file: string) => {
    setRestoringFile(file)
    try {
      const res = await api.admin.restoreBackup(token, file)
      setPersistence(res)
      toast.success(
        `Banco restaurado de ${res.restoredFrom}.${res.safetyBackup ? ` Estado anterior salvo como ${res.safetyBackup}.` : ''}`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível restaurar o snapshot.')
    } finally {
      setRestoringFile(null)
      setRestoreTarget(null)
    }
  }

  /** Exportação JSON completa (download autenticado) */
  const exportJsonNow = async () => {
    setExportBusy(true)
    try {
      await api.admin.exportJson(token)
      toast.success('Exportação completa baixada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha na exportação.')
    } finally {
      setExportBusy(false)
    }
  }
  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const { asaas: updated } = await api.admin.saveSettings(token, {
        apiKey: apiKeyInput || undefined,
        env: envInput,
      })
      setAsaas(updated)
      setApiKeyInput('')
      toast.success(
        updated.configured
          ? `Gateway Asaas ativo (${updated.env === 'production' ? 'PRODUÇÃO' : 'sandbox'}) ✅`
          : 'Configuração removida — modo demonstração ativo.'
      )
      loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSavingSettings(false)
    }
  }

  const removeSettings = async () => {
    setSavingSettings(true)
    try {
      const { asaas: updated } = await api.admin.removeSettings(token)
      setAsaas(updated)
      toast.info('Chave removida. A plataforma voltou ao modo demonstração.')
      loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover.')
    } finally {
      setSavingSettings(false)
    }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      const res = await api.admin.testConnection(token)
      if (res.ok) {
        toast.success(`Conectado ao Asaas (${res.env === 'production' ? 'produção' : 'sandbox'}) ✅`)
      } else {
        toast.error(`Falhou: ${res.error}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no teste.')
    } finally {
      setTesting(false)
    }
  }

  const createWebhook = async () => {
    setCreatingWebhook(true)
    try {
      const res = await api.admin.createWebhook(token, webhookUrl.trim(), webhookEmail.trim())
      if (res.ok) {
        setAsaas(res.asaas)
        toast.success('Webhook criado no Asaas! Pagamentos cairão automaticamente.')
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar o webhook.')
    } finally {
      setCreatingWebhook(false)
    }
  }

  const loadCouponsAfter = () => loadCoupons()

  const createCouponAction = async () => {
    if (!token || cpBusy) return
    const code = cpCode.trim().toUpperCase()
    if (!code) {
      toast.error('Informe o código do cupom.')
      return
    }
    const percentOff = cpKind === 'percent' && cpPercent.trim() ? Number(cpPercent) : null
    const amountOff = cpKind === 'amount' && cpAmount.trim() ? Number(cpAmount.replace(',', '.')) : null
    if (!percentOff && !amountOff) {
      toast.error('Informe o valor do desconto.')
      return
    }
    setCpBusy(true)
    try {
      const created = await api.admin.createCoupon(token, {
        code,
        percentOff,
        amountOff,
        scope: cpScope,
        category: cpScope === 'CATEGORY' ? cpCategory : undefined,
        mentorId: cpScope === 'MENTOR' ? cpMentorId : undefined,
        maxUses: cpMaxUses.trim() ? Number(cpMaxUses) : null,
        expiresAt: cpExpires ? new Date(`${cpExpires}T23:59:59`).toISOString() : null,
        showInPromoBar: cpPromoBar,
        promoMessage: cpPromoMessage.trim() || null,
      })
      toast.success(`Cupom ${created.coupon.code} criado!`)
      setCpCode('')
      setCpPercent('')
      setCpAmount('')
      setCpMaxUses('')
      setCpExpires('')
      setCpPromoMessage('')
      loadCouponsAfter()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar cupom.')
    } finally {
      setCpBusy(false)
    }
  }

  const toggleCoupon = async (c: PlatformCouponDTO, patch: { isActive?: boolean; showInPromoBar?: boolean }) => {
    setBusyCoupon(`${c.id}:${Object.keys(patch).join(',')}`)
    try {
      await api.admin.updateCoupon(token, { id: c.id, ...patch })
      loadCouponsAfter()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cupom.')
    } finally {
      setBusyCoupon(null)
    }
  }

  const deleteCouponAction = async (c: PlatformCouponDTO) => {
    if (!window.confirm(`Remover o cupom ${c.code}? Esta ação não pode ser desfeita.`)) return
    setBusyCoupon(`${c.id}:del`)
    try {
      await api.admin.deleteCoupon(token, c.id)
      toast.success(`Cupom ${c.code} removido.`)
      loadCouponsAfter()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover cupom.')
    } finally {
      setBusyCoupon(null)
    }
  }

  const paymentAction = async (paymentId: string, action: 'confirm_asaas' | 'sync' | 'cancel' | 'refund') => {
    setBusyPayment(paymentId + action)
    try {
      const res = await api.admin.paymentAction(token, { paymentId, action })
      if (action === 'confirm_asaas' || (action === 'sync' && res.fulfilled)) {
        toast.success('Pagamento confirmado e acesso liberado! 🎉')
      } else if (action === 'sync') {
        toast.info(`Status sincronizado: ${String(res.status)}`)
      } else if (action === 'refund') {
        toast.success('Pagamento estornado e acesso revogado.')
      } else {
        toast.success('Cobrança cancelada.')
      }
      loadPayments()
      loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na ação.')
    } finally {
      setBusyPayment(null)
    }
  }

  const userAction = async (targetId: string, action: 'promote' | 'demote' | 'block' | 'unblock') => {
    setBusyUser(targetId + action)
    try {
      await api.admin.userAction(token, { userId: targetId, action })
      toast.success({
        promote: 'Usuário promovido a ADMIN.',
        demote: 'Usuário rebaixado para USER.',
        block: 'Usuário bloqueado.',
        unblock: 'Usuário desbloqueado.',
      }[action])
      loadUsers()
      loadStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na ação.')
    } finally {
      setBusyUser(null)
    }
  }

  // ---------- MFA ----------
  const startMfaSetup = async () => {
    setMfaBusy(true)
    try {
      const setup = await api.admin.mfaSetup(token)
      setMfaSetup(setup)
      setMfaCode('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar o QR.')
    } finally {
      setMfaBusy(false)
    }
  }

  const confirmMfa = async (code?: string) => {
    const value = (code ?? mfaCode).replace(/\D/g, '')
    if (!mfaSetup || value.length !== 6 || mfaBusy) return
    setMfaBusy(true)
    try {
      const result = await api.admin.mfaEnable(token, value)
      setMfaEnabled(true)
      setMfaSetup(null)
      setMfaCode('')
      setRecoveryCodes(result.recoveryCodes)
      setRecoveryRemaining(result.recoveryCodes.length)
      toast.success('MFA ativado! Guarde os códigos de recuperação 🔐')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Código inválido.')
      setMfaCode('')
    } finally {
      setMfaBusy(false)
    }
  }

  const regenerateCodes = async () => {
    if (!regenPassword || mfaBusy) return
    setMfaBusy(true)
    try {
      const result = await api.admin.mfaRegenerateCodes(token, regenPassword)
      setRecoveryCodes(result.recoveryCodes)
      setRecoveryRemaining(result.recoveryCodes.length)
      setRegenPassword('')
      setShowRegen(false)
      toast.success('Novos códigos gerados — os antigos deixaram de valer.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Senha incorreta.')
    } finally {
      setMfaBusy(false)
    }
  }

  const disableMfa = async () => {
    if (!disablePassword || mfaBusy) return
    setMfaBusy(true)
    try {
      await api.admin.mfaDisable(token, disablePassword)
      setMfaEnabled(false)
      setDisablePassword('')
      toast.info('MFA desativado. Recomendamos reativar o quanto antes.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Senha incorreta.')
    } finally {
      setMfaBusy(false)
    }
  }

  // ---------- Sem sessão admin ----------
  if (needsRelogin) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
              <ShieldAlert className="h-7 w-7" aria-hidden />
            </span>
            <h1 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-slate-50">
              Sessão administrativa necessária
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Faça login novamente com a sua conta admin para acessar o painel. Se o MFA estiver
              ativo, o código será pedido na hora.
            </p>
            <Button onClick={() => navigate({ name: 'auth', mode: 'login' })} className="mt-6 h-11 rounded-full px-8 font-bold">
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-blue-300 dark:bg-blue-950/60">
          <ShieldCheck className="h-5.5 w-5.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Administração da plataforma
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Logado como {user?.name} · sessão segura de 12h
            {mfaEnabled === false && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <ShieldAlert className="h-3 w-3" aria-hidden /> MFA inativo
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate({ name: 'home' })} className="rounded-full">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
        </Button>
      </div>

      {/* Aviso de MFA inativo */}
      {mfaEnabled === false && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
          <ShieldAlert aria-hidden className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            Sua conta admin está <strong>sem MFA</strong>. Ative o segundo fator na aba Segurança — é
            o que protege o dinheiro da plataforma.
          </span>
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setTab('security')}>
            Ativar agora
          </Button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 sm:grid sm:grid-cols-6">
          <TabsTrigger value="overview" className="rounded-xl text-xs font-bold sm:text-sm">
            <TrendingUp className="h-4 w-4" aria-hidden /> Visão geral
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl text-xs font-bold sm:text-sm">
            <CreditCard className="h-4 w-4" aria-hidden /> Pagamentos
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl text-xs font-bold sm:text-sm">
            <Users className="h-4 w-4" aria-hidden /> Usuários
          </TabsTrigger>
          <TabsTrigger value="coupons" className="rounded-xl text-xs font-bold sm:text-sm">
            <TicketPercent className="h-4 w-4" aria-hidden /> Cupons
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl text-xs font-bold sm:text-sm">
            <KeyRound className="h-4 w-4" aria-hidden /> Segurança
          </TabsTrigger>
          <TabsTrigger value="audit" className="rounded-xl text-xs font-bold sm:text-sm">
            <BadgeCheck className="h-4 w-4" aria-hidden /> Auditoria
          </TabsTrigger>
          <TabsTrigger value="emails" className="rounded-xl text-xs font-bold sm:text-sm">
            <Mail className="h-4 w-4" aria-hidden /> E-mails
          </TabsTrigger>
          <TabsTrigger value="dados" className="rounded-xl text-xs font-bold sm:text-sm">
            <Database className="h-4 w-4" aria-hidden /> Dados
          </TabsTrigger>
        </TabsList>

        {/* ==================== VISÃO GERAL ==================== */}
        <TabsContent value="overview" className="mt-5">
          {statsLoading || !stats ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Usuários', value: String(stats.totals.users), icon: Users },
                  { label: 'Mentores', value: String(stats.totals.mentors), icon: GraduationCap },
                  { label: 'Cursos', value: String(stats.totals.courses), icon: BookOpen },
                  { label: 'Trilhas', value: String(stats.totals.tracks), icon: Route },
                  {
                    label: 'Receita (paga)',
                    value: currencyBRL(stats.revenue.totalCents / 100),
                    icon: ShoppingBag,
                  },
                  {
                    label: 'Últimos 30 dias',
                    value: currencyBRL(stats.revenue.last30dCents / 100),
                    icon: TrendingUp,
                  },
                  { label: 'Cobranças pendentes', value: String(stats.totals.paymentsPending), icon: Clock },
                  { label: 'Biblioteca', value: String(stats.totals.libraryItems), icon: Library },
                ].map(({ label, value, icon: Icon }) => (
                  <Card key={label} className="rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <Icon aria-hidden className="h-4 w-4" />
                        <span className="truncate text-[11px] font-bold uppercase tracking-wide">{label}</span>
                      </div>
                      <p className="mt-1.5 truncate text-xl font-extrabold text-slate-900 dark:text-slate-50">
                        {value}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Status do gateway + últimas cobranças */}
              <Card className="mt-5 rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Gateway de pagamentos
                    </h2>
                    {stats.asaas.configured ? (
                      <Badge className="rounded-full bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300">
                        Asaas · {stats.asaas.env === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                        Modo demonstração
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {stats.asaas.configured
                      ? `Cobranças reais ativas via Asaas${stats.asaas.webhookConfigured ? ' · webhook configurado (confirmação automática)' : ' · webhook não configurado (use "Verificar status" / confirmação manual)'}.`
                      : 'Nenhuma chave configurada — os pedidos são marcados como SIMULADO e aprovados na hora. Configure na aba Pagamentos.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="mt-4 rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Últimas cobranças
                  </h2>
                  <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.recentPayments.map((p) => (
                      <li key={p.id} className="flex items-center gap-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {p.itemTitle}
                          </p>
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                            {p.userName} · {new Date(p.createdAt).toLocaleDateString('pt-BR')} ·{' '}
                            {p.gateway === 'ASAAS' ? 'Asaas' : 'Simulado'}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {currencyBRL(p.value)}
                        </span>
                      </li>
                    ))}
                    {stats.recentPayments.length === 0 && (
                      <li className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                        Nenhuma cobrança ainda.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ==================== PAGAMENTOS ==================== */}
        <TabsContent value="payments" className="mt-5 space-y-4">
          {/* Configuração do Asaas */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Configuração do Asaas
                </h2>
                {asaas?.configured && (
                  <Badge className="rounded-full bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300">
                    {asaas.env === 'production' ? 'PRODUÇÃO' : 'SANDBOX'} · {asaas.maskedKey}
                  </Badge>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="asaas-key" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Chave de API {asaas?.configured ? '(deixe vazio para manter a atual)' : 'do sandbox'}
                  </Label>
                  <Input
                    id="asaas-key"
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={asaas?.configured ? `Atual: ${asaas.maskedKey}` : 'Cole aqui a chave do sandbox…'}
                    autoComplete="off"
                    className="mt-1.5 h-10 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Ambiente</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={envInput === 'sandbox' ? 'default' : 'outline'}
                      onClick={() => setEnvInput('sandbox')}
                      className="h-10 rounded-xl font-bold"
                    >
                      Sandbox
                    </Button>
                    <Button
                      type="button"
                      variant={envInput === 'production' ? 'default' : 'outline'}
                      onClick={() => setEnvInput('production')}
                      className="h-10 rounded-xl font-bold"
                    >
                      Produção
                    </Button>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => void saveSettings()} disabled={savingSettings} className="h-10 flex-1 rounded-xl font-bold">
                    {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Salvar'}
                  </Button>
                  <Button onClick={() => void testConnection()} disabled={testing || !asaas?.configured} variant="outline" className="h-10 flex-1 rounded-xl font-bold">
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Testar conexão'}
                  </Button>
                  {asaas?.configured && (
                    <Button onClick={() => void removeSettings()} disabled={savingSettings} variant="ghost" className="h-10 rounded-xl text-rose-600 dark:text-rose-400">
                      <X aria-hidden className="h-4 w-4" />
                      <span className="sr-only">Remover configuração</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Webhook */}
              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Webhook de confirmação automática{' '}
                    {asaas?.webhookConfigured ? (
                      <CheckCircle2 aria-hidden className="inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="font-normal text-slate-400 dark:text-slate-500">(não configurado)</span>
                    )}
                  </p>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                  Cole a URL pública da plataforma (ex.: <code>https://seudominio.com/api/webhooks/asaas</code>).
                  Em ambiente local o Asaas não alcança o servidor — use &quot;Verificar status&quot; ou a
                  confirmação manual abaixo. Em produção o webhook confirma tudo sozinho.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://…/api/webhooks/asaas"
                    type="url"
                    className="h-10 flex-1 rounded-xl"
                  />
                  <Button onClick={() => void createWebhook()} disabled={creatingWebhook || !webhookUrl.trim()} className="h-10 rounded-xl font-bold">
                    {creatingWebhook ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Criar webhook'}
                  </Button>
                </div>
                <div className="mt-2">
                  <Input
                    value={webhookEmail}
                    onChange={(e) => setWebhookEmail(e.target.value)}
                    placeholder="E-mail de contato do webhook"
                    type="email"
                    aria-label="E-mail de contato do webhook"
                    className="h-10 rounded-xl"
                  />
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                    O Asaas exige um e-mail de contato do webhook (comunicações de falha) — já preenchemos com o seu e-mail de admin.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de cobranças */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Cobranças {payments ? `(${payments.total})` : ''}
                </h2>
                <div className="ml-auto flex flex-1 flex-wrap items-center gap-2 sm:flex-none">
                  <div className="relative min-w-44 flex-1 sm:w-56">
                    <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={paymentsQuery}
                      onChange={(e) => setPaymentsQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadPayments(paymentsFilter, paymentsQuery)}
                      placeholder="Buscar aluno ou id…"
                      className="h-9 rounded-full pl-9"
                    />
                  </div>
                  <select
                    value={paymentsFilter}
                    onChange={(e) => {
                      setPaymentsFilter(e.target.value)
                      loadPayments(e.target.value, paymentsQuery)
                    }}
                    aria-label="Filtrar por status"
                    className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    <option value="ALL">Todos</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="RECEIVED">Recebidos</option>
                    <option value="CONFIRMED">Confirmados</option>
                    <option value="OVERDUE">Vencidos</option>
                  </select>
                  <Button variant="ghost" size="sm" className="h-9 rounded-full" onClick={() => loadPayments()} aria-label="Recarregar">
                    <RefreshCw className={cn('h-4 w-4', paymentsLoading && 'animate-spin')} aria-hidden />
                  </Button>
                </div>
              </div>

              {paymentsLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {payments?.payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {p.itemTitle}
                        </p>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                          {p.userName} · {new Date(p.createdAt).toLocaleDateString('pt-BR')}{' '}
                          {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ·{' '}
                          {p.gateway === 'ASAAS' ? `Asaas ${p.billingType}` : 'Simulado'}
                          {p.lastEvent ? ` · ${p.lastEvent}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={p.status} />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {currencyBRL(p.value)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {p.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full"
                            onClick={() => window.open(p.invoiceUrl!, '_blank', 'noopener')}
                            aria-label="Abrir fatura no Asaas"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        )}
                        {p.gateway === 'ASAAS' && p.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full text-xs font-bold"
                              disabled={busyPayment !== null}
                              onClick={() => void paymentAction(p.id, 'confirm_asaas')}
                            >
                              {busyPayment === p.id + 'confirm_asaas' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                'Confirmar'
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-full text-xs font-bold"
                              disabled={busyPayment !== null}
                              onClick={() => void paymentAction(p.id, 'sync')}
                            >
                              {busyPayment === p.id + 'sync' ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                'Verificar status'
                              )}
                            </Button>
                          </>
                        )}
                        {p.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full text-rose-600 dark:text-rose-400"
                            disabled={busyPayment !== null}
                            onClick={() => void paymentAction(p.id, 'cancel')}
                            aria-label="Cancelar cobrança"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        )}
                        {p.status === 'RECEIVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full text-rose-600 dark:text-rose-400"
                            disabled={busyPayment !== null}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Estornar ${p.itemTitle}? O dinheiro volta e o acesso é revogado.`
                                )
                              ) {
                                void paymentAction(p.id, 'refund')
                              }
                            }}
                            aria-label="Estornar pagamento"
                          >
                            Estornar
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                  {payments?.payments.length === 0 && (
                    <li className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      Nenhuma cobrança encontrada com esse filtro.
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== USUÁRIOS ==================== */}
        <TabsContent value="users" className="mt-5">
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Usuários {users ? `(${users.total})` : ''}
                </h2>
                <div className="relative ml-auto w-full sm:w-64">
                  <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={usersQuery}
                    onChange={(e) => setUsersQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers(usersQuery)}
                    placeholder="Buscar por nome ou e-mail…"
                    className="h-9 rounded-full pl-9"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {users?.users.map((u) => (
                    <li key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                      <Avatar name={u.name} src={undefined} size="sm" className="ring-0" />
                      <div className="min-w-0 flex-1 basis-52">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {u.name}
                          </p>
                          {u.role === 'ADMIN' && (
                            <Badge className="rounded-full bg-slate-950 text-blue-300 hover:bg-slate-950 dark:bg-blue-950/60 dark:text-blue-300">
                              ADMIN
                            </Badge>
                          )}
                          {u.blocked && (
                            <Badge variant="outline" className="rounded-full border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                              Bloqueado
                            </Badge>
                          )}
                          {u.isMentor && (
                            <Badge variant="secondary" className="rounded-full text-[10px]">
                              Mentor
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                          {u.email} · {u.enrollments} matrículas · {u.orders} pedidos · desde{' '}
                          {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {u.id !== user?.id && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.role === 'ADMIN' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-full text-xs font-bold"
                              disabled={busyUser !== null}
                              onClick={() => void userAction(u.id, 'demote')}
                            >
                              {busyUser === u.id + 'demote' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : 'Rebaixar'}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full text-xs font-bold"
                              disabled={busyUser !== null}
                              onClick={() => void userAction(u.id, 'promote')}
                            >
                              <UserCog className="h-3.5 w-3.5" aria-hidden />
                              Promover a admin
                            </Button>
                          )}
                          {u.blocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full text-xs font-bold"
                              disabled={busyUser !== null}
                              onClick={() => void userAction(u.id, 'unblock')}
                            >
                              <Check className="h-3.5 w-3.5" aria-hidden />
                              Desbloquear
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-full text-rose-600 dark:text-rose-400"
                              disabled={busyUser !== null}
                              onClick={() => void userAction(u.id, 'block')}
                            >
                              <Ban className="h-3.5 w-3.5" aria-hidden />
                              Bloquear
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                  {users?.users.length === 0 && (
                    <li className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      Nenhum usuário encontrado.
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CUPONS (plataforma + barra promocional) ==================== */}
        <TabsContent value="coupons" className="mt-5 space-y-4">
          {/* Criar cupom */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Criar cupom
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0">
                  <Label htmlFor="cp-code" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Código
                  </Label>
                  <Input
                    id="cp-code"
                    value={cpCode}
                    onChange={(e) => setCpCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    placeholder="BEMVINDO10"
                    className="mt-1 h-10 rounded-xl font-mono uppercase"
                    maxLength={24}
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="cp-kind" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Desconto
                  </Label>
                  <select
                    id="cp-kind"
                    value={cpKind}
                    onChange={(e) => setCpKind(e.target.value as 'percent' | 'amount')}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="amount">Valor fixo (R$)</option>
                  </select>
                </div>
                <div className="min-w-0">
                  <Label htmlFor="cp-value" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Valor {cpKind === 'percent' ? '(%)' : '(R$)'}
                  </Label>
                  <Input
                    id="cp-value"
                    type="number"
                    min="1"
                    max={cpKind === 'percent' ? 100 : undefined}
                    step={cpKind === 'percent' ? 1 : 0.01}
                    value={cpKind === 'percent' ? cpPercent : cpAmount}
                    onChange={(e) => (cpKind === 'percent' ? setCpPercent(e.target.value) : setCpAmount(e.target.value))}
                    placeholder={cpKind === 'percent' ? '10' : '50.00'}
                    className="mt-1 h-10 rounded-xl"
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="cp-scope" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Onde vale
                  </Label>
                  <select
                    id="cp-scope"
                    value={cpScope}
                    onChange={(e) => setCpScope(e.target.value as typeof cpScope)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <option value="SITE_WIDE">Site inteiro</option>
                    <option value="NEW_ACCOUNTS">Só contas novas (1ª compra)</option>
                    <option value="CATEGORY">Categoria específica</option>
                    <option value="MENTOR">Mentor específico</option>
                  </select>
                </div>

                {cpScope === 'CATEGORY' && (
                  <div className="min-w-0">
                    <Label htmlFor="cp-category" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Categoria
                    </Label>
                    <select
                      id="cp-category"
                      value={cpCategory}
                      onChange={(e) => setCpCategory(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {cpScope === 'MENTOR' && (
                  <div className="min-w-0 sm:col-span-2">
                    <Label htmlFor="cp-mentor" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Mentor
                    </Label>
                    <select
                      id="cp-mentor"
                      value={cpMentorId}
                      onChange={(e) => setCpMentorId(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <option value="">Escolha o mentor…</option>
                      {(coupons?.mentors ?? []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="min-w-0">
                  <Label htmlFor="cp-maxuses" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Usos máximos
                  </Label>
                  <Input
                    id="cp-maxuses"
                    type="number"
                    min="1"
                    value={cpMaxUses}
                    onChange={(e) => setCpMaxUses(e.target.value)}
                    placeholder="ilimitado"
                    className="mt-1 h-10 rounded-xl"
                  />
                </div>
                <div className="min-w-0">
                  <Label htmlFor="cp-expires" className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Validade
                  </Label>
                  <Input
                    id="cp-expires"
                    type="date"
                    value={cpExpires}
                    onChange={(e) => setCpExpires(e.target.value)}
                    className="mt-1 h-10 rounded-xl"
                  />
                </div>
              </div>

              {/* Barra promocional */}
              <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-3">
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={cpPromoBar}
                    onChange={(e) => setCpPromoBar(e.target.checked)}
                    className="h-4 w-4 accent-blue-700"
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Mostrar na barra promocional rotativa (topo do site)
                  </span>
                </label>
                {cpPromoBar && (
                  <div className="mt-2">
                    <Input
                      value={cpPromoMessage}
                      onChange={(e) => setCpPromoMessage(e.target.value)}
                      placeholder={
                        cpKind === 'percent'
                          ? `Mensagem personalizada (ex.: Semana de lançamento — ${cpPercent || 'X'}% OFF em tudo)`
                          : 'Mensagem personalizada (opcional — geramos uma automática)'
                      }
                      maxLength={140}
                      className="h-10 rounded-xl"
                    />
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      O visitante copia o código com um clique, direto na barra.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => void createCouponAction()}
                  disabled={cpBusy || !cpCode.trim()}
                  className="h-11 rounded-xl px-6 font-semibold"
                >
                  {cpBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Criar cupom'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de cupons */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Cupons da plataforma {coupons ? `(${coupons.coupons.length})` : ''}
              </h2>

              {couponsLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl" />
                  ))}
                </div>
              ) : (coupons?.coupons.length ?? 0) === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum cupom de plataforma ainda — crie o primeiro acima. Cupons criados por mentores
                  continuam valendo apenas nos itens deles.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {coupons!.coupons.map((c) => {
                    const expired = c.expiresAt ? new Date(c.expiresAt).getTime() < Date.now() : false
                    const exhausted = c.maxUses !== null && c.uses >= c.maxUses
                    const busy =
                      busyCoupon === `${c.id}:isActive` ||
                      busyCoupon === `${c.id}:showInPromoBar` ||
                      busyCoupon === `${c.id}:del`
                    const status = !c.isActive
                      ? { label: 'Pausado', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800' }
                      : expired
                        ? { label: 'Expirado', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900' }
                        : exhausted
                          ? { label: 'Esgotado', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900' }
                          : { label: 'Ativo', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900' }
                    return (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold tracking-wide text-slate-900 dark:text-slate-50">
                              {c.code}
                            </span>
                            <Badge variant="outline" className={cn('rounded-full text-[10px] font-bold', status.cls)}>
                              {status.label}
                            </Badge>
                            {c.showInPromoBar && c.isActive && !expired && !exhausted && (
                              <Badge className="rounded-full bg-slate-950 text-white text-[10px] font-bold dark:bg-white dark:text-slate-950">
                                na barra promocional
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {c.percentOff !== null ? `${c.percentOff}% OFF` : `${currencyBRL(c.amountOff ?? 0)} OFF`}
                            {' · '}
                            {c.scope === 'SITE_WIDE' && 'site inteiro'}
                            {c.scope === 'NEW_ACCOUNTS' && 'só contas novas (1ª compra)'}
                            {c.scope === 'CATEGORY' && `categoria ${c.category}`}
                            {c.scope === 'MENTOR' && `mentor ${c.mentorName ?? '—'}`}
                            {` · ${c.uses}/${c.maxUses ?? '∞'} usos`}
                            {c.expiresAt && ` · até ${new Date(c.expiresAt).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void toggleCoupon(c, { showInPromoBar: !c.showInPromoBar })}
                            className="h-9 rounded-full text-xs"
                          >
                            <TicketPercent className="h-3.5 w-3.5" aria-hidden />
                            {c.showInPromoBar ? 'Tirar da barra' : 'Pôr na barra'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void toggleCoupon(c, { isActive: !c.isActive })}
                            className="h-9 rounded-full text-xs"
                          >
                            {c.isActive ? 'Pausar' : 'Ativar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void deleteCouponAction(c)}
                            className="h-9 rounded-full text-rose-600 dark:text-rose-400"
                          >
                            <X aria-hidden className="h-4 w-4" />
                            <span className="sr-only">Remover {c.code}</span>
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SEGURANÇA (MFA) ==================== */}
        <TabsContent value="security" className="mt-5">
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck aria-hidden className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Autenticação em duas etapas (TOTP)
                </h2>
              </div>

              {mfaEnabled === null ? (
                <Skeleton className="mt-4 h-24 rounded-2xl" />
              ) : mfaEnabled ? (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                    <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" />
                    MFA <strong>ativo</strong> — todo login desta conta pede o código do app
                    autenticador. Sessões administrativas duram 12h.
                  </div>

                  {/* Códigos de recuperação recém-gerados (exibição única) */}
                  {recoveryCodes && (
                    <div className="rounded-xl border border-blue-300 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 p-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-200">
                        <KeyRound aria-hidden className="h-4 w-4 shrink-0" />
                        Guarde seus códigos de recuperação agora
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                        Estes códigos só são exibidos <strong>uma única vez</strong>. Se perder o
                        app autenticador, use um deles na tela de login (cada código funciona uma
                        única vez).
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                        {recoveryCodes.map((code) => (
                          <code
                            key={code}
                            className="rounded-lg border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-950/60 px-2 py-1.5 text-center font-mono text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200"
                          >
                            {code}
                          </code>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full font-bold"
                          onClick={() => {
                            void navigator.clipboard.writeText(recoveryCodes.join('\n'))
                            toast.success('Códigos copiados!')
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                          Copiar todos
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 rounded-full font-bold"
                          onClick={() => setRecoveryCodes(null)}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          Já guardei os códigos
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Status dos códigos + regeneração */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <span className="font-bold">
                          {recoveryRemaining ?? '—'} códigos de recuperação
                        </span>{' '}
                        disponíveis (uso único, no lugar do TOTP).
                      </div>
                      {!showRegen && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 rounded-full font-bold"
                          onClick={() => setShowRegen(true)}
                        >
                          <KeyRound className="h-3.5 w-3.5" aria-hidden />
                          Gerar novos códigos
                        </Button>
                      )}
                    </div>
                    {showRegen && (
                      <div className="mt-3 max-w-sm">
                        <Label
                          htmlFor="mfa-regen-pass"
                          className="text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          Confirme sua senha para gerar um lote novo (os antigos deixam de valer)
                        </Label>
                        <div className="mt-1.5 flex gap-2">
                          <Input
                            id="mfa-regen-pass"
                            type="password"
                            value={regenPassword}
                            onChange={(e) => setRegenPassword(e.target.value)}
                            placeholder="Sua senha"
                            autoComplete="current-password"
                            className="h-10 flex-1 rounded-xl"
                          />
                          <Button
                            variant="outline"
                            onClick={() => void regenerateCodes()}
                            disabled={mfaBusy || !regenPassword}
                            className="h-10 rounded-xl font-bold"
                          >
                            {mfaBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              'Gerar'
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setShowRegen(false)
                              setRegenPassword('')
                            }}
                            className="h-10 rounded-xl"
                          >
                            <X className="h-4 w-4" aria-hidden />
                            <span className="sr-only">Cancelar</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="max-w-sm">
                    <Label htmlFor="mfa-disable-pass" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Desativar MFA (exige sua senha)
                    </Label>
                    <div className="mt-1.5 flex gap-2">
                      <Input
                        id="mfa-disable-pass"
                        type="password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Sua senha"
                        autoComplete="current-password"
                        className="h-10 flex-1 rounded-xl"
                      />
                      <Button
                        variant="outline"
                        onClick={() => void disableMfa()}
                        disabled={mfaBusy || !disablePassword}
                        className="h-10 rounded-xl font-bold text-rose-600 dark:text-rose-400"
                      >
                        {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Desativar'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : mfaSetup ? (
                <div className="mt-4 grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <strong>1.</strong> Abra o app autenticador (Google Authenticator, Authy,
                      Microsoft Authenticator…) e escaneie o QR Code.
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <strong>2.</strong> Digite o código de 6 dígitos que aparece no app para
                      confirmar e ativar.
                    </p>
                    <div>
                      <InputOTP
                        maxLength={6}
                        value={mfaCode}
                        onChange={(v) => {
                          setMfaCode(v)
                          if (v.length === 6) void confirmMfa(v)
                        }}
                        disabled={mfaBusy}
                      >
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="h-12 w-11 rounded-lg border-slate-300 text-lg font-bold dark:border-slate-700" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {mfaBusy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden />}
                    <button
                      type="button"
                      onClick={() => setMfaSetup(null)}
                      className="block text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline dark:text-slate-500"
                    >
                      Cancelar configuração
                    </button>
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    { }
                    <img src={mfaSetup.qrDataUrl} alt="QR Code de configuração do MFA" className="h-44 w-44" />
                    <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                      Não dá para escanear? Use a chave no app:
                    </p>
                    <div className="flex w-full items-center gap-1.5">
                      <code className="min-w-0 flex-1 truncate rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-2 py-1 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                        {mfaSetup.secret}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 shrink-0 rounded-md p-0"
                        onClick={() => {
                          void navigator.clipboard.writeText(mfaSetup.secret)
                          toast.success('Chave copiada!')
                        }}
                        aria-label="Copiar chave secreta"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <p className="max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    O MFA protege o painel que controla pagamentos e usuários: mesmo com a senha
                    vazada, o invasor precisaria do código do seu app autenticador. A ativação leva
                    menos de um minuto.
                  </p>
                  <Button onClick={() => void startMfaSetup()} disabled={mfaBusy} className="h-11 rounded-full px-6 font-bold">
                    {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <QrCode className="h-4 w-4" aria-hidden />}
                    Ativar MFA agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== AUDITORIA ==================== */}
        <TabsContent value="audit" className="mt-5">
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Trilha de auditoria {auditLogs ? `(${auditLogs.total})` : ''}
              </h2>
              {auditLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : (
                <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800 [scrollbar-width:thin]">
                  {auditLogs?.logs.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 py-2.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {l.action}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {l.actorName}
                        </p>
                        {l.meta && l.meta !== '{}' && (
                          <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{l.meta}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(l.createdAt).toLocaleDateString('pt-BR')}{' '}
                        {new Date(l.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                  {auditLogs?.logs.length === 0 && (
                    <li className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      Nenhuma ação registrada ainda.
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== E-MAILS (OUTBOX) ==================== */}
        <TabsContent value="emails" className="mt-5">
          <Card className="rounded-2xl">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  E-mails transacionais {emails ? `(${emails.total})` : ''}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    emails?.smtpConfigured
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {emails?.smtpConfigured ? 'SMTP configurado — entrega ativa' : 'Sem SMTP — modo fila (outbox)'}
                </span>
              </div>
              {emailsLoading ? (
                <div className="mt-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : (
                <ul className="mt-3 max-h-[28rem] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800 [scrollbar-width:thin]">
                  {emails?.emails.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          m.status === 'SENT'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : m.status === 'LOGGED'
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                              : m.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {m.status}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {m.subject}
                        </p>
                        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                          {m.to} · {m.kind}
                          {m.error ? ` · ${m.error}` : ''}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString('pt-BR')}{' '}
                        {new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Button variant="outline" size="sm" className="h-7 shrink-0 rounded-full text-[11px]" onClick={() => setEmailPreview(m)}>
                        Ver
                      </Button>
                    </li>
                  ))}
                  {emails?.emails.length === 0 && (
                    <li className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      Nenhum e-mail na fila ainda.
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DADOS (PERSISTÊNCIA) ==================== */}
        <TabsContent value="dados" className="mt-5">
          <div className="flex flex-col gap-4">
            {/* Status do banco */}
            <Card className="rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Persistência dos dados
                  </h2>
                  {persistence ? (
                    persistence.mode === 'turso' ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        Nuvem (Turso) — protege contra atualizações
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Arquivo local
                      </span>
                    )
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Camadas de proteção: snapshots automáticos do banco (boot + a cada 6h + antes de cada
                  mudança de schema), exportação JSON completa e opção de banco na nuvem (Turso). O
                  <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">db:push</code>
                  nunca mais roda com <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">--accept-data-loss</code> —
                  mudanças destrutivas falham com explicação em vez de apagar dados.
                </p>
                {persistenceLoading ? (
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                ) : persistence ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <HardDrive className="h-3.5 w-3.5" aria-hidden /> Banco atual
                      </p>
                      {persistence.mode === 'turso' ? (
                        <p className="mt-1.5 text-sm font-semibold text-blue-700 dark:text-blue-400">
                          Turso/libSQL na nuvem (TURSO_DATABASE_URL)
                        </p>
                      ) : (
                        <>
                          <p className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {persistence.dbPath ?? 'db/custom.db'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatBytes(persistence.dbSizeBytes)}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <Archive className="h-3.5 w-3.5" aria-hidden /> Snapshots
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {persistence.mode === 'turso'
                          ? 'Nuvem não precisa de snapshot de arquivo'
                          : `${persistence.backups.length} em /backups`}
                      </p>
                      {persistence.backups[0] ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Último: {persistence.backups[0].file.replace(/^db-|--\w+\.db$/g, '')} ·{' '}
                          {formatBytes(persistence.backups[0].sizeBytes)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* Caminho para a nuvem quando em modo local */}
                {persistence?.mode === 'local' ? (
                  <div className="mt-4 flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900 dark:bg-blue-950/40 sm:flex-row sm:items-center">
                    <CloudUpload className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                      <strong>Proteção máxima:</strong> crie um banco gratuito em turso.tech, defina{' '}
                      <code className="rounded bg-white/70 px-1 dark:bg-slate-900/70">TURSO_DATABASE_URL</code> e{' '}
                      <code className="rounded bg-white/70 px-1 dark:bg-slate-900/70">TURSO_AUTH_TOKEN</code> no
                      ambiente e rode{' '}
                      <code className="rounded bg-white/70 px-1 dark:bg-slate-900/70">bun run db:to-turso</code>. Aí
                      nem uma atualização de código apaga dados — eles vivem fora deste servidor.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Snapshots (modo arquivo) */}
            {persistence?.mode === 'local' ? (
              <Card className="rounded-2xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Backups do banco
                    </h2>
                    <Button
                      size="sm"
                      className="h-9 rounded-full font-semibold"
                      onClick={() => void createBackupNow()}
                      disabled={backupBusy}
                    >
                      {backupBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Archive className="h-4 w-4" aria-hidden />
                      )}
                      Fazer backup agora
                    </Button>
                  </div>
                  {persistence.backups.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                      Nenhum snapshot ainda — um é criado automaticamente a cada boot do servidor.
                    </p>
                  ) : (
                    <ul className="mt-3 max-h-96 divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800 [scrollbar-width:thin]">
                      {persistence.backups.map((b) => (
                        <li key={b.file} className="flex items-center gap-3 py-2.5">
                          <Archive className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {b.file}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formatBytes(b.sizeBytes)}
                              {b.reason ? ` · ${b.reason}` : ''}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                            {new Date(b.createdAt).toLocaleDateString('pt-BR')}{' '}
                            {new Date(b.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 shrink-0 rounded-full text-[11px]"
                            onClick={() => setRestoreTarget(b.file)}
                            disabled={restoringFile !== null}
                          >
                            <RotateCcw className="h-3 w-3" aria-hidden /> Restaurar
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Exportação JSON */}
            <Card className="rounded-2xl">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Exportação completa (JSON)
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Todas as tabelas (usuários, cursos, pedidos, gateway configurado...) em um arquivo
                      portátil — a cópia de segurança definitiva.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-9 shrink-0 rounded-full font-semibold"
                    onClick={() => void exportJsonNow()}
                    disabled={exportBusy}
                  >
                    {exportBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden />
                    )}
                    Baixar exportação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preview do HTML do e-mail */}
        <Dialog open={Boolean(emailPreview)} onOpenChange={(open) => !open && setEmailPreview(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="pr-6 text-base">{emailPreview?.subject}</DialogTitle>
              <DialogDescription>
                {emailPreview?.to} · {emailPreview?.kind} ·{' '}
                {emailPreview
                  ? new Date(emailPreview.createdAt).toLocaleString('pt-BR')
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <iframe
                title="Pré-visualização do e-mail"
                srcDoc={emailPreview?.bodyHtml ?? ''}
                sandbox=""
                className="h-[50vh] w-full bg-white"
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmação de restauração de snapshot */}
        <AlertDialog open={restoreTarget !== null} onOpenChange={(open) => !open && setRestoreTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar este snapshot?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <span>
                  O banco atual será substituído pelo snapshot <strong>{restoreTarget}</strong>. Por
                  segurança, um snapshot do estado atual é salvo automaticamente antes da restauração — e
                  recomenda-se reiniciar o servidor depois para renovar as conexões.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={restoringFile !== null}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={restoringFile !== null}
                onClick={(e) => {
                  e.preventDefault()
                  if (restoreTarget) void restoreNow(restoreTarget)
                }}
              >
                {restoringFile ? 'Restaurando…' : 'Restaurar backup'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tabs>
    </div>
  )
}
