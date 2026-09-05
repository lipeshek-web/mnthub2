'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  CalendarOff,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Download,
  ExternalLink,
  Flame,
  History,
  Inbox,
  Library,
  LogIn,
  PlayCircle,
  Route,
  Star,
  Trophy,
  Users,
  Video,
  X,
  Zap,
  type LucideIcon,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/platform/avatar'
import { DailyMissionsCard, WeeklyRankingCard } from '@/components/platform/gamification-widgets'
import { api } from '@/lib/api'
import {
  LEVEL_LABELS,
  addMinutesToTime,
  levelFromXp,
  avatarGradient,
  currencyBRL,
  formatDayLabel,
  formatTimeLabel,
  formatTotalDuration,
  nowNaive,
  relativeDayLabel,
} from '@/lib/helpers'
import { crossZoneHint } from '@/lib/tz'
import { useAppStore } from '@/lib/store'
import type {
  BookingDTO,
  EnrolledCourseDTO,
  MentorDetailDTO,
  MyTrackDTO,
  XpStatsDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

type ConfirmKind = 'reject' | 'complete' | 'cancel'

// ---------- Componentes auxiliares ----------

function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon
  title: string
  text: string
  children?: ReactNode
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ring-1 ring-slate-200 dark:ring-slate-800">
          <Icon className="size-6" aria-hidden />
        </div>
        <h3 className="mt-2 text-base font-semibold">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </Card>
  )
}

function CountPill({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        'ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
        className
      )}
    >
      {n}
    </span>
  )
}

function PendingRequestRow({
  booking: b,
  busy,
  onConfirm,
  onReject,
}: {
  booking: BookingDTO
  busy: boolean
  onConfirm: (booking: BookingDTO) => void
  onReject: (booking: BookingDTO) => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const when = relativeDayLabel(b.startsAt) ?? formatDayLabel(b.startsAt)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar name={b.mentee.name} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{b.mentee.name}</p>
          <p className="truncate text-sm text-muted-foreground">{b.topic}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {when} · {formatTimeLabel(b.startsAt)}–{addMinutesToTime(b.startsAt, b.durationMin)} ·{' '}
            {b.durationMin} min · {currencyBRL(b.price)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <Button size="sm" disabled={busy} onClick={() => onConfirm(b)}>
          <Check className="size-4" aria-hidden /> Confirmar
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejectOpen(true)}>
          <X className="size-4" aria-hidden /> Recusar
        </Button>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={(open) => { if (!open) setRejectOpen(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              A solicitação de {b.mentee.name} sobre &quot;{b.topic}&quot; será cancelada e o horário será
              liberado na sua agenda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={busy}
              onClick={() => {
                setRejectOpen(false)
                onReject(b)
              }}
            >
              Recusar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BookingCard({
  booking: b,
  userId,
  busy,
  onConfirm,
  onReject,
  onComplete,
  onCancel,
  onJoin,
  onPay,
  onReview,
}: {
  booking: BookingDTO
  userId: string
  busy: boolean
  onConfirm: (booking: BookingDTO) => void
  onReject: (booking: BookingDTO) => void
  onComplete: (booking: BookingDTO) => void
  onCancel: (booking: BookingDTO) => void
  onJoin: (booking: BookingDTO) => void
  onPay: (booking: BookingDTO) => void
  onReview: (booking: BookingDTO, rating: number, comment: string) => Promise<void>
}) {
  const isMentorSide = b.mentor.userId === userId
  const otherName = isMentorSide ? b.mentee.name : b.mentor.name
  const when = relativeDayLabel(b.startsAt) ?? formatDayLabel(b.startsAt)
  const tzHint = crossZoneHint(b.startsAt)
  // #8: "Google Calendar" só para sessões futuras aguardando confirmação/confirmadas
  const isUpcomingEvent =
    (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.startsAt >= nowNaive()
  const gcalUrl = (() => {
    const start = new Date(b.startsAt) // naive → Date local
    const end = new Date(start.getTime() + b.durationMin * 60_000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Mentoria: ${b.topic}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `Sessão de mentoria no Órbita com ${otherName}.`,
      location: b.meetingRoom,
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  })()
  // Rótulos curtos para o selo do card (versão leve dos labels de STATUS_META)
  const statusMeta = SHORT_STATUS[b.status] ?? {
    label: b.status,
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  }

  const [dialogAction, setDialogAction] = useState<ConfirmKind | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canJoin = b.status === 'CONFIRMED'
  const canReview = !isMentorSide && b.status === 'COMPLETED' && !b.reviewed
  // Sessão 1:1 paga: botão Pagar quando ainda não pago/em cobrança
  const canPay =
    !isMentorSide &&
    b.price > 0 &&
    b.payStatus === 'UNPAID' &&
    (b.status === 'PENDING' || b.status === 'CONFIRMED')

  const dialogContent: Record<ConfirmKind, { title: string; description: string; actionLabel: string }> = {
    reject: {
      title: 'Recusar solicitação?',
      description: `A solicitação de ${b.mentee.name} sobre "${b.topic}" será cancelada e o horário será liberado na sua agenda.`,
      actionLabel: 'Recusar',
    },
    complete: {
      title: 'Marcar como concluída?',
      description: `Confirme que a sessão com ${b.mentee.name} aconteceu. Ela irá para o histórico e o aluno poderá avaliá-la.`,
      actionLabel: 'Concluir sessão',
    },
    cancel: {
      title: 'Cancelar sessão?',
      description: `Sua sessão com ${b.mentor.name} será cancelada e o horário será liberado para outras pessoas.`,
      actionLabel: 'Cancelar sessão',
    },
  }
  const currentDialog = dialogAction ? dialogContent[dialogAction] : null

  const submitReview = async () => {
    if (rating < 1) {
      toast.error('Escolha uma nota de 1 a 5 estrelas antes de enviar.')
      return
    }
    setSubmitting(true)
    try {
      await onReview(b, rating, comment.trim())
      setReviewOpen(false)
      setRating(0)
      setHoverRating(0)
      setComment('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar sua avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasActions =
    (isMentorSide && (b.status === 'PENDING' || b.status === 'CONFIRMED')) ||
    canJoin ||
    canPay ||
    (!isMentorSide && (b.status === 'PENDING' || b.status === 'CONFIRMED')) ||
    canReview

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 p-4 sm:px-5 sm:py-4">
        {/* Cabeçalho: pessoa + tópico · selo de status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={otherName} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold leading-tight">{otherName}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    isMentorSide
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {isMentorSide ? 'Mentor' : 'Aluno'}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{b.topic}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('shrink-0', statusMeta.className)}>
            {statusMeta.label}
          </Badge>
        </div>

        {/* Meta em uma linha: quando · duração · valor · calendário */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
            <CalendarDays className="size-3.5 text-blue-600 dark:text-blue-400" aria-hidden />
            {when} · {formatTimeLabel(b.startsAt)}–{addMinutesToTime(b.startsAt, b.durationMin)}
            {tzHint && (
              <span className="font-medium text-blue-700 dark:text-blue-300">({tzHint})</span>
            )}
          </span>
          <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
          <span>{b.durationMin} min</span>
          <span aria-hidden className="text-slate-300 dark:text-slate-600">·</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{currencyBRL(b.price)}</span>
          {isUpcomingEvent ? (
            <a
              href={gcalUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Adicionar "${b.topic}" ao Google Calendar`}
              title="Adicionar ao Google Calendar"
              className="ml-auto inline-flex size-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-500 dark:hover:bg-blue-950/50 dark:hover:text-blue-300"
            >
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
        </div>

        {b.notes ? (
          <p className="line-clamp-1 text-xs text-slate-400 dark:text-slate-500">{b.notes}</p>
        ) : null}

        {hasActions ? (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            {isMentorSide && b.status === 'PENDING' ? (
              <>
                <Button size="sm" disabled={busy} onClick={() => onConfirm(b)}>
                  <Check className="size-4" aria-hidden /> Confirmar
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialogAction('reject')}>
                  <X className="size-4" aria-hidden /> Recusar
                </Button>
              </>
            ) : null}

            {isMentorSide && b.status === 'CONFIRMED' ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialogAction('complete')}>
                <CheckCheck className="size-4" aria-hidden /> Concluir
              </Button>
            ) : null}

            {canJoin ? (
              <Button size="sm" onClick={() => onJoin(b)}>
                <Video className="size-4" aria-hidden /> Entrar na sala
              </Button>
            ) : null}

            {canPay ? (
              <Button size="sm" onClick={() => onPay(b)}>
                <CreditCard className="size-4" aria-hidden /> Pagar sessão ({currencyBRL(b.price)})
              </Button>
            ) : null}

            {!isMentorSide && (b.status === 'PENDING' || b.status === 'CONFIRMED') ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-400"
                disabled={busy}
                onClick={() => setDialogAction('cancel')}
              >
                Cancelar sessão
              </Button>
            ) : null}

            {canReview ? (
              <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
                <Star className="size-4 fill-yellow-400 text-blue-400" aria-hidden /> Avaliar
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Confirmações: recusar / concluir / cancelar */}
      <AlertDialog
        open={dialogAction !== null}
        onOpenChange={(open) => {
          if (!open) setDialogAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{currentDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              disabled={busy}
              onClick={() => {
                const action = dialogAction
                setDialogAction(null)
                if (action === 'reject') onReject(b)
                else if (action === 'complete') onComplete(b)
                else if (action === 'cancel') onCancel(b)
              }}
            >
              {currentDialog?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Avaliar sessão */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar sessão</DialogTitle>
            <DialogDescription>
              Como foi sua mentoria com {b.mentor.name} sobre &quot;{b.topic}&quot;? Seu feedback ajuda outros
              alunos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-1" role="radiogroup" aria-label="Nota da avaliação">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = (hoverRating || rating) >= value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    <Star
                      size={28}
                      className={cn(
                        'transition-colors',
                        active ? 'fill-yellow-400 text-blue-400' : 'fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-600'
                      )}
                      aria-hidden
                    />
                  </button>
                )
              })}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`review-comment-${b.id}`}>Como foi sua experiência?</Label>
              <Textarea
                id={`review-comment-${b.id}`}
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Conte o que funcionou bem e o que pode melhorar..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void submitReview()} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** Rótulos curtos de status para os cards (versão compacta de STATUS_META) */
const SHORT_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendente',
    className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  },
  CONFIRMED: {
    label: 'Confirmada',
    className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
  },
  COMPLETED: {
    label: 'Concluída',
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  },
}

// ---------- Card de gamificação (Sua jornada de aprendizado) ----------

function XpJourneyCard({ stats, failed }: { stats: XpStatsDTO | null; failed: boolean }) {
  // Falha silenciosa: em erro o card nem renderiza
  if (failed) return null

  const lv = stats ? levelFromXp(stats.xp) : null

  return (
    <div
      role="group"
      aria-label="Progresso de gamificação"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm tabular-nums"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400"
        >
          <Flame className="size-5" />
        </span>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Sua jornada de aprendizado
        </h2>
      </div>

      {/* KPIs: XP total · Ofensiva · Recorde */}
      {stats ? (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:flex sm:gap-6">
          <div className="min-w-0 sm:flex-1">
            <div className="flex items-center gap-1.5">
              <Zap className="size-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-50 sm:text-2xl" aria-label={`${stats.xp} XP no total`}>
                {stats.xp}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">XP total</p>
          </div>

          <div className="min-w-0 sm:flex-1">
            <div className="flex items-center gap-1.5">
              <Flame
                className={cn('size-4 shrink-0', stats.streak > 0 ? 'text-orange-500' : 'text-slate-300 dark:text-slate-600')}
                aria-hidden
              />
              <p
                className="text-xl font-extrabold text-slate-900 dark:text-slate-50 sm:text-2xl"
                aria-label={`${stats.streak} ${stats.streak === 1 ? 'dia seguido' : 'dias seguidos'}`}
              >
                {stats.streak}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
              {stats.streak > 0 ? (stats.streak === 1 ? 'dia seguido' : 'dias seguidos') : 'estude hoje!'}
            </p>
          </div>

          <div className="min-w-0 sm:flex-1">
            <div className="flex items-center gap-1.5">
              <Trophy className="size-4 shrink-0 text-blue-500" aria-hidden />
              <p
                className="text-xl font-extrabold text-slate-900 dark:text-slate-50 sm:text-2xl"
                aria-label={`recorde de ${stats.longestStreak} ${stats.longestStreak === 1 ? 'dia seguido' : 'dias seguidos'}`}
              >
                {stats.longestStreak}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">recorde</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:flex sm:gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="min-w-0 sm:flex-1">
              <Skeleton className="h-7 w-16 max-w-full" />
              <Skeleton className="mt-1.5 h-3 w-20 max-w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Nível atual e progresso até o próximo */}
      {lv ? (
        <div className="mt-5">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-50">Nível atual: {lv.level.label}</p>
          {lv.next ? (
            <>
              <Progress
                value={lv.progressPct}
                aria-label={`${lv.progressPct}% do caminho para o nível ${lv.next.label}`}
                className="mt-2 h-2"
              />
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                Faltam <span className="font-semibold text-slate-500 dark:text-slate-400">{lv.xpToNext}</span> XP para{' '}
                {lv.next.label}
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Nível máximo alcançado! 🏆</p>
          )}
        </div>
      ) : (
        <div className="mt-5">
          <Skeleton className="h-4 w-44 max-w-full" />
          <Skeleton className="mt-2.5 h-2 w-full" />
          <Skeleton className="mt-3 h-3 w-64 max-w-full" />
        </div>
      )}

      {/* Micro-proof: como ganhar XP */}
      <p className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-400 dark:text-slate-500">
        +10 XP por aula concluída · +5 por quiz acertado · +50 por curso completo
      </p>
    </div>
  )
}

// ---------- View principal ----------

export default function DashboardView() {
  const user = useAppStore((state) => state.user)
  const navigate = useAppStore((state) => state.navigate)
  const userId = user?.id ?? null

  const [bookings, setBookings] = useState<BookingDTO[] | null>(null)
  const [mentorProfile, setMentorProfile] = useState<MentorDetailDTO | null>(null)
  const [enrollments, setEnrollments] = useState<EnrolledCourseDTO[]>([])
  const [myTracks, setMyTracks] = useState<MyTrackDTO[]>([])
  const [xpStats, setXpStats] = useState<XpStatsDTO | null>(null)
  const [xpFailed, setXpFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  // Distingue "não é mentor" (profile null) de "falhou ao carregar" — antes um
  // erro silencioso escondia as Solicitações recebidas sem qualquer aviso
  const [profileFailed, setProfileFailed] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId) return
    try {
      const [bookingsRes, profileRes, enrollmentsRes, tracksRes] = await Promise.all([
        api.listBookings(userId),
        api
          .getMyMentorProfile(userId)
          .then((res) => res.profile)
          .catch(() => {
            setProfileFailed(true)
            return null
          }),
        api.listMyEnrollments(userId).catch(() => []),
        api.listMyTracks(userId).catch(() => []),
      ])
      setBookings(bookingsRes)
      setMentorProfile(profileRes)
      setEnrollments(enrollmentsRes)
      setMyTracks(tracksRes)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar suas sessões.')
      setBookings((prev) => prev ?? [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    void refetch()
  }, [userId, refetch])

  // Gamificação: XP, ofensiva e recorde (fetch no mount; falha silenciosa esconde o card)
  useEffect(() => {
    if (!userId) return
    let alive = true
    api
      .xpStats(userId)
      .then((res) => {
        if (alive) setXpStats(res)
      })
      .catch(() => {
        if (alive) setXpFailed(true)
      })
    return () => {
      alive = false
    }
  }, [userId])

  const runAction = useCallback(
    async (booking: BookingDTO, action: 'confirm' | 'cancel' | 'complete', successMsg: string) => {
      if (!userId) return
      setActingId(booking.id)
      try {
        await api.updateBooking(booking.id, { userId, action })
        toast.success(successMsg)
        await refetch()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a sessão.')
      } finally {
        setActingId(null)
      }
    },
    [userId, refetch]
  )

  const handleConfirm = useCallback(
    (booking: BookingDTO) => void runAction(booking, 'confirm', `Sessão com ${booking.mentee.name} confirmada!`),
    [runAction]
  )
  const handleReject = useCallback(
    (booking: BookingDTO) => void runAction(booking, 'cancel', 'Solicitação recusada.'),
    [runAction]
  )
  const handleComplete = useCallback(
    (booking: BookingDTO) =>
      void runAction(booking, 'complete', 'Sessão marcada como concluída! Ela foi para o histórico.'),
    [runAction]
  )
  const handleCancel = useCallback(
    (booking: BookingDTO) => void runAction(booking, 'cancel', 'Sessão cancelada. O horário foi liberado.'),
    [runAction]
  )
  const handleJoin = useCallback(
    (booking: BookingDTO) => navigate({ name: 'meeting', bookingId: booking.id }),
    [navigate]
  )
  // Sessão 1:1 paga: leva ao checkout da sessão (PIX/cartão/boleto)
  const handlePay = useCallback(
    (booking: BookingDTO) => navigate({ name: 'checkout', bookingId: booking.id }),
    [navigate]
  )
  const handleReview = useCallback(
    async (booking: BookingDTO, rating: number, comment: string) => {
      if (!userId) return
      await api.createReview({ bookingId: booking.id, userId, rating, comment })
      toast.success('Avaliação enviada. Obrigado pelo feedback!')
      await refetch()
    },
    [userId, refetch]
  )

  // ---------- Guardas de render ----------

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-900">
              <LogIn className="size-6" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold">Você precisa entrar</h1>
            <p className="max-w-xs text-sm text-muted-foreground">
              Entre na sua conta para ver e gerenciar suas sessões de mentoria.
            </p>
            <Button className="mt-2" onClick={() => navigate({ name: 'auth', mode: 'login' })}>
              Entrar ou criar conta
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading || bookings === null) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
        <Skeleton className="mt-6 h-10 w-full max-w-sm rounded-lg" />
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                  <Skeleton className="h-3 w-72 max-w-full" />
                </div>
                <Skeleton className="h-6 w-28 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // ---------- Derivações das abas ----------

  const now = nowNaive()
  const bookingsList = bookings

  const pendingRequests = mentorProfile
    ? bookingsList.filter((b) => b.mentor.userId === user.id && b.status === 'PENDING')
    : []

  const upcoming = bookingsList
    .filter((b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && b.startsAt >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  const toReview = bookingsList.filter(
    (b) => b.status === 'COMPLETED' && b.mentee.id === user.id && !b.reviewed
  )

  const upcomingIds = new Set(upcoming.map((b) => b.id))
  const reviewIds = new Set(toReview.map((b) => b.id))
  const history = bookingsList
    .filter((b) => !upcomingIds.has(b.id) && !reviewIds.has(b.id))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))

  const cardProps = {
    userId: user.id,
    onConfirm: handleConfirm,
    onReject: handleReject,
    onComplete: handleComplete,
    onCancel: handleCancel,
    onJoin: handleJoin,
    onPay: handlePay,
    onReview: handleReview,
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Minhas mentorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe solicitações recebidas, próximas sessões e seu histórico de mentorias.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* #8: exporta sessões + aulas ao vivo em .ics via fetch autenticado (toque ≥44px no mobile) */}
          <Button
            variant="outline"
            className="h-11 px-3 sm:h-9"
            aria-label="Baixar sessões e aulas ao vivo em arquivo .ics para importar no seu calendário"
            onClick={async () => {
              try {
                await api.exportCalendar()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Falha ao exportar o calendário.')
              }
            }}
          >
            <Download className="size-4" aria-hidden />
            <span className="hidden sm:inline">Exportar .ics</span>
          </Button>
          <Button
            variant="outline"
            className="h-11 px-3 sm:h-9"
            onClick={() => navigate({ name: 'marketplace' })}
          >
            <Compass className="size-4" aria-hidden /> Explorar mentores
          </Button>
        </div>
      </header>

      <XpJourneyCard stats={xpStats} failed={xpFailed} />

      {/* Gamificação v2: missões diárias (com heatmap de consistência) e ranking
          semanal — falham em silêncio, nunca derrubam o dashboard */}
      <DailyMissionsCard />
      <WeeklyRankingCard />

      {profileFailed && (
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <p className="text-sm text-rose-800 dark:text-rose-300">
              Não foi possível carregar seu perfil de mentor — as solicitações recebidas podem estar ocultas.
            </p>
            <Button size="sm" variant="outline" className="h-9" onClick={() => { setProfileFailed(false); setLoading(true); refetch() }}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingRequests.length > 0 ? (
        <Card className="border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/50">
          <CardContent className="flex flex-col gap-3 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <Inbox className="size-4.5 text-blue-600 dark:text-blue-400" aria-hidden />
              <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Solicitações recebidas</h2>
              <Badge className="border-blue-200 dark:border-blue-900 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">
                {pendingRequests.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-2.5">
              {pendingRequests.map((b) => (
                <PendingRequestRow
                  key={b.id}
                  booking={b}
                  busy={actingId === b.id}
                  onConfirm={handleConfirm}
                  onReject={handleReject}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="upcoming" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap sm:w-auto">
          <TabsTrigger value="upcoming">
            Próximas
            <CountPill n={upcoming.length} className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300" />
          </TabsTrigger>
          <TabsTrigger value="courses">
            Meus cursos
            <CountPill n={enrollments.length} className="bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300" />
          </TabsTrigger>
          <TabsTrigger value="review">
            Para avaliar
            <CountPill n={toReview.length} className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300" />
          </TabsTrigger>
          <TabsTrigger value="history">
            Histórico
            <CountPill n={history.length} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="flex flex-col gap-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="Nenhuma sessão agendada"
              text="Quando você agendar uma mentoria ou receber solicitações de alunos, elas aparecerão aqui."
            >
              <Button onClick={() => navigate({ name: 'marketplace' })}>
                <Compass className="size-4" aria-hidden /> Explorar mentores
              </Button>
            </EmptyState>
          ) : (
            upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} busy={actingId === b.id} {...cardProps} />
            ))
          )}
        </TabsContent>

        <TabsContent value="courses" className="flex flex-col gap-4">
          {/* Minhas trilhas (no topo da aba) — oculto quando não há trilhas */}
          {myTracks.length > 0 && (
            <section aria-labelledby="minhas-trilhas-title" className="flex flex-col gap-3">
              <h2 id="minhas-trilhas-title" className="text-base font-semibold">
                Minhas trilhas
              </h2>
              {myTracks.map((t) => (
                <MyTrackCard
                  key={t.id}
                  track={t}
                  onOpenTrack={() => navigate({ name: 'track', trackId: t.id })}
                  onContinueCourse={(courseId) => navigate({ name: 'classroom', courseId })}
                />
              ))}
            </section>
          )}

          {enrollments.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Você ainda não se inscreveu em cursos"
              text="Cursos são aulas gravadas e materiais dos mentores, no seu ritmo. Explore o catálogo e comece hoje."
            >
              <Button
                onClick={() => {
                  useAppStore.getState().setExploreTab('courses')
                  navigate({ name: 'marketplace' })
                }}
              >
                <Library className="size-4" aria-hidden /> Explorar cursos
              </Button>
            </EmptyState>
          ) : (
            enrollments.map((enr) => (
              <EnrolledCourseCard
                key={enr.courseId}
                enrollment={enr}
                onOpen={() => navigate({ name: 'course', courseId: enr.courseId })}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="review" className="flex flex-col gap-4">
          {toReview.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Você não tem sessões para avaliar"
              text="Após concluir uma mentoria como aluno, você poderá avaliar a experiência com esta aba."
            />
          ) : (
            toReview.map((b) => <BookingCard key={b.id} booking={b} busy={actingId === b.id} {...cardProps} />)
          )}
        </TabsContent>

        <TabsContent value="history" className="flex flex-col gap-4">
          {history.length === 0 ? (
            <EmptyState
              icon={History}
              title="Sem histórico ainda"
              text="Sessões concluídas e canceladas serão arquivadas aqui automaticamente."
            />
          ) : (
            history.map((b) => <BookingCard key={b.id} booking={b} busy={actingId === b.id} {...cardProps} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Card de curso matriculado (aba Meus cursos) ----------

function EnrolledCourseCard({
  enrollment,
  onOpen,
}: {
  enrollment: EnrolledCourseDTO
  onOpen: () => void
}) {
  const { course, completedLessonIds } = enrollment
  const total = Math.max(course.lessonCount, 1)
  const completed = completedLessonIds.length
  const pct = Math.round((completed / total) * 100)
  const isDone = completed >= course.lessonCount && course.lessonCount > 0

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt=""
            aria-hidden
            className="h-14 w-14 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <span
            aria-hidden
            style={avatarGradient(course.title)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
          >
            <Library className="size-6" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-slate-900 dark:text-slate-50">{course.title}</p>
            {isDone && (
              <Badge className="border-blue-200 dark:border-blue-900 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">
                <CheckCircle2 className="size-3" aria-hidden /> Concluído
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            por {course.mentor.name} · {course.lessonCount} aulas ·{' '}
            {formatTotalDuration(course.totalDurationMin)}
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <Progress value={pct} aria-label={`${pct}% do curso concluído`} className="h-2 max-w-64 flex-1" />
            <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {completed}/{course.lessonCount} aulas
            </span>
          </div>
        </div>

        <Button onClick={onOpen} className="shrink-0 self-start rounded-full sm:self-auto">
          <PlayCircle className="size-4" aria-hidden /> {isDone ? 'Revisar curso' : 'Continuar'}
        </Button>
      </div>
    </Card>
  )
}

// ---------- Card de trilha matriculada (bloco Minhas trilhas) ----------

function MyTrackCard({
  track,
  onOpenTrack,
  onContinueCourse,
}: {
  track: MyTrackDTO
  onOpenTrack: () => void
  onContinueCourse: (courseId: string) => void
}) {
  const isDone = track.percent >= 100
  // Próximo curso incompleto da trilha (primeiro com aulas restantes)
  const nextCourse = track.perCourse.find((c) => c.completed < c.total)

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt=""
            aria-hidden
            className="h-14 w-14 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <span
            aria-hidden
            style={avatarGradient(track.title)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
          >
            <Route className="size-6" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold text-slate-900 dark:text-slate-50">{track.title}</p>
            <Badge className="border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300">{track.category}</Badge>
            {isDone && (
              <Badge className="border-blue-200 dark:border-blue-900 bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">
                <CheckCircle2 className="size-3" aria-hidden /> Trilha concluída 🎉
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            por {track.mentor.name} · {track.courseCount}{' '}
            {track.courseCount === 1 ? 'curso' : 'cursos'} ·{' '}
            {formatTotalDuration(track.totalDurationMin)}
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <Progress
              value={track.percent}
              aria-label={`${track.percent}% da trilha concluído`}
              className="h-2 max-w-64 flex-1"
            />
            <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {track.percent}% concluído
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 self-start sm:self-auto">
          <Button onClick={onOpenTrack} className="rounded-full">
            <Route className="size-4" aria-hidden /> Abrir trilha
          </Button>
          {!isDone && nextCourse && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => onContinueCourse(nextCourse.courseId)}
            >
              <PlayCircle className="size-4" aria-hidden /> Continuar curso
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
