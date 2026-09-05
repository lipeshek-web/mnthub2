'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Library,
  PlayCircle,
  Radio,
  Route,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  LEVEL_LABELS,
  avatarGradient,
  currencyBRL,
  formatDayLabel,
  formatTotalDuration,
} from '@/lib/helpers'
import { trackEvent } from '@/lib/tracking'
import { useAppStore } from '@/lib/store'
import type { TrackDetailDTO, TrackDetailItemDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

export function TrackView({ trackId }: { trackId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const setBookingTopic = useAppStore((s) => s.setBookingTopic)
  const user = useAppStore((s) => s.user)

  const [track, setTrack] = useState<TrackDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  // Tracking (view_item) — no máximo 1x por trilha por montagem (ref-guard, seguro no StrictMode)
  const trackedTrackRef = useRef<string | null>(null)

  const fetchTrack = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.getTrack(trackId, user?.id)
      setTrack(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a trilha.')
    } finally {
      setLoading(false)
    }
  }, [trackId, user?.id])

  useEffect(() => {
    void fetchTrack()
  }, [fetchTrack])

  // Dispara view_item quando os dados da trilha chegam (mentor do TrackListItemDTO
  // não expõe IDs de tracking, então aqui vai apenas o evento server-side/pixels da plataforma)
  useEffect(() => {
    if (!track || trackedTrackRef.current === track.id) return
    trackedTrackRef.current = track.id
    trackEvent('view_item', {
      mentorId: track.mentor.id,
      value: track.price || undefined,
      contentName: track.title,
    })
  }, [track])

  /* ---------- Progresso geral (somatório de courseProgress) ---------- */

  const progressValues = Object.values(track?.courseProgress ?? {})
  const overallCompleted = progressValues.reduce((acc, v) => acc + v.completed, 0)
  const overallTotal = progressValues.reduce((acc, v) => acc + v.total, 0)
  const overallPercent = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0

  /* ---------- Ações ---------- */

  const doEnroll = async () => {
    if (!user || !track) return
    setEnrolling(true)
    try {
      await api.enrollTrack(track.id, user.id)
      toast.success('Inscrição na trilha realizada! 🎉')
      await fetchTrack()
    } catch (err) {
      if (err instanceof Error && err.message.includes('já tem acesso')) {
        toast.info('Você já tem acesso a esta trilha.')
        await fetchTrack()
      } else {
        toast.error(err instanceof Error ? err.message : 'Não foi possível concluir a inscrição.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  /** Primeiro curso com progresso incompleto (senão o primeiro curso da trilha) */
  const continueLearning = () => {
    if (!track) return
    const courseItems = track.items.filter((i) => i.type === 'COURSE' && i.courseId)
    const firstIncomplete = courseItems.find((i) => {
      const p = i.courseId ? track.courseProgress[i.courseId] : undefined
      return !p || p.completed < p.total
    })
    const target = firstIncomplete ?? courseItems[0]
    if (target?.courseId) {
      navigate({ name: 'classroom', courseId: target.courseId })
    } else {
      // Trilha sem cursos: continua pela mentoria com o mentor
      navigate({ name: 'mentor', mentorId: track.mentor.id })
    }
  }

  const handleMainCta = () => {
    if (!track) return
    if (track.myEnrollment) {
      continueLearning()
      return
    }
    if (!user) {
      toast.info('Entre com uma conta para continuar.')
      navigate({ name: 'auth', mode: 'login' })
      return
    }
    if (track.price === 0) {
      void doEnroll()
    } else {
      // Trilha paga: funil completo de checkout (com atribuição)
      trackEvent('begin_checkout', {
        mentorId: track.mentor.id,
        value: track.price || undefined,
        contentName: track.title,
      })
      navigate({ name: 'checkout', trackId: track.id })
    }
  }

  const scheduleMentorship = (item: TrackDetailItemDTO) => {
    if (!track) return
    setBookingTopic(`Mentoria da trilha: ${track.title} — ${item.title}`)
    navigate({ name: 'mentor', mentorId: track.mentor.id })
  }

  const openCourse = (courseId: string | null) => {
    if (courseId) navigate({ name: 'course', courseId })
  }

  const openClassroom = (courseId: string | null) => {
    if (courseId) navigate({ name: 'classroom', courseId })
  }

  /* ---------- Renders auxiliares ---------- */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8" aria-busy="true">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="mt-4 h-52 w-full rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <p className="sr-only">Carregando trilha…</p>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50">
            <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
          </span>
          <p className="font-bold text-stone-900 dark:text-stone-50">Não foi possível carregar a trilha.</p>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {error ?? 'Trilha não encontrada.'}
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => void fetchTrack()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const ctaLabel = enrolling
    ? 'Inscrevendo…'
    : track.myEnrollment
      ? 'Continuar aprendendo'
      : track.price === 0
        ? 'Inscrever-se gratuitamente'
        : 'Comprar trilha'

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <Button
        variant="ghost"
        onClick={() => navigate({ name: 'marketplace' })}
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
      </Button>

      {/* ---------- HERO ---------- */}
      <section
        aria-label={`Trilha: ${track.title}`}
        className="relative mt-4 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={avatarGradient(track.title)}
      >
        {track.coverUrl ? (
          <>
            <img
              src={track.coverUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-stone-950/55" />
          </>
        ) : (
          <Route aria-hidden className="pointer-events-none absolute -right-6 -top-10 h-48 w-48 text-white/15" />
        )}
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border-transparent bg-white/95 text-amber-900 hover:bg-white/95">
              <Route aria-hidden className="h-3 w-3" />
              Trilha
            </Badge>
            <Badge className="rounded-full border-white/25 bg-white/15 text-white hover:bg-white/15">
              {track.category}
            </Badge>
            <Badge className="rounded-full border-white/25 bg-stone-900/30 text-white hover:bg-stone-900/30">
              {LEVEL_LABELS[track.level] ?? track.level}
            </Badge>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{track.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-[15px]">
            {track.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen aria-hidden className="h-4 w-4" />
              {track.courseCount} {track.courseCount === 1 ? 'curso' : 'cursos'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="h-4 w-4" />
              {track.mentorshipSessions} {track.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'} 1:1
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle aria-hidden className="h-4 w-4" />
              {track.lessonCount} {track.lessonCount === 1 ? 'aula' : 'aulas'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="h-4 w-4" />
              {formatTotalDuration(track.totalDurationMin)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              {track.studentCount} {track.studentCount === 1 ? 'aluno' : 'alunos'}
            </span>
          </div>
        </div>
      </section>

      {/* ---------- CONTEÚDO ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Como a trilha funciona (+ progresso geral se inscrito) */}
          <section
            aria-labelledby="como-funciona-title"
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
          >
            <h2 id="como-funciona-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              Como a trilha funciona
            </h2>
            {track.myEnrollment ? (
              <div className="mt-4 rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/50 p-4">
                <div className="flex items-center justify-between gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
                  <span>Seu progresso na trilha</span>
                  <span>{overallPercent}%</span>
                </div>
                <Progress
                  value={overallPercent}
                  className="mt-2 h-2"
                  aria-label={`${overallPercent}% da trilha concluída`}
                />
                <p className="mt-2 text-xs font-medium text-amber-800/80 dark:text-amber-300/80">
                  {overallCompleted} de {overallTotal} aulas concluídas · {overallPercent}%
                </p>
              </div>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              Siga as etapas na ordem sugerida: conclua cada curso no seu ritmo e agende as sessões de
              mentoria 1:1 nos blocos indicados. O progresso é salvo automaticamente conforme você avança.
            </p>
          </section>

          {/* Timeline numerada dos itens */}
          <section
            aria-labelledby="jornada-title"
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="jornada-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                Conteúdo da trilha
              </h2>
              <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
                {track.items.length} {track.items.length === 1 ? 'etapa' : 'etapas'}
              </span>
            </div>
            <ol className="mt-5">
              {track.items.map((item, index) => (
                <li key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                        item.type === 'COURSE' ? 'bg-amber-700' : 'bg-amber-600'
                      )}
                    >
                      {index + 1}
                    </span>
                    {index < track.items.length - 1 ? (
                      <span aria-hidden className="my-1 w-px flex-1 border-l border-dashed border-stone-200 dark:border-stone-800" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-6 last:pb-0">
                    {item.type === 'COURSE' ? (
                      <CourseItemCard
                        item={item}
                        enrolled={Boolean(track.myEnrollment)}
                        progress={item.courseId ? track.courseProgress[item.courseId] : undefined}
                        onOpenCourse={() => openCourse(item.courseId)}
                        onOpenClassroom={() => openClassroom(item.courseId)}
                      />
                    ) : (
                      <MentorshipItemCard
                        item={item}
                        mentorName={track.mentor.name}
                        onSchedule={() => scheduleMentorship(item)}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {track.items.length === 0 ? (
              <p className="py-4 text-sm text-stone-400 dark:text-stone-500">
                Os itens desta trilha estão sendo preparados.
              </p>
            ) : null}
          </section>

          {/* Sobre o mentor */}
          <section
            aria-label="Mentor da trilha"
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
          >
            <h2 className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">Sobre o mentor</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={track.mentor.name} src={track.mentor.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-900 dark:text-stone-50">{track.mentor.name}</p>
                <p className="line-clamp-1 text-sm text-stone-500 dark:text-stone-400">{track.mentor.headline}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Stars rating={track.mentor.rating} size={13} />
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                    {track.mentor.rating > 0 ? track.mentor.rating.toFixed(1) : 'Novo'}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    ({track.mentor.reviewCount}{' '}
                    {track.mentor.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-10 rounded-full font-semibold"
                onClick={() => navigate({ name: 'mentor', mentorId: track.mentor.id })}
                aria-label={`Ver perfil de ${track.mentor.name}`}
              >
                Ver perfil
              </Button>
            </div>
          </section>
        </div>

        {/* ---------- SIDEBAR DE INSCRIÇÃO ---------- */}
        <Card className="self-start rounded-2xl border-stone-200 dark:border-stone-800 p-6 shadow-none lg:sticky lg:top-6">
          {track.myEnrollment ? (
            <div className="mb-4 rounded-xl border border-amber-100 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/50 p-3.5">
              <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50">
                <CheckCircle2 aria-hidden className="h-3 w-3" />
                Você está inscrito
              </Badge>
              <p className="mt-1.5 text-xs font-medium text-amber-800/80 dark:text-amber-300/80">
                Inscrito em {formatDayLabel(track.myEnrollment.createdAt)}
              </p>
            </div>
          ) : null}

          <p
            className={cn(
              'text-3xl font-extrabold tracking-tight',
              track.price === 0 ? 'text-amber-700 dark:text-amber-300' : 'text-stone-900 dark:text-stone-50'
            )}
          >
            {track.price === 0 ? 'Grátis' : currencyBRL(track.price)}
          </p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Inclui acesso a todos os cursos e às sessões de mentoria da trilha.
          </p>

          <Button
            className="mt-5 h-11 w-full rounded-full font-bold"
            disabled={enrolling}
            onClick={handleMainCta}
          >
            {ctaLabel}
          </Button>
          {enrolling ? (
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">Processando inscrição…</p>
          ) : !track.myEnrollment && !user ? (
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">
              Entre com uma conta para se inscrever nesta trilha.
            </p>
          ) : null}

          <ul className="mt-5 space-y-2.5 border-t border-stone-100 dark:border-stone-800 pt-5 text-sm text-stone-600 dark:text-stone-300">
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              {track.courseCount} {track.courseCount === 1 ? 'curso completo' : 'cursos completos'}
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              {track.mentorshipSessions}{' '}
              {track.mentorshipSessions === 1
                ? 'sessão de mentoria 1:1'
                : 'sessões de mentoria 1:1'}
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              Progresso salvo automaticamente
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              Certificado de conclusão da trilha
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

/* ==================== ITEM: CURSO ==================== */

function CourseItemCard({
  item,
  enrolled,
  progress,
  onOpenCourse,
  onOpenClassroom,
}: {
  item: TrackDetailItemDTO
  enrolled: boolean
  progress?: { completed: number; total: number }
  onOpenCourse?: () => void
  onOpenClassroom?: () => void
}) {
  return (
    <article
      aria-label={`Etapa: curso ${item.title}`}
      tabIndex={0}
      onClick={onOpenCourse}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpenCourse?.()
        }
      }}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-colors hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 sm:flex-row"
    >
      <div
        className="h-28 w-full shrink-0 overflow-hidden rounded-xl sm:w-44"
        style={item.coverUrl ? undefined : avatarGradient(item.title)}
      >
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt={`Capa do curso ${item.title}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Library aria-hidden className="h-8 w-8 text-white/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Badge variant="outline" className="border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400">
          Curso
        </Badge>
        <h3 className="mt-2 font-bold leading-snug text-stone-900 dark:text-stone-50 group-hover:text-amber-900 dark:group-hover:text-amber-300">
          {item.title}
        </h3>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{item.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1">
            <PlayCircle aria-hidden className="h-3.5 w-3.5" />
            {item.lessonCount} {item.lessonCount === 1 ? 'aula' : 'aulas'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {formatTotalDuration(item.totalDurationMin)}
          </span>
          {item.liveCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 font-bold text-rose-600 dark:text-rose-400">
              <Radio aria-hidden className="h-3 w-3" />
              {item.liveCount} ao vivo
            </span>
          ) : null}
          {item.mentorshipCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
              <Users aria-hidden className="h-3 w-3" />
              Inclui {item.mentorshipCount}{' '}
              {item.mentorshipCount === 1 ? 'mentoria' : 'mentorias'}
            </span>
          ) : null}
        </div>
        {progress ? (
          <div className="mt-3 max-w-56">
            <Progress
              value={progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}
              className="h-2"
              aria-label={`${progress.completed} de ${progress.total} aulas concluídas`}
            />
            <p className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-400">
              {progress.completed}/{progress.total} aulas
            </p>
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-end sm:items-center">
        <Button
          variant={enrolled ? 'default' : 'outline'}
          className="h-10 rounded-full px-4 font-semibold"
          aria-label={enrolled ? `Estudar o curso ${item.title}` : `Ver o curso ${item.title}`}
          onClick={(event) => {
            event.stopPropagation()
            if (enrolled) onOpenClassroom?.()
            else onOpenCourse?.()
          }}
        >
          {enrolled ? 'Estudar' : 'Ver curso'}
        </Button>
      </div>
    </article>
  )
}

/* ==================== ITEM: MENTORIA ==================== */

function MentorshipItemCard({
  item,
  mentorName,
  onSchedule,
}: {
  item: TrackDetailItemDTO
  mentorName: string
  onSchedule: () => void
}) {
  return (
    <article
      aria-label={`Etapa: bloco de mentoria ${item.title}`}
      className="rounded-2xl border border-amber-100 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/50 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
        >
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug text-stone-900 dark:text-stone-50">{item.title}</h3>
          {item.description ? (
            <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{item.description}</p>
          ) : null}
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white dark:bg-stone-950/50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-900">
            <CalendarCheck aria-hidden className="h-3 w-3" />
            {item.sessionCount} {item.sessionCount === 1 ? 'sessão' : 'sessões'} de 60min
          </span>
        </div>
      </div>
      <Button
        size="sm"
        className="mt-4 h-10 w-full rounded-full bg-amber-700 font-semibold text-white hover:bg-amber-800 sm:w-auto sm:px-5"
        onClick={onSchedule}
        aria-label={`Agendar mentoria "${item.title}" com ${mentorName}`}
      >
        Agendar mentoria
      </Button>
    </article>
  )
}
