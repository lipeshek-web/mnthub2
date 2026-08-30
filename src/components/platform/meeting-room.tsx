'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  Info,
  Lightbulb,
  PhoneOff,
  ShieldCheck,
  Timer,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  STATUS_META,
  addMinutesToTime,
  currencyBRL,
  formatDayLabelLong,
  formatTimeLabel,
  relativeDayLabel,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { BookingDTO } from '@/lib/types'
import { toast } from 'sonner'

export function MeetingRoomView({ bookingId }: { bookingId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const [booking, setBooking] = useState<BookingDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [localNotes, setLocalNotes] = useState('')
  const [ending, setEnding] = useState(false)

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    setNotFound(false)
    try {
      const all = await api.listBookings(user.id)
      const found = all.find((b) => b.id === bookingId) ?? null
      if (found) {
        setBooking(found)
        setLocalNotes(found.notes ?? '')
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [bookingId, user])

  useEffect(() => {
    load()
  }, [load])

  const isMentorSide = Boolean(booking && user && booking.mentor.userId === user.id)

  const roomUrl = useMemo(() => {
    if (!booking || !user) return ''
    return `https://meet.jit.si/${booking.meetingRoom}#userInfo.displayName=${encodeURIComponent(user.name)}`
  }, [booking, user])

  const endSession = async () => {
    if (!booking || !user) return
    setEnding(true)
    try {
      await api.updateBooking(booking.id, { userId: user.id, action: 'complete' })
      toast.success('Sessão encerrada! O mentorado já pode avaliar a experiência.')
      navigate({ name: 'dashboard' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao encerrar sessão')
    } finally {
      setEnding(false)
    }
  }

  const copyRoom = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl)
      toast.success('Link da sala copiado!')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Video className="h-10 w-10 text-stone-400 dark:text-stone-500" />
            <p className="font-semibold">Entre para acessar a sala</p>
            <p className="text-sm text-muted-foreground">
              Use o menu <strong>Entrar</strong> no topo da página para selecionar um usuário.
            </p>
            <Button onClick={() => navigate({ name: 'dashboard' })}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-[56vh] w-full rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-44 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (notFound || !booking) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <Video className="h-10 w-10 text-stone-400 dark:text-stone-500" />
            <p className="font-semibold">Sessão não encontrada</p>
            <p className="text-sm text-muted-foreground">
              Ela pode ter sido removida ou você não tem acesso a ela.
            </p>
            <Button onClick={() => navigate({ name: 'dashboard' })}>Ver minhas sessões</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = STATUS_META[booking.status] ?? STATUS_META.PENDING
  const relative = relativeDayLabel(booking.startsAt)
  const blocked = booking.status === 'CANCELLED' || booking.status === 'COMPLETED'

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 pt-6">
      <button
        onClick={() => navigate({ name: 'dashboard' })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-emerald-700 dark:text-stone-400 dark:hover:text-emerald-300"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para minhas sessões
      </button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{booking.topic}</h1>
        <Badge variant="outline" className={status.className}>
          {status.label}
        </Badge>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
        <CalendarDays className="h-4 w-4" />
        {relative && <strong className="font-semibold text-stone-700 dark:text-stone-200">{relative} · </strong>}
        {formatDayLabelLong(booking.startsAt)} · {formatTimeLabel(booking.startsAt)} →{' '}
        {addMinutesToTime(booking.startsAt, booking.durationMin)}
      </p>

      {booking.status === 'PENDING' && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
          <Info className="mt-0.5 h-4.5 w-4.5 shrink-0" />
          <p>
            Esta sessão ainda <strong>aguarda confirmação do mentor</strong>. Você já pode entrar na
            sala para testar câmera e microfone.
          </p>
        </div>
      )}

      {/* ---------- VÍDEO ---------- */}
      <section aria-label="Sala de reunião por vídeo" className="mt-5">
        {blocked ? (
          <div className="flex h-[56vh] flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-stone-100 text-center dark:border-stone-800 dark:bg-stone-800">
            <CheckCircle2 className="h-12 w-12 text-stone-400 dark:text-stone-500" />
            <p className="font-bold text-stone-700 dark:text-stone-200">
              {booking.status === 'COMPLETED' ? 'Esta sessão foi concluída' : 'Esta sessão foi cancelada'}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {booking.status === 'COMPLETED'
                ? 'A sala de vídeo é encerrada após a conclusão. Avalie a sessão em Minhas sessões.'
                : 'Se algo mudou, combine uma nova data com a outra pessoa.'}
            </p>
            <Button variant="outline" onClick={() => navigate({ name: 'dashboard' })}>
              Ir para minhas sessões
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-xl">
            <div className="flex items-center gap-2 border-b border-stone-800 px-4 py-2.5 text-xs text-stone-300">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
              Sala de vídeo segura · MentorHub Meetings (Jitsi)
              <span className="ml-auto hidden items-center gap-1 sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> criptografada
              </span>
            </div>
            <iframe
              title={`Reunião: ${booking.topic}`}
              src={roomUrl}
              allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; autoplay"
              className="h-[56vh] min-h-[380px] w-full bg-stone-900"
            />
          </div>
        )}
      </section>

      {/* ---------- PAINÉIS ---------- */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <Avatar name={booking.mentor.name} size="lg" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Mentor</p>
                  <p className="font-bold text-stone-900 dark:text-stone-50">{booking.mentor.name}</p>
                  <p className="max-w-52 truncate text-xs text-muted-foreground">{booking.mentor.headline}</p>
                </div>
              </div>
              <div className="hidden h-12 w-px bg-stone-200 sm:block" aria-hidden />
              <div className="flex items-center gap-3">
                <Avatar name={booking.mentee.name} size="lg" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">Mentorado</p>
                  <p className="font-bold text-stone-900 dark:text-stone-50">{booking.mentee.name}</p>
                  <p className="text-xs text-muted-foreground">{currencyBRL(booking.price)} pela sessão</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-950/50">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> Duração
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-200">
                {booking.durationMin} minutos ({formatTimeLabel(booking.startsAt)} às{' '}
                {addMinutesToTime(booking.startsAt, booking.durationMin)})
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Anotações da sessão
              </p>
              <Textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                rows={3}
                placeholder="Registre insights, combinados e próximos passos enquanto conversam..."
                className="mt-2"
                aria-label="Anotações da sessão"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                As anotações ficam salvas nesta tela durante a reunião.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                <Lightbulb className="h-4 w-4 text-amber-500" /> Dicas para uma boa reunião
              </p>
              <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Permita câmera e microfone quando o navegador pedir.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Use fones de ouvido para uma áudio melhor.
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Compartilhe sua tela para revisar materiais juntos.
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={copyRoom}>
                <Copy className="h-4 w-4" /> Copiar link da sala
              </Button>
              {!blocked && (
                <a href={roomUrl} target="_blank" rel="noreferrer" className="block">
                  <Button variant="ghost" className="w-full text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-300">
                    <ExternalLink className="h-4 w-4" /> Abrir sala em nova aba
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          {isMentorSide && booking.status === 'CONFIRMED' && (
            <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/50">
              <CardContent className="p-6">
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Sessão em andamento?</p>
                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                  Quando a reunião terminar, marque-a como concluída para liberar a avaliação do
                  mentorado.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="mt-3 w-full" disabled={ending}>
                      <PhoneOff className="h-4 w-4" /> {ending ? 'Encerrando...' : 'Encerrar sessão'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Encerrar esta sessão?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A sessão “{booking.topic}” será marcada como concluída e o mentorado será
                        convidado a avaliar a experiência. Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Continuar na sala</AlertDialogCancel>
                      <AlertDialogAction onClick={endSession}>Encerrar sessão</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
