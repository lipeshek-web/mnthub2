'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
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
  Star,
  UserRound,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import type { CourseDetailDTO, CourseLessonDTO, CourseReviewDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CourseView({ courseId }: { courseId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const [data, setData] = useState<CourseDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado da inscrição (modo visitante)
  const [enrolling, setEnrolling] = useState(false)

  // Estado de envio da avaliação do aluno (modo inscrito)
  const [reviewSaving, setReviewSaving] = useState(false)

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

  /* ---------- Avaliação do curso (aluno inscrito) ---------- */

  const handleSaveReview = async (rating: number, comment: string) => {
    if (!user || !course) return
    setReviewSaving(true)
    try {
      const res: { id: string; updated: boolean; createdAt?: string } =
        await api.saveCourseReview(course.id, { userId: user.id, rating, comment })

      const saved: CourseReviewDTO = {
        id: res.id,
        rating,
        comment,
        createdAt: res.createdAt ?? new Date().toISOString(),
        student: { id: user.id, name: user.name, avatarUrl: user.avatarUrl ?? null },
      }

      // Reflete localmente: atualiza/insere a review na lista, recalcula o resumo
      // (distribuição → média) e preenche myReview para pré-preencher o formulário.
      setData((prev) => {
        if (!prev) return prev
        const list = [...(prev.reviews ?? [])]
        const idx = list.findIndex((r) => r.student.id === user.id)
        const oldRating = idx >= 0 ? list[idx].rating : null
        if (idx >= 0) list[idx] = saved
        else list.unshift(saved)

        const dist = [...(prev.reviewSummary?.distribution ?? [0, 0, 0, 0, 0])]
        if (oldRating != null) {
          dist[5 - oldRating] = Math.max(0, (dist[5 - oldRating] ?? 0) - 1)
        }
        dist[5 - rating] = (dist[5 - rating] ?? 0) + 1
        const total = dist.reduce((acc, n, i) => acc + n * (5 - i), 0)
        const newCount = dist.reduce((acc, n) => acc + n, 0)
        const avg = newCount > 0 ? Math.round((total / newCount) * 10) / 10 : 0

        return {
          ...prev,
          reviews: list.slice(0, 20),
          reviewSummary: { rating: avg, count: newCount, distribution: dist },
          myReview: { rating, comment },
          rating: avg,
          reviewCount: newCount,
        }
      })

      toast.success(
        res.updated ? 'Avaliação atualizada!' : 'Avaliação enviada! Obrigada pela contribuição 💚'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar sua avaliação.')
    } finally {
      setReviewSaving(false)
    }
  }

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
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50">
            <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
          </span>
          <p className="font-bold text-stone-900 dark:text-stone-50">Não foi possível carregar o curso</p>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
    const enr = course.enrollment
    // Curso 100% concluído → destaque suave no card de avaliação
    const allDone =
      enr != null && lessons.length > 0 && enr.completedLessonIds.length >= lessons.length
    // Remonta o formulário quando a avaliação salva do servidor muda (pré-preencher)
    const reviewFormKey = course.myReview
      ? `${course.id}-saved-${course.myReview.rating}-${course.myReview.comment.length}`
      : `${course.id}-new`
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ name: 'marketplace' })}
          className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50"
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
          currentUserId={user?.id ?? null}
          reviewFormNode={
            enr ? (
              <ReviewFormCard
                key={reviewFormKey}
                myReview={course.myReview}
                completed={allDone}
                saving={reviewSaving}
                onSubmit={handleSaveReview}
              />
            ) : null
          }
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
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
      </Button>

      <OverviewContent
        course={course}
        lessons={lessons}
        enrolling={enrolling}
        isLoggedIn={Boolean(user)}
        currentUserId={user?.id ?? null}
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
  currentUserId = null,
  reviewFormNode = null,
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
  currentUserId?: string | null
  reviewFormNode?: ReactNode
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
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
          >
            <h2 id="aprender-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              O que você vai aprender
            </h2>
            {lessons.length > 0 ? (
              <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {lessons.slice(0, 6).map((lesson) => (
                  <li key={lesson.id} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-200">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="leading-snug">{lesson.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-400 dark:text-stone-500">
                As aulas deste curso estão sendo preparadas.
              </p>
            )}
          </section>

          {/* Currículo */}
          <section
            aria-labelledby="curriculo-title"
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="curriculo-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                Currículo do curso
              </h2>
              {lessons.length > 0 && (
                <span className="text-xs font-medium text-stone-400 dark:text-stone-500">
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
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                            <Folder aria-hidden className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                            {gi + 1}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">{group.title}</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">
                            {group.lessons.length} {group.lessons.length === 1 ? 'aula' : 'aulas'} ·{' '}
                            {formatTotalDuration(groupDuration)}
                          </p>
                        </div>
                      </header>
                      <ol className="mt-1 divide-y divide-stone-100 dark:divide-stone-800">
                        {group.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center gap-3 py-3 first:pt-3 last:pb-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                              {lesson.kind === 'LIVE' ? (
                                <Radio aria-hidden className="h-3.5 w-3.5 text-rose-500" />
                              ) : lesson.kind === 'READING' ? (
                                <BookOpen aria-hidden className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              ) : lesson.videoUrl ? (
                                <PlayCircle aria-hidden className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
                              ) : (
                                <FileText aria-hidden className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-200">{lesson.title}</p>
                              <p className="mt-0.5 line-clamp-1 text-xs text-stone-400 dark:text-stone-500">{lesson.description}</p>
                            </div>
                            {lesson.kind === 'LIVE' ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <Radio aria-hidden className="h-3 w-3" />
                                {lesson.startsAt
                                  ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
                                  : 'Ao vivo'}
                              </span>
                            ) : null}
                            {lesson.kind === 'READING' ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                <BookOpen aria-hidden className="h-3 w-3" />
                                {lesson.reading?.kind === 'BOOK' ? 'Livro' : 'Artigo'}
                              </span>
                            ) : null}
                            {lesson.kind !== 'LIVE' ? (
                              <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 dark:text-stone-500 sm:inline-flex">
                                {lesson.durationMin} min
                              </span>
                            ) : null}
                            <Lock
                              aria-label="Aula bloqueada — inscreva-se para acessar"
                              className="h-3.5 w-3.5 shrink-0 text-stone-300 dark:text-stone-600"
                            />
                          </li>
                        ))}
                      </ol>
                    </section>
                  )
                })}
              </div>
            ) : (
              <ol className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
                {lessons.map((lesson, i) => (
                  <li key={lesson.id} className="flex items-center gap-3 py-3.5 first:pt-4 last:pb-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-xs font-bold text-stone-500 dark:text-stone-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800 dark:text-stone-200">{lesson.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-stone-400 dark:text-stone-500">{lesson.description}</p>
                    </div>
                    {lesson.kind === 'LIVE' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        <Radio aria-hidden className="h-3 w-3" />
                        {lesson.startsAt
                          ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
                          : 'Ao vivo'}
                      </span>
                    ) : (
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 dark:text-stone-500 sm:inline-flex">
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
                      className="h-3.5 w-3.5 shrink-0 text-stone-300 dark:text-stone-600"
                    />
                  </li>
                ))}
              </ol>
            )}
            {lessons.length === 0 && (
              <p className="py-4 text-sm text-stone-400 dark:text-stone-500">Nenhuma aula publicada ainda.</p>
            )}
          </section>

          {/* Avaliações dos alunos (público — visitante e inscrito) */}
          <CourseReviewsSection
            reviews={course.reviews ?? []}
            summary={
              course.reviewSummary ?? { rating: 0, count: 0, distribution: [0, 0, 0, 0, 0] }
            }
            currentUserId={currentUserId}
          />

          {/* Mentor */}
          <section
            aria-label="Mentor do curso"
            className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={course.mentor.name} src={course.mentor.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-900 dark:text-stone-50">{course.mentor.name}</p>
                <p className="line-clamp-1 text-sm text-stone-500 dark:text-stone-400">{course.mentor.headline}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Stars rating={course.mentor.rating} size={13} />
                  <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                    {course.mentor.rating > 0 ? course.mentor.rating.toFixed(1) : 'Novo'}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
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
        <div className="min-w-0 space-y-6 self-start lg:sticky lg:top-6">
        <Card className="rounded-2xl border-stone-200 dark:border-stone-800 p-6 shadow-none">
          {enrolled ? (
            <>
              <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-emerald-800 dark:text-emerald-300">
                <Check aria-hidden className="h-5 w-5" /> Você já está inscrito
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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
                  course.price === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-900 dark:text-stone-50'
                )}
              >
                {course.price === 0 ? 'Grátis' : currencyBRL(course.price)}
              </p>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
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
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">Processando inscrição…</p>
          ) : !isLoggedIn ? (
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">
              Entre com uma conta para se inscrever.{' '}
              <button
                type="button"
                onClick={onLogin}
                className="font-semibold text-emerald-700 dark:text-emerald-300 underline underline-offset-2 transition-colors hover:text-emerald-800 dark:hover:text-emerald-200"
              >
                Entrar
              </button>
            </p>
          ) : null}

          <ul className="mt-5 space-y-2.5 border-t border-stone-100 dark:border-stone-800 pt-5 text-sm text-stone-600 dark:text-stone-300">
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'} (
              {formatTotalDuration(course.totalDurationMin)})
            </li>
            {course.liveCount > 0 ? (
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {course.liveCount} aula{course.liveCount > 1 ? 's' : ''} ao vivo com o mentor
              </li>
            ) : null}
            {course.mentorshipCount > 0 ? (
              <li className="flex items-start gap-2">
                <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {course.mentorshipCount} {course.mentorshipCount > 1 ? 'sessões' : 'sessão'} de mentoria 1:1 inclusa{course.mentorshipCount > 1 ? 's' : ''}
              </li>
            ) : null}
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Materiais e anexos para download
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Perguntas respondidas pelo mentor
            </li>
          </ul>

          {course.mentorshipCount > 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
                <UserRound aria-hidden className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                Mentorias 1:1 inclusas
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/80 dark:text-emerald-300/80">
                Este curso inclui {course.mentorshipCount} {course.mentorshipCount > 1 ? 'sessões' : 'sessão'} de
                mentoria individual com {course.mentor.name.split(' ')[0]}. Agende após se inscrever.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full rounded-full border-emerald-200 dark:border-emerald-900 bg-white dark:bg-stone-900 font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:text-emerald-800 dark:hover:text-emerald-200"
                onClick={() => onViewMentor(course.mentor.id)}
              >
                Ver disponibilidade do mentor
              </Button>
            </div>
          ) : null}
            </>
          )}
        </Card>
        {reviewFormNode}
        </div>
      </div>
    </>
  )
}

/* ==================== CARD "AVALIAR ESTE CURSO" (modo inscrito) ==================== */

function ReviewFormCard({
  myReview,
  completed,
  saving,
  onSubmit,
}: {
  myReview: { rating: number; comment: string } | null
  /** true quando o aluno concluiu 100% das aulas (destaque para avaliar) */
  completed: boolean
  saving: boolean
  onSubmit: (rating: number, comment: string) => Promise<void>
}) {
  const [rating, setRating] = useState(myReview?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(myReview?.comment ?? '')

  // O componente é remontado (via key no pai) sempre que a avaliação salva do
  // servidor muda — o estado inicial já nasce pré-preenchido com myReview.

  const shown = hover || rating

  const submit = () => {
    if (rating < 1 || saving) return
    void onSubmit(rating, comment.trim())
  }

  return (
    <Card className="rounded-2xl border-stone-200 dark:border-stone-800 p-6 shadow-none">
      <p className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">Avaliar este curso</p>

      {completed && !myReview ? (
        <p className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-300">
          <Star aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
          Você concluiu o curso! Deixe sua avaliação ⭐
        </p>
      ) : myReview ? (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Sua avaliação está salva — você pode atualizá-la quando quiser.
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Como foi sua experiência? Sua nota ajuda outros alunos.
        </p>
      )}

      <div
        role="radiogroup"
        aria-label="Sua nota para o curso"
        className="mt-4 flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const active = i <= shown
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} ${i === 1 ? 'estrela' : 'estrelas'}`}
              disabled={saving}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:pointer-events-none"
            >
              <Star
                aria-hidden
                className={cn(
                  'h-6 w-6 transition-colors',
                  active ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'
                )}
              />
            </button>
          )
        })}
        {rating > 0 ? (
          <span className="ml-2 text-sm font-bold tabular-nums text-stone-700 dark:text-stone-200">
            {rating.toFixed(1).replace('.', ',')}
          </span>
        ) : null}
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 800))}
        maxLength={800}
        rows={4}
        placeholder="Conte como foi sua experiência (opcional)"
        aria-label="Comentário da avaliação (opcional)"
        className="mt-3 min-h-24 resize-none rounded-2xl border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm focus-visible:ring-emerald-600/30"
      />
      <p className="mt-1 text-right text-[11px] tabular-nums text-stone-400 dark:text-stone-500">{comment.length}/800</p>

      <Button
        onClick={submit}
        disabled={rating < 1 || saving}
        className="mt-2 h-11 w-full rounded-full bg-emerald-700 font-bold text-white hover:bg-emerald-800"
      >
        {saving ? 'Enviando…' : myReview ? 'Atualizar minha avaliação' : 'Enviar avaliação'}
      </Button>
    </Card>
  )
}

/* ==================== SEÇÃO "AVALIAÇÕES DOS ALUNOS" (pública) ==================== */

/** Data relativa/curta em pt-BR: "agora", "há 5 min", "ontem", "12 de mai. de 2025" */
function reviewDateLabel(iso: string): string {
  const d = new Date(iso)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const hours = Math.floor(diffMin / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CourseReviewsSection({
  reviews,
  summary,
  currentUserId,
}: {
  reviews: CourseReviewDTO[]
  summary: { rating: number; count: number; distribution: number[] }
  currentUserId?: string | null
}) {
  const count = summary.count

  return (
    <section
      aria-labelledby="avaliacoes-title"
      className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6"
    >
      <h2 id="avaliacoes-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
        Avaliações dos alunos
      </h2>

      {count === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 px-4 py-6 text-center text-sm text-stone-400 dark:text-stone-500">
          Este curso ainda não tem avaliações — seja o primeiro a avaliar!
        </p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
          {/* Resumo: nota grande + distribuição por estrela */}
          <div className="self-start rounded-2xl bg-stone-50/80 dark:bg-stone-950/50 p-4">
            <p className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              {summary.rating.toFixed(1).replace('.', ',')}
            </p>
            <Stars rating={summary.rating} size={15} className="mt-1.5" />
            <p className="mt-1 text-xs font-medium text-stone-500 dark:text-stone-400">
              {count} {count === 1 ? 'avaliação' : 'avaliações'}
            </p>
            <div className="mt-4 space-y-1.5" role="group" aria-label="Distribuição das notas">
              {summary.distribution.map((n, i) => {
                const star = 5 - i
                const pct = count > 0 ? Math.round((n / count) * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-1.5">
                    <span className="w-3 shrink-0 text-right text-[11px] font-semibold tabular-nums text-stone-500 dark:text-stone-400">
                      {star}
                    </span>
                    <Star aria-hidden className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-stone-400 dark:text-stone-500">
                      {n}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lista de avaliações */}
          <ul className="min-w-0 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={review.student.name} src={review.student.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">
                        {review.student.name}
                      </p>
                      {review.student.id === currentUserId ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          Você
                        </span>
                      ) : null}
                    </div>
                    <Stars rating={review.rating} size={12} className="mt-0.5" />
                  </div>
                  <span className="shrink-0 text-xs text-stone-400 dark:text-stone-500">
                    {reviewDateLabel(review.createdAt)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2.5 text-sm leading-relaxed text-stone-700 dark:text-stone-200">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
