'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Folder,
  Library,
  Lock,
  PlayCircle,
  Radio,
  UserRound,
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
  formatTimeLabel,
  formatTotalDuration,
  toVideoEmbedUrl,
} from '@/lib/helpers'
import { loadTrackingScripts, trackEvent } from '@/lib/tracking'
import { useAppStore } from '@/lib/store'
import type { CourseDetailDTO, CourseLessonDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CourseView({ courseId }: { courseId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const [data, setData] = useState<CourseDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado da inscrição (modo visitante)
  const [enrolling, setEnrolling] = useState(false)

  // Tracking (GA4/Meta Pixel do mentor + view_item) — uma única vez por curso/montagem
  const trackedCourseRef = useRef<string | null>(null)

  const fetchCourse = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.getCourse(courseId, user?.id)
      setData(d)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o curso.')
    } finally {
      setLoading(false)
    }
  }, [courseId, user?.id])

  useEffect(() => {
    void fetchCourse()
  }, [fetchCourse])

  const lessons = useMemo<CourseLessonDTO[]>(
    () => [...(data?.lessons ?? [])].sort((a, b) => a.order - b.order),
    [data]
  )

  const course = data
  const isEnrolled = course?.enrollment != null
  const isOwner = Boolean(user && course && course.mentor.userId === user.id)

  // Dispara view_item + injeta os pixels do mentor quando os dados do curso chegam
  // (visitante ou inscrito), no máximo uma vez por curso por montagem.
  useEffect(() => {
    if (!course || trackedCourseRef.current === course.id) return
    trackedCourseRef.current = course.id
    loadTrackingScripts({
      mentorGaId: course.mentor.tracking?.gaMeasurementId,
      mentorPixelId: course.mentor.tracking?.metaPixelId,
    })
    trackEvent('view_item', {
      mentorId: course.mentor.id,
      courseId: course.id,
      value: course.price || undefined,
      contentName: course.title,
    })
  }, [course])

  /* ---------- Inscrição (overview) ---------- */

  const doEnroll = async () => {
    if (!user || !course) return
    setEnrolling(true)
    try {
      const res = await api.enrollCourse(course.id, user.id)
      if (res.alreadyEnrolled) {
        toast.info('Você já estava inscrito neste curso.')
        // Busca novamente com o usuário: enrollment preenchido mostra o modo inscrito
        const fresh = await api.getCourse(course.id, user.id)
        setData(fresh)
      } else {
        toast.success('Inscrição realizada! Boa jornada 🎉')
        await api.getCourse(course.id, user.id)
        // Nova inscrição: entra direto na sala de aula
        navigate({ name: 'classroom', courseId: course.id })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao realizar inscrição.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleEnrollClick = () => {
    if (!user) {
      toast.info('Entre com uma conta para se inscrever.')
      navigate({ name: 'auth', mode: 'login' })
      return
    }
    if (!course) return
    if (course.price === 0) {
      void doEnroll()
    } else {
      // Curso pago: fluxo completo de checkout (com atribuição e pixels carregados)
      trackEvent('begin_checkout', {
        mentorId: course.mentor.id,
        courseId: course.id,
        value: course.price || undefined,
        contentName: course.title,
      })
      navigate({ name: 'checkout', courseId: course.id })
    }
  }

  /* ---------- Renders auxiliares ---------- */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8" aria-busy="true">
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="mt-4 h-52 w-full rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <p className="sr-only">Carregando curso…</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
          </span>
          <p className="font-bold text-stone-900">Não foi possível carregar o curso</p>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500">
            {error ?? 'Curso não encontrado.'}
          </p>
          <Button variant="outline" className="rounded-full" onClick={() => void fetchCourse()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (isEnrolled || isOwner) {
    const done = course.enrollment?.completedLessonIds.length ?? 0
    const pct = course.lessonCount > 0 ? Math.round((done / course.lessonCount) * 100) : 0
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ name: 'marketplace' })}
          className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
        </Button>

        {/* Hero do aluno inscrito */}
        <section
          aria-label="Seu curso"
          className="relative mt-2 overflow-hidden rounded-3xl bg-emerald-950 p-6 text-white sm:p-8"
        >
          <div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
          <p className="relative inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            {isOwner && !isEnrolled ? 'Seu curso' : 'Inscrição ativa'}
          </p>
          <h1 className="relative mt-2 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            {course.title}
          </h1>
          <p className="relative mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-emerald-100/80">
            <span>por {course.mentor.name}</span>
            <span aria-hidden>·</span>
            <span>{course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'}</span>
            <span aria-hidden>·</span>
            <span>{formatTotalDuration(course.totalDurationMin)}</span>
          </p>
          <div className="relative mt-5 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate({ name: 'classroom', courseId: course.id })}
              aria-label="Abrir a sala de aula"
              className="h-12 rounded-full bg-white px-7 font-bold text-emerald-950 hover:bg-emerald-100"
            >
              <PlayCircle aria-hidden className="h-5 w-5" />
              {done > 0 ? 'Continuar curso' : 'Começar agora'}
            </Button>
            <div className="min-w-40 flex-1 max-w-xs" aria-hidden>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-100/80">
                <span>Seu progresso</span>
                <span className="tabular-nums">{pct}%</span>
              </div>
              <Progress
                value={pct}
                aria-label="Progresso do curso"
                className="mt-1.5 h-2 bg-white/15 [&_[data-slot=progress-indicator]]:bg-emerald-400"
              />
              <p className="mt-1 text-[11px] text-emerald-100/60">
                {done} de {course.lessonCount} {course.lessonCount === 1 ? 'aula concluída' : 'aulas concluídas'}
              </p>
            </div>
          </div>
        </section>

        <OverviewContent
          course={course}
          lessons={lessons}
          enrolling={false}
          isLoggedIn={Boolean(user)}
          enrolled
          onContinue={() => navigate({ name: 'classroom', courseId: course.id })}
          onEnrollClick={handleEnrollClick}
          onLogin={() => navigate({ name: 'auth', mode: 'login' })}
          onViewMentor={(mentorId) => navigate({ name: 'mentor', mentorId })}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <Button
        variant="ghost"
        onClick={() => navigate({ name: 'marketplace' })}
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
      </Button>

      <OverviewContent
        course={course}
        lessons={lessons}
        enrolling={enrolling}
        isLoggedIn={Boolean(user)}
        onContinue={
          course.enrollment || isOwner
            ? () => navigate({ name: 'classroom', courseId: course.id })
            : undefined
        }
        onEnrollClick={handleEnrollClick}
        onLogin={() => navigate({ name: 'auth', mode: 'login' })}
        onViewMentor={(mentorId) => navigate({ name: 'mentor', mentorId })}
      />
    </div>
  )
}

/* ==================== MODO VISITANTE (overview) ==================== */

function OverviewContent({
  course,
  lessons,
  enrolling,
  isLoggedIn,
  enrolled = false,
  onContinue,
  onEnrollClick,
  onLogin,
  onViewMentor,
}: {
  course: CourseDetailDTO
  lessons: CourseLessonDTO[]
  enrolling: boolean
  isLoggedIn: boolean
  enrolled?: boolean
  onContinue?: () => void
  onEnrollClick: () => void
  onLogin: () => void
  onViewMentor: (mentorId: string) => void
}) {
  // Currículo agrupado por temas (em ordem); aulas sem tema → "Outros conteúdos" no fim
  const themes = useMemo(
    () => [...(course.themes ?? [])].sort((a, b) => a.order - b.order),
    [course]
  )
  const curriculumGroups = useMemo(() => {
    const byTheme = new Map<string, CourseLessonDTO[]>()
    const loose: CourseLessonDTO[] = []
    for (const lesson of lessons) {
      if (lesson.themeId && themes.some((t) => t.id === lesson.themeId)) {
        const bucket = byTheme.get(lesson.themeId) ?? []
        bucket.push(lesson)
        byTheme.set(lesson.themeId, bucket)
      } else {
        loose.push(lesson)
      }
    }
    const groups: { key: string; title: string; lessons: CourseLessonDTO[] }[] = themes.map((t) => ({
      key: t.id,
      title: t.title,
      lessons: byTheme.get(t.id) ?? [],
    }))
    if (loose.length > 0) groups.push({ key: 'none', title: 'Outros conteúdos', lessons: loose })
    return groups
  }, [lessons, themes])
  return (
    <>
      {/* ---------- HERO (oculto no modo inscrito: já existe o hero de progresso) ---------- */}
      {!enrolled && (
      <section
        aria-label={`Curso: ${course.title}`}
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={avatarGradient(course.title)}
      >
        {course.coverUrl && (
          <>
            <img
              src={course.coverUrl}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden className="absolute inset-0 bg-stone-950/55" />
          </>
        )}
        {!course.coverUrl && (
          <Library aria-hidden className="pointer-events-none absolute -right-6 -top-10 h-48 w-48 text-white/15" />
        )}
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border-white/25 bg-white/15 text-white hover:bg-white/15">
              {course.category}
            </Badge>
            <Badge className="rounded-full border-white/25 bg-stone-900/30 text-white hover:bg-stone-900/30">
              {LEVEL_LABELS[course.level] ?? course.level}
            </Badge>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-[15px]">
            {course.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen aria-hidden className="h-4 w-4" />
              {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'}
            </span>
            {course.liveCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/25 px-2.5 py-0.5 font-semibold">
                <Radio aria-hidden className="h-4 w-4" />
                {course.liveCount} ao vivo
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="h-4 w-4" />
              {formatTotalDuration(course.totalDurationMin)}
            </span>
            {course.mentorshipCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <UserRound aria-hidden className="h-4 w-4" />
                {course.mentorshipCount} mentoria{course.mentorshipCount > 1 ? 's' : ''} 1:1
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="h-4 w-4" />
              {course.studentCount} {course.studentCount === 1 ? 'aluno' : 'alunos'}
            </span>
            <span className="font-extrabold">
              {course.price === 0 ? 'Grátis' : currencyBRL(course.price)}
            </span>
          </div>
        </div>
      </section>
      )}

      {/* ---------- CONTEÚDO ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* O que você vai aprender */}
          <section
            aria-labelledby="aprender-title"
            className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
          >
            <h2 id="aprender-title" className="text-lg font-extrabold tracking-tight text-stone-900">
              O que você vai aprender
            </h2>
            {lessons.length > 0 ? (
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {lessons.slice(0, 6).map((lesson) => (
                  <li key={lesson.id} className="flex items-start gap-2.5 text-sm text-stone-700">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="leading-snug">{lesson.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-400">
                As aulas deste curso estão sendo preparadas.
              </p>
            )}
          </section>

          {/* Currículo */}
          <section
            aria-labelledby="curriculo-title"
            className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="curriculo-title" className="text-lg font-extrabold tracking-tight text-stone-900">
                Currículo do curso
              </h2>
              {lessons.length > 0 && (
                <span className="text-xs font-medium text-stone-400">
                  {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'} ·{' '}
                  {formatTotalDuration(course.totalDurationMin)}
                </span>
              )}
            </div>
            {themes.length > 0 ? (
              <div className="mt-4 space-y-6">
                {curriculumGroups.map((group, gi) => {
                  const groupDuration = group.lessons.reduce((acc, l) => acc + l.durationMin, 0)
                  return (
                    <section key={group.key} aria-label={`Tema: ${group.title}`}>
                      <header className="flex items-center gap-3">
                        {group.key === 'none' ? (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100">
                            <Folder aria-hidden className="h-4 w-4 text-stone-500" />
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                            {gi + 1}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-stone-900">{group.title}</p>
                          <p className="text-xs text-stone-400">
                            {group.lessons.length} {group.lessons.length === 1 ? 'aula' : 'aulas'} ·{' '}
                            {formatTotalDuration(groupDuration)}
                          </p>
                        </div>
                      </header>
                      <ol className="mt-1 divide-y divide-stone-100">
                        {group.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center gap-3 py-3 first:pt-3 last:pb-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100">
                              {lesson.kind === 'LIVE' ? (
                                <Radio aria-hidden className="h-3.5 w-3.5 text-rose-500" />
                              ) : lesson.kind === 'READING' ? (
                                <BookOpen aria-hidden className="h-3.5 w-3.5 text-amber-600" />
                              ) : lesson.videoUrl ? (
                                <PlayCircle aria-hidden className="h-3.5 w-3.5 text-stone-500" />
                              ) : (
                                <FileText aria-hidden className="h-3.5 w-3.5 text-stone-500" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-stone-800">{lesson.title}</p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-stone-400">{lesson.description}</p>
                            </div>
                            {lesson.kind === 'LIVE' ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                                <Radio aria-hidden className="h-3 w-3" />
                                {lesson.startsAt
                                  ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
                                  : 'Ao vivo'}
                              </span>
                            ) : null}
                            {lesson.kind === 'READING' ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                                <BookOpen aria-hidden className="h-3 w-3" />
                                {lesson.reading?.kind === 'BOOK' ? 'Livro' : 'Artigo'}
                              </span>
                            ) : null}
                            {lesson.kind !== 'LIVE' ? (
                              <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 sm:inline-flex">
                                {lesson.durationMin} min
                              </span>
                            ) : null}
                            <Lock
                              aria-label="Aula bloqueada — inscreva-se para acessar"
                              className="h-3.5 w-3.5 shrink-0 text-stone-300"
                            />
                          </li>
                        ))}
                      </ol>
                    </section>
                  )
                })}
              </div>
            ) : (
              <ol className="mt-3 divide-y divide-stone-100">
                {lessons.map((lesson, i) => (
                  <li key={lesson.id} className="flex items-center gap-3 py-3.5 first:pt-4 last:pb-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">{lesson.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-stone-400">{lesson.description}</p>
                    </div>
                    {lesson.kind === 'LIVE' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                        <Radio aria-hidden className="h-3 w-3" />
                        {lesson.startsAt
                          ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
                          : 'Ao vivo'}
                      </span>
                    ) : (
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 sm:inline-flex">
                        {lesson.kind === 'READING' ? (
                          <BookOpen aria-hidden className="h-4 w-4 text-amber-500" />
                        ) : lesson.videoUrl ? (
                          <PlayCircle aria-hidden className="h-4 w-4" />
                        ) : (
                          <FileText aria-hidden className="h-4 w-4" />
                        )}
                        {lesson.durationMin} min
                      </span>
                    )}
                    <Lock
                      aria-label="Aula bloqueada — inscreva-se para acessar"
                      className="h-3.5 w-3.5 shrink-0 text-stone-300"
                    />
                  </li>
                ))}
              </ol>
            )}
            {lessons.length === 0 && (
              <p className="py-4 text-sm text-stone-400">Nenhuma aula publicada ainda.</p>
            )}
          </section>

          {/* Mentor */}
          <section
            aria-label="Mentor do curso"
            className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={course.mentor.name} src={course.mentor.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-900">{course.mentor.name}</p>
                <p className="line-clamp-1 text-sm text-stone-500">{course.mentor.headline}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Stars rating={course.mentor.rating} size={13} />
                  <span className="text-xs font-semibold text-stone-700">
                    {course.mentor.rating > 0 ? course.mentor.rating.toFixed(1) : 'Novo'}
                  </span>
                  <span className="text-xs text-stone-400">
                    ({course.mentor.reviewCount} {course.mentor.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                className="h-10 rounded-full font-semibold"
                onClick={() => onViewMentor(course.mentor.id)}
                aria-label={`Ver perfil de ${course.mentor.name}`}
              >
                Ver perfil
              </Button>
            </div>
          </section>
        </div>

        {/* ---------- SIDEBAR DE INSCRIÇÃO ---------- */}
        <Card className="self-start rounded-2xl border-stone-200 p-6 shadow-none lg:sticky lg:top-6">
          {enrolled ? (
            <>
              <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-emerald-800">
                <Check aria-hidden className="h-5 w-5" /> Você já está inscrito
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Todo o conteúdo, perguntas e anotações estão liberados na sua sala de aula.
              </p>
              <Button
                className="mt-5 h-11 w-full rounded-full font-bold"
                onClick={onContinue}
                aria-label="Abrir a sala de aula"
                disabled={!onContinue}
              >
                <PlayCircle aria-hidden className="h-4.5 w-4.5" /> Continuar curso
              </Button>
            </>
          ) : (
            <>
              <p
                className={cn(
                  'text-3xl font-extrabold tracking-tight',
                  course.price === 0 ? 'text-emerald-700' : 'text-stone-900'
                )}
              >
                {course.price === 0 ? 'Grátis' : currencyBRL(course.price)}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {course.price === 0
                  ? 'Acesso gratuito a todo o conteúdo.'
                  : 'Pagamento único, acesso ao conteúdo completo.'}
              </p>

              <Button
                className="mt-5 h-11 w-full rounded-full font-bold"
                onClick={onEnrollClick}
                disabled={enrolling}
              >
                {enrolling
                  ? 'Inscrevendo…'
                  : course.price === 0
                    ? 'Inscrever-se gratuitamente'
                    : 'Inscrever-se no curso'}
              </Button>
          {enrolling ? (
            <p className="mt-2 text-center text-xs text-stone-400">Processando inscrição…</p>
          ) : !isLoggedIn ? (
            <p className="mt-2 text-center text-xs text-stone-400">
              Entre com uma conta para se inscrever.{' '}
              <button
                type="button"
                onClick={onLogin}
                className="font-semibold text-emerald-700 underline underline-offset-2 transition-colors hover:text-emerald-800"
              >
                Entrar
              </button>
            </p>
          ) : null}

          <ul className="mt-5 space-y-2.5 border-t border-stone-100 pt-5 text-sm text-stone-600">
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'} (
              {formatTotalDuration(course.totalDurationMin)})
            </li>
            {course.liveCount > 0 ? (
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {course.liveCount} aula{course.liveCount > 1 ? 's' : ''} ao vivo com o mentor
              </li>
            ) : null}
            {course.mentorshipCount > 0 ? (
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {course.mentorshipCount} {course.mentorshipCount > 1 ? 'sessões' : 'sessão'} de mentoria 1:1 inclusa{course.mentorshipCount > 1 ? 's' : ''}
              </li>
            ) : null}
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Materiais e anexos para download
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Perguntas respondidas pelo mentor
            </li>
          </ul>

          {course.mentorshipCount > 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                <UserRound aria-hidden className="h-4 w-4 text-emerald-700" />
                Mentorias 1:1 inclusas
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/80">
                Este curso inclui {course.mentorshipCount} {course.mentorshipCount > 1 ? 'sessões' : 'sessão'} de
                mentoria individual com {course.mentor.name.split(' ')[0]}. Agende após se inscrever.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-full border-emerald-200 bg-white font-semibold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                onClick={() => onViewMentor(course.mentor.id)}
              >
                Ver disponibilidade do mentor
              </Button>
            </div>
          ) : null}
            </>
          )}
        </Card>
      </div>
    </>
  )
}
