'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Library,
  Lock,
  PlayCircle,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  LEVEL_LABELS,
  avatarGradient,
  currencyBRL,
  formatTotalDuration,
  toVideoEmbedUrl,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { CourseDetailDTO, CourseLessonDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CourseView({ courseId }: { courseId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const [data, setData] = useState<CourseDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado da sala de aula (modo inscrito)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  // Estado da inscrição (modo visitante)
  const [enrolling, setEnrolling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  // Inicializa a sala de aula quando os dados (com matrícula) chegam:
  // a aula aberta por padrão é a primeira ainda não concluída.
  useEffect(() => {
    const enrollment = data?.enrollment
    if (!enrollment) return
    const sorted = [...data.lessons].sort((a, b) => a.order - b.order)
    setCompletedIds(enrollment.completedLessonIds)
    const firstIncomplete = sorted.find((l) => !enrollment.completedLessonIds.includes(l.id))
    setCurrentLessonId(firstIncomplete?.id ?? sorted[0]?.id ?? null)
  }, [data])

  const course = data

  const currentLesson = useMemo(
    () => lessons.find((l) => l.id === currentLessonId) ?? lessons[0] ?? null,
    [lessons, currentLessonId]
  )
  const currentIndex = currentLesson ? lessons.findIndex((l) => l.id === currentLesson.id) : -1
  const percent =
    lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0

  /* ---------- Inscrição (overview) ---------- */

  const doEnroll = async () => {
    if (!user || !course) return
    setEnrolling(true)
    try {
      const res = await api.enrollCourse(course.id, user.id)
      if (res.alreadyEnrolled) {
        toast.info('Você já estava inscrito neste curso.')
      } else {
        toast.success('Inscrição realizada! Boa jornada 🎉')
      }
      setConfirmOpen(false)
      // Busca novamente com o usuário: enrollment preenchido ativa o modo sala de aula
      const fresh = await api.getCourse(course.id, user.id)
      setData(fresh)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao realizar inscrição.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleEnrollClick = () => {
    if (!user) {
      toast.error('Entre com uma conta no topo da página para se inscrever.')
      return
    }
    if (!course) return
    if (course.price === 0) {
      void doEnroll()
    } else {
      setConfirmOpen(true)
    }
  }

  /* ---------- Progresso (classroom) ---------- */

  const toggleComplete = async () => {
    if (!user || !course || !currentLesson) return
    setToggling(true)
    try {
      const res = await api.toggleLessonComplete(course.id, {
        userId: user.id,
        lessonId: currentLesson.id,
      })
      const nowCompleted = res.completedLessonIds.includes(currentLesson.id)
      setCompletedIds(res.completedLessonIds)
      if (nowCompleted && res.completedLessonIds.length === lessons.length) {
        toast.success('Curso concluído! Parabéns 🎉')
      } else if (nowCompleted) {
        toast.success('Aula marcada como concluída.')
      } else {
        toast('Marcação removida desta aula.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o progresso.')
    } finally {
      setToggling(false)
    }
  }

  const goPrev = () => {
    if (currentLesson && currentIndex > 0) setCurrentLessonId(lessons[currentIndex - 1].id)
  }
  const goNext = () => {
    if (currentLesson && currentIndex < lessons.length - 1) {
      setCurrentLessonId(lessons[currentIndex + 1].id)
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

  const isEnrolled = course.enrollment !== null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <Button
        variant="ghost"
        onClick={() => navigate({ name: 'marketplace' })}
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
      </Button>

      {isEnrolled ? (
        <ClassroomContent
          course={course}
          lessons={lessons}
          currentLesson={currentLesson}
          currentIndex={currentIndex}
          percent={percent}
          completedIds={completedIds}
          toggling={toggling}
          onSelectLesson={setCurrentLessonId}
          onToggleComplete={() => void toggleComplete()}
          onPrev={goPrev}
          onNext={goNext}
        />
      ) : (
        <OverviewContent
          course={course}
          lessons={lessons}
          enrolling={enrolling}
          isLoggedIn={Boolean(user)}
          confirmOpen={confirmOpen}
          onConfirmOpenChange={setConfirmOpen}
          onEnrollClick={handleEnrollClick}
          onConfirmEnroll={() => void doEnroll()}
          onViewMentor={(mentorId) => navigate({ name: 'mentor', mentorId })}
        />
      )}
    </div>
  )
}

/* ==================== MODO VISITANTE (overview) ==================== */

function OverviewContent({
  course,
  lessons,
  enrolling,
  isLoggedIn,
  confirmOpen,
  onConfirmOpenChange,
  onEnrollClick,
  onConfirmEnroll,
  onViewMentor,
}: {
  course: CourseDetailDTO
  lessons: CourseLessonDTO[]
  enrolling: boolean
  isLoggedIn: boolean
  confirmOpen: boolean
  onConfirmOpenChange: (open: boolean) => void
  onEnrollClick: () => void
  onConfirmEnroll: () => void
  onViewMentor: (mentorId: string) => void
}) {
  return (
    <>
      {/* ---------- HERO ---------- */}
      <section
        aria-label={`Curso: ${course.title}`}
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={avatarGradient(course.title)}
      >
        <Library aria-hidden className="pointer-events-none absolute -right-6 -top-10 h-48 w-48 text-white/15" />
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
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="h-4 w-4" />
              {formatTotalDuration(course.totalDurationMin)}
            </span>
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
                  <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 sm:inline-flex">
                    {lesson.videoUrl ? (
                      <PlayCircle aria-hidden className="h-4 w-4" />
                    ) : (
                      <FileText aria-hidden className="h-4 w-4" />
                    )}
                    {lesson.durationMin} min
                  </span>
                  <Lock
                    aria-label="Aula bloqueada — inscreva-se para acessar"
                    className="h-3.5 w-3.5 shrink-0 text-stone-300"
                  />
                </li>
              ))}
            </ol>
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
              <Avatar name={course.mentor.name} size="lg" />
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
              Entre com uma conta no topo da página para se inscrever.
            </p>
          ) : null}

          <ul className="mt-5 space-y-2.5 border-t border-stone-100 pt-5 text-sm text-stone-600">
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'} (
              {formatTotalDuration(course.totalDurationMin)})
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Vídeos e materiais de apoio
            </li>
            <li className="flex items-start gap-2">
              <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              Avance no seu ritmo, onde quiser
            </li>
          </ul>
        </Card>
      </div>

      {/* ---------- DIALOG DE CONFIRMAÇÃO (curso pago) ---------- */}
      <Dialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold tracking-tight text-stone-900">
              Confirmar inscrição
            </DialogTitle>
            <DialogDescription>
              Você está prestes a se inscrever no curso abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="font-bold text-stone-900">{course.title}</p>
            <p className="mt-0.5 text-xs text-stone-500">
              por {course.mentor.name} · {course.lessonCount}{' '}
              {course.lessonCount === 1 ? 'aula' : 'aulas'} ·{' '}
              {formatTotalDuration(course.totalDurationMin)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3">
              <span className="text-sm text-stone-500">Total</span>
              <span className="text-lg font-extrabold text-stone-900">
                {currencyBRL(course.price)}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-400">
            (checkout demonstrativo — nenhuma cobrança real)
          </p>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => onConfirmOpenChange(false)}
              disabled={enrolling}
            >
              Cancelar
            </Button>
            <Button className="rounded-full font-bold" onClick={onConfirmEnroll} disabled={enrolling}>
              {enrolling ? 'Processando…' : `Confirmar · ${currencyBRL(course.price)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ==================== MODO INSCRITO (sala de aula) ==================== */

function ClassroomContent({
  course,
  lessons,
  currentLesson,
  currentIndex,
  percent,
  completedIds,
  toggling,
  onSelectLesson,
  onToggleComplete,
  onPrev,
  onNext,
}: {
  course: CourseDetailDTO
  lessons: CourseLessonDTO[]
  currentLesson: CourseLessonDTO | null
  currentIndex: number
  percent: number
  completedIds: string[]
  toggling: boolean
  onSelectLesson: (lessonId: string) => void
  onToggleComplete: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const completedCount = completedIds.length
  const embedUrl = currentLesson?.videoUrl ? toVideoEmbedUrl(currentLesson.videoUrl) : null
  const isCurrentCompleted = currentLesson ? completedIds.includes(currentLesson.id) : false

  return (
    <>
      {/* ---------- HEADER COMPACTO COM PROGRESSO ---------- */}
      <section
        aria-label={`Sala de aula: ${course.title}`}
        className="relative overflow-hidden rounded-2xl p-5 text-white sm:p-6"
        style={avatarGradient(course.title)}
      >
        <Library aria-hidden className="pointer-events-none absolute -right-4 -top-8 h-32 w-32 text-white/15" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-white/25 bg-white/15 text-white hover:bg-white/15">
                {course.category}
              </Badge>
              <Badge className="rounded-full border-white/25 bg-stone-900/30 text-white hover:bg-stone-900/30">
                {LEVEL_LABELS[course.level] ?? course.level}
              </Badge>
            </div>
            <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">{course.title}</h1>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-white/85">
              <Avatar name={course.mentor.name} size="sm" className="h-6 w-6 text-[10px]" />
              {course.mentor.name}
            </div>
          </div>

          <div className="w-full max-w-sm shrink-0">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span>
                {lessons.length > 0 && percent === 100
                  ? '100% concluído 🎉'
                  : `${completedCount} de ${lessons.length} aulas concluídas`}
              </span>
              <span className="tabular-nums text-emerald-100">{percent}%</span>
            </div>
            <Progress
              value={percent}
              aria-label="Progresso do curso"
              className="mt-2 h-2 bg-white/25 [&_[data-slot=progress-indicator]]:bg-white"
            />
          </div>
        </div>
      </section>

      {/* ---------- SALA DE AULA ---------- */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px,1fr]">
        {/* Currículo lateral */}
        <nav aria-label="Aulas do curso" className="rounded-2xl border border-stone-200 bg-white p-3">
          <p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-stone-400">
            Currículo do curso
          </p>
          <div className="max-h-[540px] space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
            {lessons.map((lesson, i) => {
              const isCurrent = currentLesson?.id === lesson.id
              const isCompleted = completedIds.includes(lesson.id)
              return (
                <button
                  key={lesson.id}
                  onClick={() => onSelectLesson(lesson.id)}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                    isCurrent
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-transparent hover:bg-stone-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 shrink-0 text-center text-xs font-bold',
                      isCurrent ? 'text-emerald-700' : 'text-stone-400'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    <span
                      className={cn(
                        isCompleted
                          ? 'text-stone-400 line-through decoration-stone-300'
                          : isCurrent
                            ? 'text-emerald-900'
                            : 'text-stone-700'
                      )}
                    >
                      {lesson.title}
                    </span>
                  </span>
                  {isCompleted ? (
                    <CheckCircle2
                      aria-label="Aula concluída"
                      className="h-5 w-5 shrink-0 fill-emerald-600 text-white"
                    />
                  ) : isCurrent ? (
                    <PlayCircle aria-hidden className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <span className="shrink-0 text-xs font-medium text-stone-400">
                      {lesson.durationMin} min
                    </span>
                  )}
                </button>
              )
            })}
            {lessons.length === 0 && (
              <p className="px-2 py-4 text-sm text-stone-400">Nenhuma aula publicada ainda.</p>
            )}
          </div>
        </nav>

        {/* Player da aula */}
        <Card className="rounded-2xl border-stone-200 p-5 shadow-none sm:p-6">
          {currentLesson ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline" className="border-stone-200 bg-stone-50 text-stone-600">
                  Aula {currentIndex + 1} de {lessons.length}
                </Badge>
                {isCurrentCompleted && (
                  <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                    Concluída
                  </Badge>
                )}
              </div>

              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
                {currentLesson.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                {currentLesson.description}
              </p>

              {embedUrl ? (
                <div className="mt-5">
                  <div className="aspect-video overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    <iframe
                      src={embedUrl}
                      title={`Vídeo da aula: ${currentLesson.title}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <a
                    href={currentLesson.videoUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-emerald-700"
                  >
                    <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                    Abrir no YouTube
                  </a>
                </div>
              ) : currentLesson.content ? (
                <article className="mt-5 max-w-prose space-y-4">
                  {currentLesson.content.split(/\n{2,}/).map((para, i) => (
                    <p
                      key={i}
                      className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700"
                    >
                      {para}
                    </p>
                  ))}
                </article>
              ) : (
                <div className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-dashed border-stone-200 px-6 py-10 text-center">
                  <FileText aria-hidden className="h-6 w-6 text-stone-300" />
                  <p className="text-sm text-stone-400">
                    O material desta aula será publicado em breve.
                  </p>
                </div>
              )}

              {/* Navegação de aulas */}
              <div className="mt-6 flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  className="h-10 rounded-full font-semibold"
                  onClick={onPrev}
                  disabled={currentIndex <= 0 || toggling}
                >
                  ← Anterior
                </Button>
                <Button
                  variant={isCurrentCompleted ? 'outline' : 'default'}
                  onClick={onToggleComplete}
                  disabled={toggling}
                  className={cn(
                    'h-10 rounded-full font-semibold',
                    isCurrentCompleted &&
                      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                  )}
                >
                  {toggling
                    ? 'Salvando…'
                    : isCurrentCompleted
                      ? 'Aula concluída ✓'
                      : 'Marcar como concluída'}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-full font-semibold"
                  onClick={onNext}
                  disabled={currentIndex >= lessons.length - 1 || toggling}
                >
                  Próxima →
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <BookOpen aria-hidden className="h-8 w-8 text-stone-300" />
              <p className="text-sm text-stone-400">
                Selecione uma aula no currículo para começar.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
