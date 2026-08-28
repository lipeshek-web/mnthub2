'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileDown,
  FileText,
  Library,
  Lock,
  MessageCircle,
  Paperclip,
  PencilLine,
  PlayCircle,
  Radio,
  Send,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  LEVEL_LABELS,
  avatarGradient,
  formatDayLabel,
  formatTimeLabel,
  formatTotalDuration,
  liveStatus,
  toVideoEmbedUrl,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type {
  CourseDetailDTO,
  CourseLessonDTO,
  LessonQuestionDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

/* ==================== SALA DE AULA PROFISSIONAL ====================
   Tela cheia (só o header da plataforma): player de um lado, lista de
   conteúdos do outro, com Q&A, anotações e anexos por aula. */

export function ClassroomView({ courseId }: { courseId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const [data, setData] = useState<CourseDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [toggling, setToggling] = useState(false)

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

  const course = data
  const isOwner = Boolean(user && course && course.mentor.userId === user.id)
  const isEnrolled = course?.enrollment != null
  const hasAccess = isEnrolled || isOwner

  const lessons = useMemo<CourseLessonDTO[]>(
    () => [...(course?.lessons ?? [])].sort((a, b) => a.order - b.order),
    [course]
  )

  // Aula inicial: primeira ainda não concluída (só define uma vez por curso)
  const initializedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!course || !hasAccess) return
    if (initializedRef.current === course.id) return
    initializedRef.current = course.id
    const enrollment = course.enrollment
    const completed = enrollment?.completedLessonIds ?? []
    setCompletedIds(completed)
    const firstIncomplete = lessons.find((l) => !completed.includes(l.id))
    setCurrentLessonId(firstIncomplete?.id ?? lessons[0]?.id ?? null)
  }, [course, hasAccess, lessons])

  const currentLesson = useMemo(
    () => lessons.find((l) => l.id === currentLessonId) ?? lessons[0] ?? null,
    [lessons, currentLessonId]
  )
  const currentIndex = currentLesson ? lessons.findIndex((l) => l.id === currentLesson.id) : -1
  const percent = lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0

  const selectLesson = (lessonId: string) => setCurrentLessonId(lessonId)

  const toggleComplete = async (autoAdvance = false) => {
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
      if (autoAdvance && nowCompleted && currentIndex < lessons.length - 1) {
        setCurrentLessonId(lessons[currentIndex + 1].id)
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

  /* ---------- Estados de tela ---------- */

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col" aria-busy="true">
        <div className="flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="ml-auto h-6 w-28 rounded-full" />
        </div>
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4 p-4 sm:p-6">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="hidden space-y-2 border-l border-stone-200 bg-white p-4 lg:block">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        </div>
        <p className="sr-only">Abrindo sala de aula…</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
          </span>
          <p className="font-bold text-stone-900">Não foi possível abrir a sala de aula</p>
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

  if (!hasAccess) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-stone-200 p-8 text-center shadow-none">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
            <Lock aria-hidden className="h-6 w-6 text-amber-600" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold tracking-tight text-stone-900">
            {course.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            Você ainda não tem acesso a este curso. Inscreva-se para desbloquear todas as aulas,
            perguntas e anotações.
          </p>
          <Button
            className="mt-5 h-11 w-full rounded-full font-bold"
            onClick={() => navigate({ name: 'course', courseId })}
          >
            Ver o curso e se inscrever
          </Button>
        </Card>
      </div>
    )
  }

  const firstName = course.mentor.name.split(' ')[0]

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-50" aria-label={`Sala de aula: ${course.title}`}>
      {/* ---------- BARRA SUPERIOR COMPACTA ---------- */}
      <div className="flex shrink-0 items-center gap-2 border-b border-stone-200 bg-white px-3 py-2.5 sm:gap-3 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          aria-label="Voltar para a visão geral do curso"
          onClick={() => navigate({ name: 'course', courseId })}
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-tight text-stone-900 sm:text-base">
            {course.title}
          </p>
          <p className="hidden text-xs text-stone-400 sm:block">
            {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'} ·{' '}
            {formatTotalDuration(course.totalDurationMin)}
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex" aria-hidden>
          <Avatar
            name={course.mentor.name}
            src={course.mentor.avatarUrl}
            size="sm"
            className="h-6 w-6 text-[10px]"
          />
          <span className="max-w-36 truncate text-xs font-semibold text-stone-600">
            {course.mentor.name}
          </span>
        </div>
        <div className="flex w-32 shrink-0 items-center gap-2 sm:w-44">
          <Progress
            value={percent}
            aria-label="Progresso do curso"
            className="h-2 [&_[data-slot=progress-indicator]]:bg-emerald-600"
          />
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-stone-600">
            {percent}%
          </span>
        </div>
      </div>

      {/* ---------- CORPO: PLAYER + CONTEÚDOS ---------- */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* Coluna esquerda: aula */}
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            {currentLesson ? (
              <>
                {currentLesson.kind === 'LIVE' ? (
                  <LivePanel lesson={currentLesson} isOwner={isOwner} />
                ) : (
                  <LessonPlayer lesson={currentLesson} />
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-stone-200 bg-white text-stone-600">
                    Aula {currentIndex + 1} de {lessons.length}
                  </Badge>
                  {currentLesson.kind === 'LIVE' ? (
                    <Badge className="border-transparent bg-rose-100 text-rose-700">
                      <Radio aria-hidden className="h-3 w-3" /> Ao vivo
                    </Badge>
                  ) : currentLesson.videoUrl ? (
                    <Badge variant="outline" className="border-stone-200 bg-white text-stone-600">
                      Vídeo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-stone-200 bg-white text-stone-600">
                      Leitura
                    </Badge>
                  )}
                  {completedIds.includes(currentLesson.id) && (
                    <Badge className="border-transparent bg-emerald-100 text-emerald-800">
                      <Check aria-hidden className="h-3 w-3" /> Concluída
                    </Badge>
                  )}
                </div>

                <h1 className="mt-2.5 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
                  {currentLesson.title}
                </h1>
                {currentLesson.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                    {currentLesson.description}
                  </p>
                ) : null}

                {/* Anexos para download */}
                {currentLesson.attachments.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentLesson.attachments.map((att, i) => (
                      <a
                        key={`${att.url}-${i}`}
                        href={att.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                        aria-label={`Baixar anexo ${att.name}`}
                      >
                        <Paperclip aria-hidden className="h-3.5 w-3.5 text-stone-400" />
                        <span className="max-w-52 truncate">{att.name}</span>
                        <Download aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
                      </a>
                    ))}
                  </div>
                ) : null}

                {/* Abas: conteúdo / perguntas / anotações */}
                <Tabs defaultValue="lesson" className="mt-6">
                  <TabsList className="h-11 w-full justify-start overflow-x-auto rounded-full bg-stone-100 p-1 sm:w-auto">
                    <TabsTrigger value="lesson" className="rounded-full">
                      <FileText aria-hidden className="h-4 w-4" />
                      <span className="hidden sm:inline">Material</span>
                    </TabsTrigger>
                    <TabsTrigger value="qa" className="rounded-full">
                      <MessageCircle aria-hidden className="h-4 w-4" />
                      Perguntas
                      {currentLesson.questionCount > 0 ? ` (${currentLesson.questionCount})` : ''}
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-full">
                      <PencilLine aria-hidden className="h-4 w-4" />
                      <span className="hidden sm:inline">Anotações</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="lesson" className="mt-4">
                    {currentLesson.content ? (
                      <article className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                        <div className="max-w-prose space-y-4">
                          {currentLesson.content.split(/\n{2,}/).map((para, i) => (
                            <p
                              key={i}
                              className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      </article>
                    ) : currentLesson.kind === 'LIVE' ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-600 sm:p-6">
                        Esta é uma aula ao vivo — participe no horário agendado e use a aba
                        <strong className="font-semibold"> Perguntas </strong>
                        para enviar suas dúvidas ao mentor. Se perdeu, a gravação aparece no player
                        quando disponível.
                      </div>
                    ) : currentLesson.videoUrl ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-600 sm:p-6">
                        Assista à aula acima. Dúvidas? Use a aba{' '}
                        <strong className="font-semibold">Perguntas</strong> — {firstName} responde
                        por lá. Anote ideias em <strong className="font-semibold">Anotações</strong>{' '}
                        e baixe os anexos desta aula.
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
                        <FileText aria-hidden className="h-6 w-6 text-stone-300" />
                        <p className="text-sm text-stone-400">
                          O material desta aula será publicado em breve.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="qa" className="mt-4">
                    <LessonQuestions
                      lesson={currentLesson}
                      isOwner={isOwner}
                      mentorName={course.mentor.name}
                      user={user}
                    />
                  </TabsContent>

                  <TabsContent value="notes" className="mt-4">
                    <LessonNotes
                      key={currentLesson.id}
                      lessonId={currentLesson.id}
                      user={user}
                      lessonTitle={currentLesson.title}
                    />
                  </TabsContent>
                </Tabs>

                {/* Navegação */}
                <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-200 pt-5">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full font-semibold"
                    onClick={goPrev}
                    disabled={currentIndex <= 0 || toggling}
                  >
                    <ChevronLeft aria-hidden className="h-4 w-4" /> Anterior
                  </Button>
                  <Button
                    variant={completedIds.includes(currentLesson.id) ? 'outline' : 'default'}
                    onClick={() => void toggleComplete(true)}
                    disabled={toggling}
                    className={cn(
                      'h-11 rounded-full font-semibold',
                      completedIds.includes(currentLesson.id) &&
                        'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                    )}
                  >
                    {toggling ? (
                      'Salvando…'
                    ) : completedIds.includes(currentLesson.id) ? (
                      <>
                        <CheckCircle2 aria-hidden className="h-4 w-4" /> Concluída
                      </>
                    ) : (
                      <>
                        <CheckCircle2 aria-hidden className="h-4 w-4" /> Concluir e avançar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-full font-semibold"
                    onClick={goNext}
                    disabled={currentIndex >= lessons.length - 1 || toggling}
                  >
                    Próxima <ChevronRight aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
                <Library aria-hidden className="h-8 w-8 text-stone-300" />
                <p className="text-sm text-stone-400">
                  Nenhuma aula publicada ainda — volte mais tarde.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: lista de conteúdos */}
        <aside
          aria-label="Conteúdos do curso"
          className="flex min-h-0 flex-col border-t border-stone-200 bg-white lg:border-l lg:border-t-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Conteúdos do curso
            </p>
            <span className="text-xs font-semibold text-emerald-700">
              {completedIds.length}/{lessons.length}
            </span>
          </div>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-track]:bg-stone-100 [&::-webkit-scrollbar]:w-1.5">
            {lessons.map((lesson, i) => {
              const isCurrent = currentLesson?.id === lesson.id
              const isCompleted = completedIds.includes(lesson.id)
              const live = lesson.kind === 'LIVE'
              return (
                <button
                  key={lesson.id}
                  onClick={() => selectLesson(lesson.id)}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                    isCurrent
                      ? 'border-emerald-300 bg-emerald-50/80 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]'
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
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-sm font-semibold',
                        isCompleted
                          ? 'text-stone-400 line-through decoration-stone-300'
                          : isCurrent
                            ? 'text-emerald-900'
                            : 'text-stone-700'
                      )}
                    >
                      {lesson.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400">
                      {live ? (
                        <>
                          <Radio aria-hidden className="h-3 w-3 text-rose-500" />
                          {lesson.startsAt
                            ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
                            : 'Ao vivo'}
                        </>
                      ) : lesson.videoUrl ? (
                        <>
                          <PlayCircle aria-hidden className="h-3 w-3" /> Vídeo ·{' '}
                          {lesson.durationMin} min
                        </>
                      ) : (
                        <>
                          <FileText aria-hidden className="h-3 w-3" /> Leitura ·{' '}
                          {lesson.durationMin} min
                        </>
                      )}
                      {lesson.hasAttachments ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Paperclip aria-hidden className="h-3 w-3" />
                          {lesson.attachments.length}
                        </span>
                      ) : null}
                      {lesson.questionCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageCircle aria-hidden className="h-3 w-3" />
                          {lesson.questionCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {isCompleted ? (
                    <CheckCircle2
                      aria-label="Aula concluída"
                      className="h-5 w-5 shrink-0 fill-emerald-600 text-white"
                    />
                  ) : isCurrent ? (
                    <PlayCircle aria-hidden className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : live ? (
                    <Radio aria-hidden className="h-4 w-4 shrink-0 text-rose-400" />
                  ) : null}
                </button>
              )
            })}
            {lessons.length === 0 && (
              <p className="px-2 py-4 text-sm text-stone-400">Nenhuma aula publicada ainda.</p>
            )}
          </nav>

          {/* Mentor no rodapé da lista */}
          <div className="shrink-0 border-t border-stone-100 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
              <Avatar name={course.mentor.name} src={course.mentor.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-stone-800">{course.mentor.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Stars rating={course.mentor.rating} size={12} />
                  <span className="text-[11px] font-semibold text-stone-500">
                    {course.mentor.rating > 0 ? course.mentor.rating.toFixed(1) : 'Novo'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                onClick={() => navigate({ name: 'mentor', mentorId: course.mentor.id })}
                aria-label={`Ver perfil de ${course.mentor.name}`}
              >
                Perfil
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ==================== PLAYER (vídeo / leitura) ==================== */

function LessonPlayer({ lesson }: { lesson: CourseLessonDTO }) {
  const embedUrl = lesson.videoUrl ? toVideoEmbedUrl(lesson.videoUrl) : null
  if (!embedUrl) return null
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-lg shadow-stone-900/10">
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          title={`Vídeo da aula: ${lesson.title}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  )
}

/* ==================== PAINEL DE AULA AO VIVO ==================== */

function LivePanel({ lesson, isOwner }: { lesson: CourseLessonDTO; isOwner: boolean }) {
  const [copied, setCopied] = useState(false)
  const status = lesson.startsAt ? liveStatus(lesson.startsAt, lesson.durationMin) : 'upcoming'
  const embedUrl = lesson.videoUrl ? toVideoEmbedUrl(lesson.videoUrl) : null

  const copyLink = async () => {
    if (!lesson.meetingUrl) return
    try {
      await navigator.clipboard.writeText(lesson.meetingUrl)
      setCopied(true)
      toast.success('Link da transmissão copiado!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  const dayLabel = lesson.startsAt
    ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
    : 'agendada'

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-lg shadow-stone-900/10">
      {status === 'ended' && embedUrl ? (
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={`Gravação da aula: ${lesson.title}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="relative flex aspect-video flex-col items-center justify-center gap-4 px-6 text-center" style={avatarGradient(lesson.title)}>
          <div aria-hidden className="absolute inset-0 bg-stone-950/55" />
          <div className="relative flex flex-col items-center gap-4">
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider',
                status === 'live'
                  ? 'animate-pulse bg-rose-500 text-white'
                  : status === 'ended'
                    ? 'bg-stone-600/80 text-stone-100'
                    : 'bg-amber-400/95 text-amber-950'
              )}
            >
              <Radio aria-hidden className="h-3.5 w-3.5" />
              {status === 'live' ? 'Ao vivo agora' : status === 'ended' ? 'Encerrada' : 'Agendada'}
            </span>
            <p className="text-lg font-extrabold tracking-tight text-white sm:text-2xl">
              {lesson.title}
            </p>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/85">
              <CalendarClock aria-hidden className="h-4 w-4" />
              {dayLabel} · {lesson.durationMin} min
            </p>
            {status === 'live' && lesson.meetingUrl ? (
              <Button asChild className="h-12 rounded-full bg-white px-6 font-extrabold text-stone-900 hover:bg-stone-100">
                <a href={lesson.meetingUrl} target="_blank" rel="noopener noreferrer">
                  Entrar na transmissão
                </a>
              </Button>
            ) : status === 'live' && !lesson.meetingUrl ? (
              <p className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white">
                O link da transmissão será liberado em instantes.
              </p>
            ) : status === 'ended' ? (
              <p className="text-xs font-medium text-white/75">
                Gravação não disponível — aguarde o mentor publicar.
              </p>
            ) : (
              <p className="text-xs font-medium text-white/75">
                A sala abre no horário da live. Ative as notificações acompanhando o curso.
              </p>
            )}
            {isOwner && lesson.meetingUrl ? (
              <button
                type="button"
                onClick={() => void copyLink()}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/15 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/25"
                aria-label="Copiar link da transmissão"
              >
                {copied ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar link (mentor)'}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

/* ==================== Q&A DA AULA ==================== */

function LessonQuestions({
  lesson,
  isOwner,
  mentorName,
  user,
}: {
  lesson: CourseLessonDTO
  isOwner: boolean
  mentorName: string
  user: { id: string; name: string } | null
}) {
  const [questions, setQuestions] = useState<LessonQuestionDTO[] | null>(null)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({})
  const [answeringId, setAnsweringId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setQuestions([])
      return
    }
    try {
      const list = await api.listLessonQuestions(lesson.id, user.id)
      setQuestions(list)
    } catch {
      setQuestions([])
    }
  }, [lesson.id, user])

  useEffect(() => {
    setQuestions(null)
    void load()
  }, [load])

  const ask = async () => {
    if (!user) {
      toast.error('Entre com uma conta para perguntar.')
      return
    }
    if (body.trim().length < 5) {
      toast.error('Escreva sua pergunta (mín. 5 caracteres).')
      return
    }
    setSending(true)
    try {
      const created = await api.askLessonQuestion(lesson.id, { userId: user.id, body: body.trim() })
      setQuestions((prev) => [created, ...(prev ?? [])])
      setBody('')
      toast.success('Pergunta enviada! O mentor será notificado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar a pergunta.')
    } finally {
      setSending(false)
    }
  }

  const answer = async (questionId: string) => {
    const text = (answerDraft[questionId] ?? '').trim()
    if (!user || text.length < 2) {
      toast.error('Escreva a resposta antes de enviar.')
      return
    }
    setAnsweringId(questionId)
    try {
      const res = await api.answerQuestion(questionId, { userId: user.id, answer: text })
      setQuestions((prev) =>
        (prev ?? []).map((q) =>
          q.id === questionId ? { ...q, answer: res.answer, answeredAt: res.answeredAt } : q
        )
      )
      setAnswerDraft((prev) => ({ ...prev, [questionId]: '' }))
      toast.success('Resposta publicada!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível responder.')
    } finally {
      setAnsweringId(null)
    }
  }

  const remove = async (questionId: string) => {
    if (!user) return
    try {
      await api.deleteQuestion(questionId, user.id)
      setQuestions((prev) => (prev ?? []).filter((q) => q.id !== questionId))
      toast('Pergunta removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover.')
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
        Entre com uma conta no topo da página para participar das perguntas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Formulário de pergunta (aluno) */}
      {!isOwner ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <label htmlFor="question-body" className="text-sm font-bold text-stone-800">
            Tirou uma dúvida? Pergunte ao mentor
          </label>
          <Textarea
            id="question-body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Ex.: "${mentorName.split(' ')[0]}", no minuto 4:30 você menciona X — como aplico isso na prática?`}
            className="mt-2 resize-none"
            maxLength={1200}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-stone-400">{body.length}/1200</span>
            <Button
              className="h-10 rounded-full font-semibold"
              onClick={() => void ask()}
              disabled={sending || body.trim().length < 5}
            >
              <Send aria-hidden className="h-4 w-4" />
              {sending ? 'Enviando…' : 'Enviar pergunta'}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Lista */}
      {questions === null ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
          <MessageCircle aria-hidden className="h-6 w-6 text-stone-300" />
          <p className="text-sm text-stone-400">
            Nenhuma pergunta ainda — {isOwner ? 'seus alunos aparecerão aqui.' : 'seja o primeiro a perguntar!'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar name={q.author.name} src={q.author.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone-800">
                    {q.author.name}
                    {q.isMine ? <span className="ml-1.5 text-xs font-semibold text-stone-400">(você)</span> : null}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">
                    {q.body}
                  </p>
                </div>
                {q.isMine && !q.answer ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remover minha pergunta"
                    onClick={() => void remove(q.id)}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>

              {q.answer ? (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-emerald-700">
                    <Users aria-hidden className="h-3 w-3" /> Resposta de {mentorName}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-emerald-900">
                    {q.answer}
                  </p>
                </div>
              ) : isOwner ? (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                    Aguardando sua resposta
                  </p>
                  <Textarea
                    rows={2}
                    value={answerDraft[q.id] ?? ''}
                    onChange={(e) => setAnswerDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Escreva a resposta para o aluno..."
                    className="mt-2 resize-none border-white bg-white"
                    maxLength={2000}
                    aria-label={`Responder pergunta de ${q.author.name}`}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="h-9 rounded-full font-semibold"
                      onClick={() => void answer(q.id)}
                      disabled={answeringId === q.id || (answerDraft[q.id] ?? '').trim().length < 2}
                    >
                      {answeringId === q.id ? 'Enviando…' : 'Responder'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  <MessageCircle aria-hidden className="h-3 w-3" /> Aguardando resposta do mentor
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ==================== ANOTAÇÕES DA AULA ==================== */

function LessonNotes({
  lessonId,
  user,
  lessonTitle,
}: {
  lessonId: string
  user: { id: string; name: string } | null
  lessonTitle: string
}) {
  const [body, setBody] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRef = useRef('')

  // Carrega as anotações da aula (o componente é remontado por aula via key)
  useEffect(() => {
    if (!user) return
    let active = true
    api
      .getLessonNote(lessonId, user.id)
      .then((note) => {
        if (!active) return
        setBody(note.body)
        latestRef.current = note.body
        setSavedAt(note.updatedAt)
      })
      .catch(() => {
        /* sem anotações ainda */
      })
      .finally(() => {
        if (active) setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [lessonId, user])

  // Autosave com debounce (o estado "salvando" aparece no envio)
  useEffect(() => {
    if (!loaded || !user) return
    if (body === latestRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSaveState('saving')
      try {
        const res = await api.saveLessonNote(lessonId, { userId: user.id, body })
        latestRef.current = body
        setSavedAt(res.updatedAt)
        setSaveState('saved')
      } catch {
        setSaveState('idle')
        toast.error('Não foi possível salvar as anotações.')
      }
    }, 900)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [body, loaded, user, lessonId])

  const downloadNotes = () => {
    const text = body.trim()
    if (!text) {
      toast.error('Escreva algo antes de baixar suas anotações.')
      return
    }
    const blob = new Blob(
      [`Anotações — ${lessonTitle}\nMentorHub · ${new Date().toLocaleString('pt-BR')}\n\n${text}\n`],
      { type: 'text/plain;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `anotacoes-${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Anotações baixadas!')
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
        Entre com uma conta para escrever e guardar suas anotações.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="lesson-notes" className="text-sm font-bold text-stone-800">
          Minhas anotações desta aula
        </label>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold',
            saveState === 'saving' ? 'text-amber-600' : saveState === 'saved' ? 'text-emerald-600' : 'text-stone-400'
          )}
          aria-live="polite"
        >
          {saveState === 'saving' ? (
            'Salvando…'
          ) : saveState === 'saved' ? (
            <>
              <Check aria-hidden className="h-3.5 w-3.5" /> Salvo
            </>
          ) : user ? (
            'Salva automaticamente'
          ) : (
            'Entre para salvar'
          )}
        </span>
      </div>
      <Textarea
        id="lesson-notes"
        rows={8}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Anote insights, referências e tarefas desta aula… (salvo automaticamente na sua conta)"
        className="mt-2 resize-y"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-stone-400">
          {savedAt ? `Última atualização: ${new Date(savedAt).toLocaleString('pt-BR')}` : 'Nenhuma edição ainda'}
        </span>
        <Button
          variant="outline"
          className="h-10 rounded-full font-semibold"
          onClick={downloadNotes}
          disabled={!body.trim()}
        >
          <FileDown aria-hidden className="h-4 w-4" /> Baixar .txt
        </Button>
      </div>
    </div>
  )
}
