'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileDown,
  FileText,
  Folder,
  GraduationCap,
  Library,
  Lightbulb,
  ListChecks,
  Lock,
  Maximize2,
  MessageCircle,
  Minimize2,
  PanelRight,
  Paperclip,
  PencilLine,
  PlayCircle,
  Radio,
  Send,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { AiTutor } from '@/components/platform/ai-tutor'
import { LessonAiSummary } from '@/components/platform/ai-lesson-summary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  CourseThemeDTO,
  LessonQuestionDTO,
  QuizAttemptResultDTO,
  QuizDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

/* ==================== SALA DE AULA PROFISSIONAL ====================
   Tela cheia (só o header da plataforma): player de um lado, lista de
   conteúdos do outro, com Q&A, anotações e anexos por aula.
   Aulas agrupadas por temas (módulos); READING abre no leitor embutido;
   certificado de conclusão ao completar 100% das aulas. */

interface LessonGroup {
  key: string
  title: string
  theme: CourseThemeDTO | null
  lessons: CourseLessonDTO[]
}

/** Rótulo do material de leitura: "Artigo" ou "Livro" (kind do item da Biblioteca) */
function readingKindLabel(kind: string | null | undefined): string {
  return kind === 'BOOK' ? 'Livro' : 'Artigo'
}

export function ClassroomView({ courseId }: { courseId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const [data, setData] = useState<CourseDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [toggling, setToggling] = useState(false)

  // Auto-retry para falhas transitórias de rede/servidor (ex.: dev server reiniciando)
  const retriesRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCourse = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.getCourse(courseId, user?.id)
      retriesRef.current = 0
      setData(d)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível carregar o curso.'
      const transient =
        /inesperado|fetch|network|load failed|conex/i.test(message) && retriesRef.current < 2
      if (transient) {
        retriesRef.current += 1
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
        retryTimerRef.current = setTimeout(() => void fetchCourse(), 1200)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [courseId, user?.id])

  useEffect(() => {
    void fetchCourse()
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [fetchCourse])

  const course = data
  const isOwner = Boolean(user && course && course.mentor.userId === user.id)
  const isEnrolled = course?.enrollment != null
  const hasAccess = isEnrolled || isOwner

  const lessons = useMemo<CourseLessonDTO[]>(
    () => [...(course?.lessons ?? [])].sort((a, b) => a.order - b.order),
    [course]
  )

  // Temas (módulos) em ordem; aulas sem tema (ou com tema removido) vão para o
  // grupo virtual "Outros conteúdos", sempre no fim da lista.
  const themeList = useMemo<CourseThemeDTO[]>(
    () => [...(course?.themes ?? [])].sort((a, b) => a.order - b.order),
    [course]
  )

  const lessonGroups = useMemo<LessonGroup[]>(() => {
    const byTheme = new Map<string, CourseLessonDTO[]>()
    const loose: CourseLessonDTO[] = []
    for (const lesson of lessons) {
      if (lesson.themeId && themeList.some((t) => t.id === lesson.themeId)) {
        const bucket = byTheme.get(lesson.themeId) ?? []
        bucket.push(lesson)
        byTheme.set(lesson.themeId, bucket)
      } else {
        loose.push(lesson)
      }
    }
    const groups: LessonGroup[] = themeList.map((theme) => ({
      key: theme.id,
      title: theme.title,
      theme,
      lessons: byTheme.get(theme.id) ?? [],
    }))
    if (loose.length > 0) {
      groups.push({ key: 'none', title: 'Outros conteúdos', theme: null, lessons: loose })
    }
    return groups
  }, [lessons, themeList])

  // Lista achatada (temas em ordem → aulas em ordem): base do índice global,
  // do avançar/voltar e do progresso geral.
  const orderedLessons = useMemo(() => lessonGroups.flatMap((g) => g.lessons), [lessonGroups])

  // Seções recolhidas da sidebar (default: todas expandidas)
  const [collapsedThemes, setCollapsedThemes] = useState<Record<string, boolean>>({})
  // Emissão do certificado (botão da celebração de 100%)
  const [issuing, setIssuing] = useState(false)

  // Modo foco (teatro): esconde sidebar e abas, centraliza o palco da aula.
  // Persistido na sessão para o aluno retomar a imersão ao voltar para a sala.
  const [focusMode, setFocusMode] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.sessionStorage.getItem('mentorhub-classroom-focus') === '1'
    } catch {
      return false
    }
  })
  const [contentsOpen, setContentsOpen] = useState(false)

  useEffect(() => {
    try {
      if (focusMode) window.sessionStorage.setItem('mentorhub-classroom-focus', '1')
      else window.sessionStorage.removeItem('mentorhub-classroom-focus')
    } catch {
      /* storage indisponível */
    }
  }, [focusMode])

  // Aba ativa do corpo da aula (Material/Resumo IA/Perguntas/Quiz/Anotações) —
  // controlada para que a barra de abas possa ficar FIXA no topo do corpo,
  // fora da área rolável.
  const [activeTab, setActiveTab] = useState('lesson')
  // Container de rolagem do conteúdo da aula (usado para voltar ao topo)
  const lessonScrollRef = useRef<HTMLDivElement | null>(null)

  // Ao trocar de aula: retorna à aba Material e rola o conteúdo de volta ao topo
  useEffect(() => {
    setActiveTab('lesson')
    lessonScrollRef.current?.scrollTo({ top: 0 })
  }, [currentLessonId])

  // Aula inicial: a indicada na view (retorno do leitor) ou a primeira ainda
  // não concluída (só define uma vez por curso)
  const initializedRef = useRef<string | null>(null)
  useEffect(() => {
    if (!course || !hasAccess) return
    if (initializedRef.current === course.id) return
    initializedRef.current = course.id
    const enrollment = course.enrollment
    const completed = enrollment?.completedLessonIds ?? []
    setCompletedIds(completed)
    const view = useAppStore.getState().view
    const returnLessonId = view.name === 'classroom' ? view.lessonId : undefined
    const target =
      (returnLessonId && orderedLessons.some((l) => l.id === returnLessonId) ? returnLessonId : undefined) ??
      orderedLessons.find((l) => !completed.includes(l.id))?.id ??
      orderedLessons[0]?.id ??
      null
    setCurrentLessonId(target)
  }, [course, hasAccess, orderedLessons])

  const currentLesson = useMemo(
    () => orderedLessons.find((l) => l.id === currentLessonId) ?? orderedLessons[0] ?? null,
    [orderedLessons, currentLessonId]
  )
  const currentIndex = currentLesson ? orderedLessons.findIndex((l) => l.id === currentLesson.id) : -1
  const percent =
    orderedLessons.length > 0 ? Math.round((completedIds.length / orderedLessons.length) * 100) : 0
  const courseCompleted =
    orderedLessons.length > 0 && completedIds.length >= orderedLessons.length

  // Aulas em vídeo no modo foco: o palco É o conteúdo — abas ficam ocultas
  const lessonIsVideo = currentLesson?.kind === 'RECORDED' && Boolean(currentLesson.videoUrl)
  const showTabsBar = currentLesson != null && !(focusMode && lessonIsVideo)

  const handleToggleTheme = (key: string) =>
    setCollapsedThemes((prev) => ({ ...prev, [key]: !prev[key] }))

  const selectLesson = (lessonId: string) => {
    setCurrentLessonId(lessonId)
    // Ao selecionar uma aula, garante o tema dela expandido
    const lessonThemeId = orderedLessons.find((l) => l.id === lessonId)?.themeId
    if (lessonThemeId) setCollapsedThemes((prev) => ({ ...prev, [lessonThemeId]: false }))
  }

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
      if (res.xpAwarded > 0) {
        toast.success(`🎉 Aula concluída! +${res.xpAwarded} XP de estudo`)
      }
      if (nowCompleted && res.courseCompleted) {
        toast.success('🏆 Curso concluído! Parabéns 🎉')
      } else if (nowCompleted && res.xpAwarded <= 0) {
        toast.success('Aula marcada como concluída ✅')
      } else if (!nowCompleted) {
        toast('Marcação removida desta aula.')
      }
      if (autoAdvance && nowCompleted && currentIndex < orderedLessons.length - 1) {
        setCurrentLessonId(orderedLessons[currentIndex + 1].id)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar o progresso.')
    } finally {
      setToggling(false)
    }
  }

  const goPrev = () => {
    if (currentLesson && currentIndex > 0) setCurrentLessonId(orderedLessons[currentIndex - 1].id)
  }
  const goNext = () => {
    if (currentLesson && currentIndex < orderedLessons.length - 1) {
      setCurrentLessonId(orderedLessons[currentIndex + 1].id)
    }
  }

  // Emite (ou retorna) o certificado e abre a página pública verificável.
  // O overlay da sala fecha naturalmente: a view global muda para 'certificate'.
  const handleIssueCertificate = async () => {
    if (!user || !course) return
    setIssuing(true)
    try {
      const cert = await api.issueCertificate(course.id, user.id)
      toast.success('Certificado emitido! 🎓')
      navigate({ name: 'certificate', code: cert.code })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível emitir o certificado.')
    } finally {
      setIssuing(false)
    }
  }

  /* ---------- Estados de tela ---------- */

  if (loading) {
    return (
      <div className="flex h-full min-h-0 flex-col" aria-busy="true">
        <div className="flex items-center gap-3 border-b border-amber-400/15 bg-amber-950 px-4 py-3 sm:px-6">
          <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
          <Skeleton className="h-5 w-48 bg-white/10" />
          <Skeleton className="ml-auto h-6 w-28 rounded-full bg-white/10" />
        </div>
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4 p-4 sm:p-6">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="hidden space-y-2 border-l border-stone-200 bg-white p-4 lg:block dark:border-stone-800 dark:bg-stone-900">
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
        <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center dark:border-stone-700">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50">
            <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
          </span>
          <p className="font-bold text-stone-900 dark:text-stone-50">Não foi possível abrir a sala de aula</p>
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

  if (!hasAccess) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-stone-200 p-8 text-center shadow-none dark:border-stone-800">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
            <Lock aria-hidden className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {course.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
  // Código do certificado do usuário neste curso (null = ainda não emitido)
  const certificateCode = course.certificateCode

  return (
    <div className="flex h-full min-h-0 flex-col bg-stone-50 dark:bg-stone-950" aria-label={`Sala de aula: ${course.title}`}>
      {/* ---------- BARRA SUPERIOR IMERSIVA ---------- */}
      <div className="flex shrink-0 items-center gap-1 border-b border-amber-400/15 bg-amber-950 px-3 py-2.5 text-white sm:gap-2.5 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-white hover:bg-white/10 hover:text-white"
          aria-label="Sair da sala de aula"
          onClick={() => navigate({ name: 'course', courseId })}
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-tight text-white sm:text-base">
            {course.title}
          </p>
          <p className="hidden text-xs text-amber-100/70 sm:block">
            {orderedLessons.length} {orderedLessons.length === 1 ? 'aula' : 'aulas'} ·{' '}
            {formatTotalDuration(course.totalDurationMin)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-amber-100 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Ver conteúdos do curso"
          onClick={() => setContentsOpen(true)}
        >
          <PanelRight aria-hidden className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-amber-100 hover:bg-white/10 hover:text-white"
          aria-label={focusMode ? 'Sair do modo foco' : 'Ativar modo foco'}
          title={focusMode ? 'Sair do modo foco' : 'Ativar modo foco'}
          onClick={() => setFocusMode((v) => !v)}
        >
          {focusMode ? (
            <Minimize2 aria-hidden className="h-4 w-4" />
          ) : (
            <Maximize2 aria-hidden className="h-4 w-4" />
          )}
        </Button>
        <div className="hidden items-center gap-2 sm:flex" aria-hidden>
          <Avatar
            name={course.mentor.name}
            src={course.mentor.avatarUrl}
            size="sm"
            className="h-6 w-6 text-[10px]"
          />
          <span className="max-w-36 truncate text-xs font-semibold text-amber-100/70">
            {course.mentor.name}
          </span>
        </div>
        <div className="flex w-32 shrink-0 items-center gap-2 sm:w-44">
          <div
            role="progressbar"
            aria-label="Progresso do curso"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/20"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-amber-100">
            {percent}%
          </span>
        </div>
      </div>

      {/* ---------- CORPO: PLAYER + CONTEÚDOS (sidebar oculta no modo foco) ----------
          Layout de três zonas: a barra de abas fica FIXA no topo do corpo (logo
          abaixo do cabeçalho do curso) e a barra de ação (Anterior · Concluir ·
          Próxima) fica FIXA no rodapé — apenas o conteúdo da aula rola entre as
          duas, sem nunca passar por baixo de nenhuma delas. */}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col lg:grid',
          focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[1fr_380px]'
        )}
      >
        {/* Coluna esquerda: aula — conteúdo interno largo p/ vídeos grandes */}
        <section aria-label="Aula atual" className="flex min-h-0 flex-1 flex-col">
          {currentLesson ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            {/* ---------- ABAS FIXAS NO TOPO DO CORPO (abaixo do cabeçalho) ---------- */}
            {showTabsBar && (
              <div className="flex shrink-0 items-center gap-3 border-b border-stone-200 bg-stone-50 py-2 pl-3 pr-3 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8 dark:border-stone-800 dark:bg-stone-950">
                <TabsList className="h-10 w-full justify-start overflow-x-auto rounded-full bg-stone-100 p-1 [scrollbar-width:none] sm:w-auto dark:bg-stone-800 [&::-webkit-scrollbar]:hidden">
                  <TabsTrigger value="lesson" className="rounded-full">
                    <FileText aria-hidden className="h-4 w-4" />
                    <span className="hidden sm:inline">Material</span>
                  </TabsTrigger>
                  <TabsTrigger value="aisummary" className="rounded-full">
                    <Sparkles aria-hidden className="h-4 w-4" />
                    <span className="hidden sm:inline">Resumo IA</span>
                  </TabsTrigger>
                  <TabsTrigger value="qa" className="rounded-full">
                    <MessageCircle aria-hidden className="h-4 w-4" />
                    Perguntas
                    {currentLesson.questionCount > 0 ? ` (${currentLesson.questionCount})` : ''}
                  </TabsTrigger>
                  {currentLesson.quizCount > 0 ? (
                    <TabsTrigger value="quiz" className="rounded-full">
                      <ListChecks aria-hidden className="h-4 w-4" />
                      Quiz ({currentLesson.quizCount})
                    </TabsTrigger>
                  ) : null}
                  <TabsTrigger value="notes" className="rounded-full">
                    <PencilLine aria-hidden className="h-4 w-4" />
                    <span className="hidden sm:inline">Anotações</span>
                  </TabsTrigger>
                </TabsList>
                <p className="ml-auto hidden shrink-0 text-xs font-semibold tabular-nums text-stone-400 sm:block dark:text-stone-500">
                  Aula {currentIndex + 1} de {orderedLessons.length}
                </p>
              </div>
            )}

            {/* ---------- CONTEÚDO DA AULA (única área que rola) ---------- */}
            <div
              ref={lessonScrollRef}
              className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-4 sm:p-6 lg:p-8"
            >
              <div className={cn('mx-auto w-full', focusMode ? 'max-w-4xl' : 'max-w-5xl')}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentLesson.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                {currentLesson.kind === 'LIVE' ? (
                  <LivePanel lesson={currentLesson} isOwner={isOwner} />
                ) : currentLesson.kind === 'READING' ? (
                  <ReadingMaterial lesson={currentLesson} courseId={courseId} />
                ) : currentLesson.kind === 'RECORDED' && currentLesson.videoUrl ? (
                  <div className="rounded-3xl bg-gradient-to-b from-amber-50/70 to-transparent p-2 sm:p-3 dark:from-amber-950/25 dark:to-transparent">
                    <div className="overflow-hidden rounded-2xl bg-black shadow-2xl shadow-stone-950/25 ring-1 ring-stone-200 dark:ring-stone-800">
                      <LessonPlayer lesson={currentLesson} />
                    </div>
                  </div>
                ) : (
                  <LessonPlayer lesson={currentLesson} />
                )}

                {/* Celebração + certificado: 100% das aulas concluídas */}
                {courseCompleted ? (
                  <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/50">
                    <CheckCircle2 aria-hidden className="h-12 w-12 fill-emerald-600 text-white" />
                    <p className="text-lg font-extrabold tracking-tight text-emerald-900 dark:text-emerald-200">
                      Parabéns! Você concluiu este curso 🎉
                    </p>
                    {certificateCode ? (
                      <Button
                        variant="outline"
                        onClick={() => navigate({ name: 'certificate', code: certificateCode })}
                        className="h-11 rounded-full border-amber-300 bg-white px-6 font-bold text-amber-800 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 dark:border-amber-700 dark:bg-stone-900 dark:text-amber-300 dark:hover:border-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-200"
                        aria-label="Ver meu certificado de conclusão"
                      >
                        <GraduationCap aria-hidden className="h-4 w-4" /> Ver meu certificado
                      </Button>
                    ) : (
                      <Button
                        onClick={() => void handleIssueCertificate()}
                        disabled={issuing}
                        className="h-11 rounded-full bg-amber-700 px-6 font-bold text-white hover:bg-amber-800"
                        aria-label="Emitir certificado de conclusão"
                      >
                        <GraduationCap aria-hidden className="h-4 w-4" />{' '}
                        {issuing ? 'Emitindo…' : 'Emitir certificado'}
                      </Button>
                    )}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                    Aula {currentIndex + 1} de {orderedLessons.length}
                  </Badge>
                  <Badge variant="outline" className="border-stone-200 bg-white text-stone-600 tabular-nums dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                    <Clock aria-hidden className="h-3 w-3" /> {currentLesson.durationMin} min
                  </Badge>
                  {currentLesson.kind === 'LIVE' ? (
                    <Badge className="border-transparent bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                      <Radio aria-hidden className="h-3 w-3" /> Ao vivo
                    </Badge>
                  ) : currentLesson.kind === 'READING' ? (
                    <Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      <BookOpen aria-hidden className="h-3 w-3" /> {readingKindLabel(currentLesson.reading?.kind)}
                    </Badge>
                  ) : currentLesson.videoUrl ? (
                    <Badge variant="outline" className="border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      Vídeo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                      Leitura
                    </Badge>
                  )}
                  {currentLesson.quizCount > 0 ? (
                    <Badge className="border-transparent bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                      <ListChecks aria-hidden className="h-3 w-3" /> Quiz
                    </Badge>
                  ) : null}
                  {completedIds.includes(currentLesson.id) && (
                    <Badge className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      <Check aria-hidden className="h-3 w-3" /> Concluída
                    </Badge>
                  )}
                </div>

                <h1 className="mt-2.5 text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl">
                  {currentLesson.title}
                </h1>
                {currentLesson.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
                        aria-label={`Baixar anexo ${att.name}`}
                      >
                        <Paperclip aria-hidden className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
                        <span className="max-w-52 truncate">{att.name}</span>
                        <Download aria-hidden className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </a>
                    ))}
                  </div>
                ) : null}

                {/* Painéis das abas — o SELETOR ficou fixo no topo do corpo (barra
                    própria acima); aqui ficam apenas os conteúdos de cada aba.
                    Ocultos no modo foco de aulas em vídeo (o palco é o conteúdo). */}
                {showTabsBar && (
                <div className="mt-6">

                  <TabsContent value="lesson" className="mt-4">
                    {currentLesson.kind === 'READING' ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-600 sm:p-6 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                        {currentLesson.reading ? (
                          <>
                            O material desta aula é{' '}
                            {currentLesson.reading.kind === 'BOOK' ? 'um livro' : 'um artigo'} — leia no leitor
                            acima ou use <strong className="font-semibold">Abrir em tela cheia</strong>. Dúvidas?
                            Use a aba <strong className="font-semibold">Perguntas</strong> — {firstName} responde
                            por lá.
                          </>
                        ) : (
                          'O material desta aula será publicado em breve.'
                        )}
                      </div>
                    ) : currentLesson.content ? (
                      <article className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900">
                        <div className="max-w-prose space-y-4">
                          {currentLesson.content.split(/\n{2,}/).map((para, i) => (
                            <p
                              key={i}
                              className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700 dark:text-stone-200"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      </article>
                    ) : currentLesson.kind === 'LIVE' ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-600 sm:p-6 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                        Esta é uma aula ao vivo — participe no horário agendado e use a aba
                        <strong className="font-semibold"> Perguntas </strong>
                        para enviar suas dúvidas ao mentor. Se perdeu, a gravação aparece no player
                        quando disponível.
                      </div>
                    ) : currentLesson.videoUrl ? (
                      <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-600 sm:p-6 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                        Assista à aula acima. Dúvidas? Use a aba{' '}
                        <strong className="font-semibold">Perguntas</strong> — {firstName} responde
                        por lá. Anote ideias em <strong className="font-semibold">Anotações</strong>{' '}
                        e baixe os anexos desta aula.
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900">
                        <FileText aria-hidden className="h-6 w-6 text-stone-300 dark:text-stone-600" />
                        <p className="text-sm text-stone-400 dark:text-stone-500">
                          O material desta aula será publicado em breve.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="aisummary" className="mt-4">
                    <LessonAiSummary
                      key={currentLesson.id}
                      lessonId={currentLesson.id}
                      lessonTitle={currentLesson.title}
                      user={user}
                      onLogin={() => navigate({ name: 'auth', mode: 'login' })}
                    />
                  </TabsContent>

                  <TabsContent value="qa" className="mt-4">
                    <LessonQuestions
                      lesson={currentLesson}
                      isOwner={isOwner}
                      mentorName={course.mentor.name}
                      user={user}
                    />
                  </TabsContent>

                  {currentLesson.quizCount > 0 ? (
                    <TabsContent value="quiz" className="mt-4">
                      <LessonQuiz
                        key={currentLesson.id}
                        lessonId={currentLesson.id}
                        user={user}
                        isOwner={isOwner}
                      />
                    </TabsContent>
                  ) : null}

                  <TabsContent value="notes" className="mt-4">
                    <LessonNotes
                      key={currentLesson.id}
                      lessonId={currentLesson.id}
                      user={user}
                      lessonTitle={currentLesson.title}
                    />
                  </TabsContent>
                </div>
                )}

                </motion.div>
              </AnimatePresence>
              </div>
            </div>

            {/* ---------- BARRA DE AÇÃO FIXA NO RODAPÉ: Anterior · Concluir · Próxima ---------- */}
            <div className="shrink-0 border-t border-stone-200 bg-white pb-[calc(0.625rem+env(safe-area-inset-bottom))] pl-3 pr-3 pt-2.5 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8 dark:border-stone-800 dark:bg-stone-900">
              <div
                className={cn(
                  'mx-auto flex w-full items-center justify-between gap-2',
                  focusMode ? 'max-w-4xl' : 'max-w-5xl'
                )}
              >
                <Button
                  variant="outline"
                  className="h-11 shrink-0 rounded-full font-semibold"
                  onClick={goPrev}
                  disabled={currentIndex <= 0 || toggling}
                  aria-label="Aula anterior"
                >
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                <Button
                  variant={completedIds.includes(currentLesson.id) ? 'outline' : 'default'}
                  onClick={() => void toggleComplete(true)}
                  disabled={toggling}
                  className={cn(
                    'h-11 min-w-0 rounded-full font-semibold',
                    completedIds.includes(currentLesson.id) &&
                      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:text-amber-300'
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
                      <CheckCircle2 aria-hidden className="h-4 w-4" />
                      <span className="hidden sm:inline">Concluir e avançar</span>
                      <span className="sm:hidden">Concluir</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 shrink-0 rounded-full font-semibold"
                  onClick={goNext}
                  disabled={currentIndex >= orderedLessons.length - 1 || toggling}
                  aria-label="Próxima aula"
                >
                  <span className="hidden sm:inline">Próxima</span>
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Tabs>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-900">
                <Library aria-hidden className="h-8 w-8 text-stone-300 dark:text-stone-600" />
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  Nenhuma aula publicada ainda — volte mais tarde.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Coluna direita: lista de conteúdos (desktop; no mobile abre pelo botão
            "Ver conteúdos" do cabeçalho) — oculta no modo foco */}
        {!focusMode && (
        <aside
          aria-label="Conteúdos do curso"
          className="hidden min-h-0 flex-col border-t border-stone-200 bg-white lg:flex lg:border-l lg:border-t-0 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Conteúdos do curso
            </p>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              {completedIds.length}/{orderedLessons.length}
            </span>
          </div>
          <ContentsNav
            groups={lessonGroups}
            themeList={themeList}
            collapsedThemes={collapsedThemes}
            onToggleTheme={handleToggleTheme}
            currentLessonId={currentLesson?.id ?? null}
            completedIds={completedIds}
            onSelectLesson={selectLesson}
          />

          {/* Mentor no rodapé da lista */}
          <div className="shrink-0 border-t border-stone-100 p-3 dark:border-stone-800">
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-950/50">
              <Avatar name={course.mentor.name} src={course.mentor.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-stone-800 dark:text-stone-200">{course.mentor.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Stars rating={course.mentor.rating} size={12} />
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                    {course.mentor.rating > 0 ? course.mentor.rating.toFixed(1) : 'Novo'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/30"
                onClick={() => navigate({ name: 'mentor', mentorId: course.mentor.id })}
                aria-label={`Ver perfil de ${course.mentor.name}`}
              >
                Perfil
              </Button>
            </div>
          </div>
        </aside>
        )}
      </div>

      {/* ---------- MODO FOCO: botão flutuante de saída ---------- */}
      {focusMode && (
        <Button
          type="button"
          onClick={() => setFocusMode(false)}
          aria-label="Sair do modo foco"
          className="fixed bottom-20 right-6 z-50 h-11 rounded-full bg-amber-950 px-5 text-sm font-bold text-white shadow-2xl shadow-amber-950/40 ring-1 ring-amber-400/25 hover:bg-amber-900"
        >
          <Minimize2 aria-hidden className="h-4 w-4" />
          Sair do modo foco
        </Button>
      )}

      {/* ---------- CONTEÚDOS DO CURSO (dialog p/ mobile) ---------- */}
      <Dialog open={contentsOpen} onOpenChange={setContentsOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 gap-1 border-b border-stone-100 py-4 pl-5 pr-12 text-left dark:border-stone-800">
            <DialogTitle className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              Conteúdos do curso
            </DialogTitle>
            <DialogDescription className="text-xs">
              {completedIds.length} de {orderedLessons.length}{' '}
              {orderedLessons.length === 1 ? 'aula concluída' : 'aulas concluídas'}
            </DialogDescription>
          </DialogHeader>
          <ContentsNav
            groups={lessonGroups}
            themeList={themeList}
            collapsedThemes={collapsedThemes}
            onToggleTheme={handleToggleTheme}
            currentLessonId={currentLesson?.id ?? null}
            completedIds={completedIds}
            onSelectLesson={(lessonId) => {
              selectLesson(lessonId)
              setContentsOpen(false)
            }}
            className="py-2"
          />
        </DialogContent>
      </Dialog>

      {/* ---------- TUTOR IA: chat flutuante com base no conteúdo do curso ---------- */}
      {course && hasAccess && (
        <AiTutor
          courseId={course.id}
          courseTitle={course.title}
          mentorName={course.mentor.name}
          currentLessonId={currentLesson?.id ?? null}
          currentLessonTitle={currentLesson?.title ?? null}
          user={user}
          onLogin={() => navigate({ name: 'auth', mode: 'login' })}
          raised={focusMode}
        />
      )}
    </div>
  )
}

/* ==================== NAVEGAÇÃO DE CONTEÚDOS (sidebar + dialog mobile) ==================== */

function ContentsNav({
  groups,
  themeList,
  collapsedThemes,
  onToggleTheme,
  currentLessonId,
  completedIds,
  onSelectLesson,
  className,
}: {
  groups: LessonGroup[]
  themeList: CourseThemeDTO[]
  collapsedThemes: Record<string, boolean>
  onToggleTheme: (key: string) => void
  currentLessonId: string | null
  completedIds: string[]
  onSelectLesson: (lessonId: string) => void
  className?: string
}) {
  const totalLessons = groups.reduce((n, g) => n + g.lessons.length, 0)

  return (
    <nav
      aria-label="Conteúdos do curso"
      className={cn(
        'min-h-0 flex-1 overflow-y-auto px-3 pb-3 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-stone-900 [&::-webkit-scrollbar]:w-1.5',
        className
      )}
    >
      {groups.map((group) => {
        const collapsible = themeList.length > 0
        const isCollapsed = collapsible && Boolean(collapsedThemes[group.key])
        const groupTotal = group.lessons.length
        const groupDone = group.lessons.filter((l) => completedIds.includes(l.id)).length
        return (
          <div key={group.key} className="space-y-1 py-1">
            {collapsible ? (
              <button
                type="button"
                onClick={() => onToggleTheme(group.key)}
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? 'Expandir' : 'Recolher'} a seção ${group.title}`}
                className="flex min-h-11 w-full items-center gap-1.5 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                {isCollapsed ? (
                  <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                ) : (
                  <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-stone-400 dark:text-stone-500" />
                )}
                {group.theme ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    {themeList.findIndex((t) => t.id === group.key) + 1}
                  </span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                    <Folder aria-hidden className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" />
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-700 dark:text-stone-200">
                  {group.title}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-stone-400 dark:text-stone-500">
                  {groupTotal} {groupTotal === 1 ? 'aula' : 'aulas'}
                </span>
                <Progress
                  value={groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0}
                  aria-label={`Progresso da seção ${group.title}`}
                  className="h-1.5 w-10 shrink-0 [&_[data-slot=progress-indicator]]:bg-amber-500"
                />
                <span className="w-9 shrink-0 text-right text-[10px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {groupDone}/{groupTotal}
                </span>
              </button>
            ) : null}
            {!isCollapsed &&
              group.lessons.map((lesson) => {
                const isCurrent = currentLessonId === lesson.id
                const isCompleted = completedIds.includes(lesson.id)
                const live = lesson.kind === 'LIVE'
                const reading = lesson.kind === 'READING'
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson.id)}
                    aria-current={isCurrent ? 'true' : undefined}
                    className={cn(
                      'flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                      isCurrent
                        ? 'border-amber-300 bg-amber-50/80 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)] dark:border-amber-700 dark:bg-amber-950/50'
                        : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800/70'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'w-[3px] shrink-0 self-stretch rounded-full transition-colors',
                        isCurrent ? 'bg-amber-600' : 'bg-transparent'
                      )}
                    />
                    <span
                      className={cn(
                        'w-4 shrink-0 text-center text-xs font-bold',
                        isCurrent ? 'text-amber-700 dark:text-amber-300' : 'text-stone-400 dark:text-stone-500'
                      )}
                    >
                      {lesson.order}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-sm font-semibold',
                          isCompleted
                            ? 'text-stone-400 line-through decoration-stone-300 dark:text-stone-500 dark:decoration-stone-600'
                            : isCurrent
                              ? 'text-amber-900 dark:text-amber-200'
                              : 'text-stone-700 dark:text-stone-200'
                        )}
                      >
                        {lesson.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
                        {live ? (
                          <>
                            <Radio aria-hidden className="h-3 w-3 text-rose-500" />
                            {lesson.startsAt
                              ? `${formatDayLabel(lesson.startsAt)} · ${formatTimeLabel(lesson.startsAt)}`
                              : 'Ao vivo'}
                          </>
                        ) : reading ? (
                          <>
                            <BookOpen aria-hidden className="h-3 w-3 text-amber-500" />
                            {readingKindLabel(lesson.reading?.kind)} · {lesson.durationMin} min
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
                        className="h-5 w-5 shrink-0 fill-amber-600 text-white"
                      />
                    ) : isCurrent ? (
                      <PlayCircle aria-hidden className="h-5 w-5 shrink-0 text-amber-600" />
                    ) : live ? (
                      <Radio aria-hidden className="h-4 w-4 shrink-0 text-rose-400" />
                    ) : reading ? (
                      <BookOpen aria-hidden className="h-4 w-4 shrink-0 text-amber-400" />
                    ) : lesson.kind === 'RECORDED' ? (
                      <PlayCircle aria-hidden className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
                    ) : (
                      <FileText aria-hidden className="h-4 w-4 shrink-0 text-stone-300 dark:text-stone-600" />
                    )}
                  </button>
                )
              })}
          </div>
        )
      })}
      {totalLessons === 0 && (
        <p className="px-2 py-4 text-sm text-stone-400 dark:text-stone-500">Nenhuma aula publicada ainda.</p>
      )}
    </nav>
  )
}

/* ==================== PLAYER (vídeo / leitura) ==================== */

function LessonPlayer({ lesson }: { lesson: CourseLessonDTO }) {
  const embedUrl = lesson.videoUrl ? toVideoEmbedUrl(lesson.videoUrl) : null
  if (!embedUrl) return null
  return (
    <div className="overflow-hidden rounded-2xl bg-stone-950 shadow-2xl shadow-stone-950/25 ring-1 ring-stone-200 dark:ring-stone-800">
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

/* ==================== MATERIAL DE LEITURA (Artigo/Livro da Biblioteca) ==================== */

function ReadingMaterial({
  lesson,
  courseId,
}: {
  lesson: CourseLessonDTO
  courseId: string
}) {
  const navigate = useAppStore((s) => s.navigate)
  const reading = lesson.reading
  const canRead = Boolean(reading && (reading.pdfUrl || reading.content))

  if (!reading || !canRead) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
          <Lock aria-hidden className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </span>
        <p className="font-bold text-stone-900 dark:text-stone-50">
          {reading ? 'Inscreva-se para acessar este material' : 'Material da aula em preparação'}
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          {reading
            ? 'Este é um conteúdo da Biblioteca — disponível para alunos inscritos no curso.'
            : 'O artigo ou livro vinculado a esta aula ainda não está disponível.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Cabeçalho do material */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Badge className="border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/50">
          <BookOpen aria-hidden className="h-3 w-3" />
          {readingKindLabel(reading.kind)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full text-xs font-semibold"
          onClick={() =>
            navigate({
              name: 'reader',
              itemId: reading.id,
              returnTo: { courseId, lessonId: lesson.id },
            })
          }
          aria-label={`Abrir ${readingKindLabel(reading.kind).toLowerCase()} ${reading.title} em tela cheia`}
        >
          <Maximize2 aria-hidden className="h-3.5 w-3.5" /> Abrir em tela cheia
        </Button>
      </div>

      {reading.pdfUrl ? (
        <div className="aspect-video min-h-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-950/15 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
          <iframe
            src={reading.pdfUrl}
            title={lesson.title}
            className="h-full w-full rounded-xl border bg-white"
          />
        </div>
      ) : (
        <div className="min-h-[420px] max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl shadow-stone-950/15 ring-1 ring-stone-200 sm:p-8 [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-stone-300 dark:[&::-webkit-scrollbar-thumb]:bg-stone-700 [&::-webkit-scrollbar-track]:bg-stone-100 dark:[&::-webkit-scrollbar-track]:bg-stone-900 [&::-webkit-scrollbar]:w-1.5 dark:bg-stone-900 dark:ring-stone-800">
          <article className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">{reading.title}</h2>
            <div className="mt-5 space-y-4">
              {(reading.content ?? '')
                .split(/\n{2,}/)
                .filter((para) => para.trim().length > 0)
                .map((para, i) =>
                  para.trim().startsWith('## ') ? (
                    <h3
                      key={i}
                      className="pt-2 text-lg font-bold tracking-tight text-amber-900 dark:text-amber-200"
                    >
                      {para.trim().slice(3)}
                    </h3>
                  ) : (
                    <p
                      key={i}
                      className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700 dark:text-stone-200"
                    >
                      {para}
                    </p>
                  )
                )}
            </div>
          </article>
        </div>
      )}
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
    <div className="overflow-hidden rounded-2xl bg-stone-950 shadow-2xl shadow-stone-950/25 ring-1 ring-stone-200 dark:ring-stone-800">
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
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        Entre com uma conta no topo da página para participar das perguntas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Formulário de pergunta (aluno) */}
      {!isOwner ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900">
          <label htmlFor="question-body" className="text-sm font-bold text-stone-800 dark:text-stone-200">
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
            <span className="text-xs text-stone-400 dark:text-stone-500">{body.length}/1200</span>
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
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900">
          <MessageCircle aria-hidden className="h-6 w-6 text-stone-300 dark:text-stone-600" />
          <p className="text-sm text-stone-400 dark:text-stone-500">
            Nenhuma pergunta ainda — {isOwner ? 'seus alunos aparecerão aqui.' : 'seja o primeiro a perguntar!'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li key={q.id} className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-start gap-3">
                <Avatar name={q.author.name} src={q.author.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {q.author.name}
                    {q.isMine ? <span className="ml-1.5 text-xs font-semibold text-stone-400 dark:text-stone-500">(você)</span> : null}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700 dark:text-stone-200">
                    {q.body}
                  </p>
                </div>
                {q.isMine && !q.answer ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:text-stone-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                    aria-label="Remover minha pergunta"
                    onClick={() => void remove(q.id)}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>

              {q.answer ? (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 dark:border-amber-900 dark:bg-amber-950/50">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    <Users aria-hidden className="h-3 w-3" /> Resposta de {mentorName}
                  </p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                    {q.answer}
                  </p>
                </div>
              ) : isOwner ? (
                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 dark:border-amber-900 dark:bg-amber-950/50">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Aguardando sua resposta
                  </p>
                  <Textarea
                    rows={2}
                    value={answerDraft[q.id] ?? ''}
                    onChange={(e) => setAnswerDraft((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Escreva a resposta para o aluno..."
                    className="mt-2 resize-none border-white bg-white dark:border-stone-800 dark:bg-stone-900"
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
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
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

  // Autosave com debounce (o estado "salvando" aparece no envio).
  // No unmount/troca de aula: FLUSH do texto pendente antes de limpar o timer —
  // sair da sala ≤900ms depois de digitar não perde mais a anotação.
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
    const pending = body
    const staleLesson = lessonId
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      // fire-and-forget: salva o rascunho pendente (só se realmente divergiu)
      if (pending !== latestRef.current && user) {
        api
          .saveLessonNote(staleLesson, { userId: user.id, body: pending })
          .then(() => {
            latestRef.current = pending
          })
          .catch(() => {
            /* silencioso: melhor esforço no flush */
          })
      }
    }
  }, [body, loaded, user, lessonId])

  const downloadNotes = () => {
    const text = body.trim()
    if (!text) {
      toast.error('Escreva algo antes de baixar suas anotações.')
      return
    }
    const blob = new Blob(
      [`Anotações — ${lessonTitle}\nÓrbita · ${new Date().toLocaleString('pt-BR')}\n\n${text}\n`],
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
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        Entre com uma conta para escrever e guardar suas anotações.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="lesson-notes" className="text-sm font-bold text-stone-800 dark:text-stone-200">
          Anotações da aula
        </label>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold',
            saveState === 'saving' || saveState === 'saved'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-stone-400 dark:text-stone-500'
          )}
          aria-live="polite"
        >
          {saveState === 'saving' ? (
            <>
              <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Salvando…
            </>
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
        <span className="text-xs text-stone-400 dark:text-stone-500">
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

/* ==================== QUIZ DA AULA ==================== */

const QUIZ_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

/** Resposta enviada nesta sessão (por quiz) — permanece até acertar ou recomeçar */
interface QuizFreshResult {
  correct: boolean
  correctIndex: number
  explanation: string
  xpAwarded: number
}

function LessonQuiz({
  lessonId,
  user,
  isOwner,
  onQuizAnswered,
}: {
  lessonId: string
  user: { id: string; name: string } | null
  isOwner: boolean
  onQuizAnswered?: (result: QuizAttemptResultDTO, quizId: string) => void
}) {
  const [quizzes, setQuizzes] = useState<QuizDTO[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [results, setResults] = useState<Record<string, QuizFreshResult>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) {
      setQuizzes([])
      setError(null)
      return
    }
    setError(null)
    try {
      const list = await api.listLessonQuizzes(lessonId, user.id)
      setQuizzes(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o quiz desta aula.')
    }
  }, [lessonId, user])

  // Recarrega por aula (o componente é remontado por aula via key)
  useEffect(() => {
    setQuizzes(null)
    setSelected({})
    setResults({})
    void load()
  }, [load])

  const answer = async (quiz: QuizDTO) => {
    if (!user) return
    const selectedIndex = selected[quiz.id]
    if (selectedIndex === undefined) return
    setSendingId(quiz.id)
    try {
      const res = await api.answerQuiz(quiz.id, { userId: user.id, selectedIndex })
      setResults((prev) => ({
        ...prev,
        [quiz.id]: {
          correct: res.correct,
          correctIndex: res.correctIndex,
          explanation: res.explanation ?? '',
          xpAwarded: res.xpAwarded,
        },
      }))
      if (res.correct) {
        toast.success(`Você acertou! +${res.xpAwarded} XP ⚡`)
      } else {
        toast.error('Resposta incorreta — veja a explicação.')
      }
      onQuizAnswered?.(res, quiz.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível enviar sua resposta.')
    } finally {
      setSendingId(null)
    }
  }

  // Limpa o feedback para permitir nova tentativa (a seleção continua editável)
  const retry = (quizId: string) => {
    setResults((prev) => {
      const next = { ...prev }
      delete next[quizId]
      return next
    })
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        Entre com uma conta para responder o quiz desta aula.
      </div>
    )
  }

  if (quizzes === null) {
    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900">
          <AlertCircle aria-hidden className="h-6 w-6 text-rose-400" />
          <p className="text-sm text-stone-500 dark:text-stone-400">{error}</p>
          <Button variant="outline" className="rounded-full" onClick={() => void load()}>
            Tentar novamente
          </Button>
        </div>
      )
    }
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return isOwner ? (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900">
        <ListChecks aria-hidden className="h-6 w-6 text-stone-300 dark:text-stone-600" />
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">Nenhuma pergunta de quiz nesta aula.</p>
        <p className="max-w-xs text-xs leading-relaxed text-stone-400 dark:text-stone-500">
          Crie perguntas no painel do curso para seus alunos praticarem aqui.
        </p>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900">
        <ListChecks aria-hidden className="h-6 w-6 text-stone-300 dark:text-stone-600" />
        <p className="text-sm text-stone-400 dark:text-stone-500">O mentor ainda não publicou perguntas para esta aula.</p>
      </div>
    )
  }

  const answeredCount = quizzes.filter((q) => q.myAttempt !== null || results[q.id] !== undefined).length
  const correctCount = quizzes.filter(
    (q) => q.myAttempt?.correct === true || results[q.id]?.correct === true
  ).length
  const mentorOnly = quizzes.every((q) => q.isMine)

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {quizzes.map((quiz, qIndex) => {
          const fresh = results[quiz.id]
          const persisted = quiz.myAttempt
          // Travado = mentor (vê gabarito), já respondido antes ou acertou agora
          const locked = quiz.isMine || persisted !== null || fresh?.correct === true
          // Escolha exibida como "sua resposta"
          const chosenIndex = fresh && !fresh.correct ? selected[quiz.id] : persisted?.selectedIndex ?? selected[quiz.id]
          // Resposta errada visível (não bloqueia a revelação da correta)
          const showWrong = (fresh !== undefined && !fresh.correct) || (persisted !== null && !persisted.correct)
          // Índice da alternativa correta quando conhecido
          const correctIdx = fresh
            ? fresh.correctIndex
            : persisted?.correct
              ? persisted.selectedIndex
              : quiz.isMine
                ? quiz.correctIndex
                : null
          const explanation = fresh?.explanation || quiz.explanation || ''

          return (
            <li key={quiz.id} className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                    Pergunta {qIndex + 1}
                  </p>
                  <p className="mt-0.5 font-semibold text-stone-900 dark:text-stone-50">{quiz.prompt}</p>
                </div>
                {persisted !== null ? (
                  persisted.correct ? (
                    <Badge className="shrink-0 border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      <CheckCircle2 aria-hidden className="h-3 w-3" /> Você acertou
                    </Badge>
                  ) : (
                    <Badge className="shrink-0 border-transparent bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                      <Lightbulb aria-hidden className="h-3 w-3" /> Respondeu — revise a explicação
                    </Badge>
                  )
                ) : quiz.isMine ? (
                  <Badge className="shrink-0 border-transparent bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                    <ListChecks aria-hidden className="h-3 w-3" /> Gabarito
                  </Badge>
                ) : null}
              </div>

              <div role="radiogroup" aria-label={quiz.prompt} className="mt-3 space-y-2">
                {quiz.options.map((opt, idx) => {
                  const isCorrectReveal = correctIdx !== null && idx === correctIdx
                  const isWrongReveal = !isCorrectReveal && showWrong && idx === chosenIndex
                  const isSelected = !locked && idx === selected[quiz.id]
                  return (
                    <Button
                      key={`${quiz.id}-${idx}`}
                      type="button"
                      variant="outline"
                      role="radio"
                      aria-checked={isSelected || isCorrectReveal || isWrongReveal}
                      aria-disabled={locked || undefined}
                      tabIndex={locked ? -1 : undefined}
                      onClick={() => {
                        if (locked || sendingId === quiz.id) return
                        setSelected((prev) => ({ ...prev, [quiz.id]: idx }))
                      }}
                      className={cn(
                        'h-auto min-h-11 w-full justify-start gap-3 whitespace-normal rounded-xl px-3 py-2.5 text-left',
                        locked && 'pointer-events-none',
                        isCorrectReveal
                          ? 'border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-50 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950/50'
                          : isWrongReveal
                            ? 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-50 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200 dark:hover:bg-rose-950/50'
                            : isSelected
                              ? 'border-amber-600 bg-amber-50/60 text-stone-900 dark:bg-amber-950/50 dark:text-stone-50'
                              : locked
                                ? 'border-stone-200 bg-stone-50/40 text-stone-500 dark:border-stone-800 dark:bg-stone-950/40 dark:text-stone-400'
                                : 'text-stone-700 hover:border-amber-300 hover:bg-amber-50/40 dark:text-stone-200 dark:hover:border-amber-700 dark:hover:bg-amber-900/40'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          isCorrectReveal
                            ? 'bg-amber-600 text-white'
                            : isWrongReveal
                              ? 'bg-rose-400 text-white'
                              : isSelected
                                ? 'bg-amber-700 text-white'
                                : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                        )}
                      >
                        {QUIZ_LETTERS[idx] ?? idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-relaxed">{opt}</span>
                      {isCorrectReveal ? (
                        <Check aria-hidden className="h-4 w-4 shrink-0 text-amber-600" />
                      ) : isWrongReveal ? (
                        <XCircle aria-hidden className="h-4 w-4 shrink-0 text-rose-400" />
                      ) : null}
                    </Button>
                  )
                })}
              </div>

              {/* Botão de resposta (só para alunos, antes de acertar) */}
              {!locked ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    className="h-10 rounded-full bg-amber-700 font-bold text-white hover:bg-amber-800"
                    onClick={() => void answer(quiz)}
                    disabled={selected[quiz.id] === undefined || sendingId === quiz.id}
                  >
                    {sendingId === quiz.id ? 'Verificando…' : 'Responder'}
                  </Button>
                </div>
              ) : null}

              {/* Feedback da resposta enviada nesta sessão */}
              {fresh ? (
                fresh.correct ? (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/50">
                    <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <p className="min-w-0 flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                      Isso!{fresh.xpAwarded > 0 ? ` +${fresh.xpAwarded} XP` : ''}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 dark:border-rose-900 dark:bg-rose-950/50">
                    <div className="flex items-start gap-2.5">
                      <XCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      <p className="min-w-0 flex-1 text-sm leading-relaxed text-rose-800 dark:text-rose-300">
                        Não foi dessa vez — a correta é:{' '}
                        <span className="font-bold">{quiz.options[fresh.correctIndex] ?? '—'}</span>
                      </p>
                    </div>
                    <div className="mt-2.5 flex justify-end">
                      <Button
                        variant="outline"
                        className="h-9 rounded-full border-rose-200 bg-white font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900 dark:bg-stone-900 dark:text-rose-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
                        onClick={() => retry(quiz.id)}
                      >
                        Tentar de novo
                      </Button>
                    </div>
                  </div>
                )
              ) : null}

              {/* Explicação do mentor */}
              {explanation ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 p-3 dark:bg-stone-950/50">
                  <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{explanation}</p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-stone-400 dark:text-stone-500">
        {mentorOnly
          ? `${quizzes.length} ${quizzes.length === 1 ? 'pergunta' : 'perguntas'} · gabarito visível apenas para você`
          : `${answeredCount} de ${quizzes.length} respondidas · ${correctCount} acertos`}
      </p>
    </div>
  )
}
