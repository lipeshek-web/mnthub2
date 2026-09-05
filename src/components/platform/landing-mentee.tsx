'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  HeartHandshake,
  Library,
  MessagesSquare,
  MonitorPlay,
  Presentation,
  Route,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
import { Reveal } from '@/components/platform/reveal'
import { useInViewOnce, usePrefersReducedMotion } from '@/hooks/use-in-view-once'
import { useMounted } from '@/hooks/use-mounted'
import { api } from '@/lib/api'
import {
  CATEGORIES,
  LEVEL_LABELS,
  avatarGradient,
  currencyBRL,
  firstName,
  formatTotalDuration,
  initials,
} from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type {
  CourseListItemDTO,
  EnrolledCourseDTO,
  LibraryItemDTO,
  MentorListItemDTO,
  RecommendationDTO,
  TrackListItemDTO,
  WeeklyGoalDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    number: '01',
    title: 'Descubra',
    text: 'Explore mentores, cursos, trilhas e a biblioteca no Explorar — com uma única busca.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Comece',
    text: 'Matricule-se num curso na hora ou agende uma mentoria num horário livre do mentor.',
    icon: CalendarClock,
  },
  {
    number: '03',
    title: 'Evolua',
    text: 'Aprenda por vídeo ou na sala de aula, acompanhe seu progresso e receba o certificado.',
    icon: Video,
  },
]

/** Os 4 formatos de aprendizado — a plataforma inteira em uma olhada */
const FORMATS = [
  {
    icon: Video,
    eyebrow: 'Ao vivo',
    title: 'Mentorias 1:1',
    text: 'Agende com um especialista e encontre-se por vídeo dentro da própria plataforma.',
    cta: 'Explorar mentores',
    tab: 'mentors' as const,
  },
  {
    icon: MonitorPlay,
    eyebrow: 'No seu ritmo',
    title: 'Cursos gravados',
    text: 'Aulas em vídeo, leituras, quizzes e resumos — com certificado no final.',
    cta: 'Ver cursos',
    tab: 'courses' as const,
  },
  {
    icon: Route,
    eyebrow: 'Jornadas',
    title: 'Trilhas guiadas',
    text: 'Cursos e mentorias combinados em sequência, com progresso automático.',
    cta: 'Ver trilhas',
    tab: 'tracks' as const,
  },
  {
    icon: Library,
    eyebrow: 'Para ler',
    title: 'Biblioteca',
    text: 'Artigos e livros dos mentores com leitor integrado, PDF e favoritos.',
    cta: 'Abrir biblioteca',
    tab: 'library' as const,
  },
]

/** Superpoderes que atravessam todos os formatos */
const EXTRAS = [
  {
    icon: Sparkles,
    title: 'Tutor IA e resumos',
    text: 'Tire dúvidas durante a aula e receba o resumo do que assistiu.',
  },
  {
    icon: Trophy,
    title: 'XP e ofensiva',
    text: 'Gamificação com metas semanais para manter o ritmo de estudos.',
  },
  {
    icon: BadgeCheck,
    title: 'Certificados',
    text: 'Código de verificação único em cada curso concluído.',
  },
  {
    icon: CalendarCheck,
    title: 'Agenda em tempo real',
    text: 'Horários livres do mentor visíveis e confirmação em minutos.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagamento seguro',
    text: 'PIX ou cartão, com recibo, histórico e garantia de 7 dias.',
  },
  {
    icon: MessagesSquare,
    title: 'Mensagens diretas',
    text: 'Converse com mentores e mentorados sem sair da plataforma.',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'Vinha tentando migrar para gestão de produtos há quase um ano, sem direção nenhuma. Em duas sessões, montamos um plano de 90 dias: o que estudar, o que construir e como me posicionar. Três meses depois, eu assinava meu contrato como PO.',
    author: 'Lucas Prado · dev em transição',
  },
  {
    quote:
      'Eu travava em toda reunião em inglês. Na primeira sessão, a Sofia identificou exatamente o que me bloqueava e montou um plano de prática focada. Hoje conduzo dailies com o time de Portugal sem medo.',
    author: 'Camila R. · analista de marketing',
  },
  {
    quote:
      'Seis anos no mesmo cargo e nenhuma ideia de como sair. A mentoria de carreira com a Marina me deu clareza: reposicionei meu currículo e LinkedIn, ensaiei entrevistas e recebi duas propostas no mês seguinte.',
    author: 'Diego M. · analista financeiro',
  },
]



const FAQS = [
  {
    q: 'O que eu encontro na Órbita?',
    a: 'Mentorias 1:1 por vídeo, cursos gravados, trilhas guiadas e uma biblioteca com artigos e livros dos mentores. Tudo em uma conta só, com IA de estudos, gamificação e certificados.',
  },
  {
    q: 'Preciso instalar algo para a reunião por vídeo?',
    a: 'Não. A sala de reunião abre direto no navegador, com áudio e vídeo integrados. Basta entrar na tela da sua sessão na hora marcada.',
  },
  {
    q: 'Como funcionam os cursos e as trilhas?',
    a: 'Você avança aula a aula, com quizzes e materiais no caminho. Nas trilhas, cursos e mentorias se combinam em sequência — e o progresso aparece no seu painel automaticamente.',
  },
  {
    q: 'Como funcionam os pagamentos?',
    a: 'Você paga apenas pelo que contratar: sessões avulsas, cursos, trilhas ou pacotes. PIX e cartão, com recibo automático e garantia de 7 dias.',
  },
  {
    q: 'Recebo certificado?',
    a: 'Sim — cada curso concluído gera um certificado com código de verificação único, pronto para compartilhar no LinkedIn ou anexar ao currículo.',
  },
  {
    q: 'Como me tornar um mentor na Órbita?',
    a: 'Clique em "Quero ensinar" no fim desta página, complete seu perfil com áreas, agenda e valores e publique mentorias, cursos, trilhas e conteúdos no mural.',
  },
]

const FINAL_REASSURANCES = [
  'Pagamento seguro via PIX ou cartão',
  'Vídeo, cursos e biblioteca na mesma plataforma',
  'Certificado com verificação incluído',
]

export function LandingMenteeView() {
  const navigate = useAppStore((s) => s.navigate)
  const setExploreTab = useAppStore((s) => s.setExploreTab)
  // Hidratação segura: no SSR e no primeiro render do cliente o usuário é
  // tratado como convidado (igual ao HTML do servidor); depois reflete o real.
  const mounted = useMounted()
  const storeUser = useAppStore((s) => s.user)
  const user = mounted ? storeUser : null
  const [mentors, setMentors] = useState<MentorListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [tracks, setTracks] = useState<TrackListItemDTO[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)

  // Fetch preguiçoso: cursos e trilhas só saem quando as seções se aproximam da viewport
  const { ref: coursesSectionRef, inView: coursesInView } = useInViewOnce<HTMLElement>('600px')
  const { ref: tracksSectionRef, inView: tracksInView } = useInViewOnce<HTMLElement>('600px')

  useEffect(() => {
    let active = true
    api
      .listMentors({})
      .then((data) => {
        if (active) setMentors(data)
      })
      .catch(() => {
        if (active) setMentors([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Cursos para a seção "Cursos em destaque" (disparado quando a seção ou a faixa de números se aproxima)
  const { ref: statsSectionRef, inView: statsInView } = useInViewOnce<HTMLElement>('600px')

  useEffect(() => {
    if (!coursesInView && !statsInView) return
    let active = true
    api
      .listCourses({})
      .then((data) => {
        if (active) setCourses(data)
      })
      .catch(() => {
        if (active) setCourses([])
      })
      .finally(() => {
        if (active) setCoursesLoading(false)
      })
    return () => {
      active = false
    }
  }, [coursesInView, statsInView])

  // Trilhas populares para a seção "Trilhas em destaque" (seção ou faixa de números se aproximando)
  useEffect(() => {
    if (!tracksInView && !statsInView) return
    let active = true
    api
      .listTracks({ sort: 'popular' })
      .then((data) => {
        if (active) setTracks(data)
      })
      .catch(() => {
        if (active) setTracks([])
      })
      .finally(() => {
        if (active) setTracksLoading(false)
      })
    return () => {
      active = false
    }
  }, [tracksInView, statsInView])

  // Biblioteca em destaque (disparado quando a seção se aproxima)
  const { ref: librarySectionRef, inView: libraryInView } = useInViewOnce<HTMLElement>('600px')
  const [libraryItems, setLibraryItems] = useState<LibraryItemDTO[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)

  useEffect(() => {
    if (!libraryInView) return
    let active = true
    api
      .listLibrary({ sort: 'recent' })
      .then((data) => {
        if (active) setLibraryItems(data)
      })
      .catch(() => {
        if (active) setLibraryItems([])
      })
      .finally(() => {
        if (active) setLibraryLoading(false)
      })
    return () => {
      active = false
    }
  }, [libraryInView])

  // "Continue aprendendo": inscrições do usuário logado (seção oculta para convidados)
  const userId = user?.id
  const [enrollments, setEnrollments] = useState<EnrolledCourseDTO[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)

  useEffect(() => {
    // Convidado: a seção fica oculta (user == null) e o estado inicial não precisa mudar.
    if (!userId) return
    let active = true
    api
      .listMyEnrollments(userId)
      .then((data) => {
        if (active) setEnrollments(data)
      })
      .catch(() => {
        if (active) setEnrollments([])
      })
      .finally(() => {
        if (active) setEnrollmentsLoading(false)
      })
    return () => {
      active = false
    }
  }, [userId])

  const totalReviews = useMemo(
    () => mentors.reduce((acc, m) => acc + m.reviewCount, 0),
    [mentors]
  )

  const avgRating = useMemo(() => {
    const rated = mentors.filter((m) => m.rating > 0)
    if (rated.length === 0) return null
    return rated.reduce((acc, m) => acc + m.rating, 0) / rated.length
  }, [mentors])

  // Números da faixa "A plataforma em números" (chegam junto com os fetches preguiçosos)
  const totalLessons = useMemo(
    () => courses.reduce((acc, c) => acc + c.lessonCount, 0),
    [courses]
  )

  // Top 6 itens da biblioteca (a API já devolve ordenada por data — novidades primeiro)
  const topLibrary = useMemo(() => libraryItems.slice(0, 6), [libraryItems])

  const featured = useMemo(
    () =>
      mentors
        .filter((m) => m.rating > 0)
        .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
        .slice(0, 3),
    [mentors]
  )

  // Top 3 cursos por alunos inscritos, desempate pela nota do mentor
  const topCourses = useMemo(
    () =>
      [...courses]
        .sort(
          (a, b) =>
            b.studentCount - a.studentCount || b.mentor.rating - a.mentor.rating
        )
        .slice(0, 3),
    [courses]
  )

  // Top 3 trilhas (a API já devolve ordenada por popularidade)
  const topTracks = useMemo(() => tracks.slice(0, 3), [tracks])

  // Até 3 inscrições para "Continue aprendendo" — prioridade: em andamento (0 < x < 100%),
  // depois não iniciadas (0%), concluídas por último; recência (enrolledAt desc) dentro do grupo
  const continueItems = useMemo(() => {
    const byRecency = (a: EnrolledCourseDTO, b: EnrolledCourseDTO) =>
      b.enrolledAt.localeCompare(a.enrolledAt) // ISO-8601: comparação lexicográfica segura
    const isDone = (e: EnrolledCourseDTO) =>
      e.course.lessonCount > 0 && e.completedLessonIds.length >= e.course.lessonCount
    const started = enrollments
      .filter((e) => !isDone(e) && e.completedLessonIds.length > 0)
      .sort(byRecency)
    const untouched = enrollments
      .filter((e) => e.completedLessonIds.length === 0)
      .sort(byRecency)
    const done = enrollments.filter(isDone).sort(byRecency)
    return [...started, ...untouched, ...done].slice(0, 3)
  }, [enrollments])

  // "Feito para você": recomendações da IA (cruza histórico do aluno com o catálogo).
  // Silencioso em erro/sem resultados — a landing nunca quebra por causa da IA.
  const [recommendations, setRecommendations] = useState<RecommendationDTO[]>([])
  const [recsGenerated, setRecsGenerated] = useState(false)

  useEffect(() => {
    // Convidado: seção oculta (render gated por user) — nada a buscar.
    if (!userId) return
    let active = true
    api
      .recommendations(userId)
      .then((data) => {
        if (!active) return
        setRecommendations(data.items ?? [])
        setRecsGenerated(Boolean(data.generated))
      })
      .catch(() => {
        if (active) setRecommendations([])
      })
    return () => {
      active = false
    }
  }, [userId])

  const handleExploreMentors = () => {
    setExploreTab('mentors')
    navigate({ name: 'marketplace' })
  }

  const handleVerCursos = () => {
    setExploreTab('courses')
    navigate({ name: 'marketplace' })
  }

  const handleVerTrilhas = () => {
    setExploreTab('tracks')
    navigate({ name: 'marketplace' })
  }

  const handleVerBiblioteca = () => {
    setExploreTab('library')
    navigate({ name: 'marketplace' })
  }

  const handleExploreArea = () => {
    setExploreTab('all')
    navigate({ name: 'marketplace' })
  }

  const handleFormatTab = (tab: (typeof FORMATS)[number]['tab']) => {
    setExploreTab(tab)
    navigate({ name: 'marketplace' })
  }

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950">
      {/* ---------- HERO (split com carrossel leve dos formatos) ---------- */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        {/* Atmosfera de marca: brilhos azuis suaves atrás do hero (puro CSS) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[34rem] w-[54rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/[0.12]" />
          <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/10" />
          <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pb-20 pt-14 sm:pb-28 sm:pt-20">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">
            {/* Coluna esquerda: mensagem + busca + prova social — sem animação de entrada: LCP imediato */}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-300 dark:shadow-none">
                <span aria-hidden className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                </span>
                Mentorias, cursos, trilhas e biblioteca — tudo em um só lugar
              </span>

              <h1
                id="hero-title"
                className="mt-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-600 bg-clip-text text-5xl font-semibold leading-[1.05] tracking-[-0.03em] text-transparent sm:text-6xl xl:text-7xl dark:from-slate-50 dark:via-slate-100 dark:to-slate-400"
              >
                {user ? (
                  <>
                    Olá, <span className="text-blue-600 dark:text-blue-300">{firstName(user.name)}</span>! Pronto
                    para{' '}
                    <span className="text-blue-600 dark:text-blue-300">
                      continuar aprendendo
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Aprenda com quem{' '}
                    <span className="text-blue-600 dark:text-blue-300">
                      vive o que ensina
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-500 sm:text-xl dark:text-slate-400">
                Especialistas que viveram o caminho que você quer trilhar — em mentorias 1:1, cursos
                gravados, trilhas guiadas e uma biblioteca completa. Tudo dentro da plataforma, do
                primeiro clique ao certificado.
              </p>

              {/* CTA estilo Apple: pill sólida + link secundário com chevron */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                <Button
                  onClick={handleExploreArea}
                  className="h-12 w-full rounded-full bg-blue-600 px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 sm:w-auto dark:bg-blue-500 dark:text-white dark:shadow-blue-500/20 dark:hover:bg-blue-400"
                >
                  Explorar a plataforma
                </Button>
                <button
                  type="button"
                  onClick={handleVerCursos}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full text-base font-medium text-blue-700 transition-colors hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Ver cursos
                  <ChevronRight aria-hidden className="h-4 w-4" />
                </button>
              </div>

              {/* Prova social: avatares + nota média + avaliações reais */}
              {loading ? (
                <div className="mt-9 flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-44" />
                </div>
              ) : mentors.length > 0 ? (
                <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="flex -space-x-2.5">
                    {mentors.slice(0, 5).map((m) => (
                      <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="sm" />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={avgRating ?? 5} size={14} />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {avgRating ? avgRating.toFixed(1).replace('.', ',') : '—'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">de média</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      +{mentors.length} mentores especialistas · {totalReviews} avaliações reais
                    </p>
                  </div>
                </div>
              ) : null}

            </div>

            {/* Coluna direita: carrossel leve — um formato por vez, sem excesso de efeitos */}
            <div className="relative mt-2 min-w-0 lg:mt-0">
              {/* Brilho azul atrás do card rotativo (decorativo) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-8 rounded-[2rem] bg-gradient-to-br from-blue-500/15 via-sky-400/10 to-transparent blur-2xl dark:from-blue-500/20 dark:via-sky-500/10"
              />
              <HeroRotator onOpen={handleFormatTab} mentors={mentors} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CONTINUE APRENDENDO (apenas logado com inscrições; silencioso enquanto carrega) ---------- */}
      {user && !enrollmentsLoading && continueItems.length > 0 && (
        <section
          aria-labelledby="continue-title"
          className="border-y border-slate-200/70 bg-slate-50/50 py-8 sm:py-10 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2
              id="continue-title"
              className="text-sm font-semibold text-slate-500 dark:text-slate-400"
            >
              Continue aprendendo
            </h2>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm dark:text-slate-500">
              Retome seus cursos exatamente onde parou.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {continueItems.map((enrollment) => (
                <ContinueCourseCard key={enrollment.courseId} enrollment={enrollment} />
              ))}

              {/* CTA final discreto: vitrine de cursos */}
              <button
                type="button"
                onClick={handleVerCursos}
                className="group flex h-full min-h-40 min-w-0 flex-col items-start justify-center gap-1.5 rounded-2xl border border-dashed border-slate-300 p-4 text-left transition hover:border-blue-400 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/30"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-blue-100 group-hover:text-blue-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950/50 dark:group-hover:text-blue-300"
                >
                  <Library className="h-4 w-4" />
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition group-hover:text-blue-800 dark:text-slate-200 dark:group-hover:text-blue-300">
                  Explorar mais cursos
                  <ChevronRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Veja o catálogo completo na vitrine de cursos.
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ---------- META SEMANAL (gamificação, apenas logado) ---------- */}
      {user && <WeeklyGoalCard userId={user.id} />}

      {/* ---------- FEITO PARA VOCÊ (recomendações IA, apenas logado) ---------- */}
      {user && recommendations.length > 0 && (
        <section
          aria-labelledby="foryou-title"
          className="py-8 sm:py-10"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2
                id="foryou-title"
                className="text-sm font-semibold text-slate-500 dark:text-slate-400"
              >
                Feito para você
              </h2>
              {recsGenerated && (
                <Badge className="rounded-full border-blue-200 bg-blue-50 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  IA personalizada
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm dark:text-slate-500">
              {recsGenerated
                ? 'A IA escolheu estes cursos com base no que você está aprendendo.'
                : 'Cursos em alta na comunidade.'}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.course.id} rec={rec} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- QUATRO FORMAS DE APRENDER (a plataforma inteira em uma olhada) ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="formatos-title"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16 sm:py-24"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Tudo em um só lugar
          </p>
          <h2
            id="formatos-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
          >
            Quatro formas de aprender
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
            Escolha um formato — ou combine todos. O progresso se conecta na mesma conta.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMATS.map((format, i) => (
            <Reveal key={format.title} delay={i * 70} className="min-w-0">
              <div className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:group-hover:bg-blue-900/30">
                  <format.icon aria-hidden className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {format.eyebrow}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-50">{format.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {format.text}
                </p>
                <button
                  type="button"
                  onClick={() => handleFormatTab(format.tab)}
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-blue-300 dark:hover:text-blue-200"
                  aria-label={`${format.cta} — ${format.title}`}
                >
                  {format.cta}
                  <ChevronRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>

      {/* ---------- COMO FUNCIONA ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="como-funciona-title"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-4 pt-14 sm:pt-20"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Como funciona
          </p>
            <h2
              id="como-funciona-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
            >
              Do descobrimento ao certificado
            </h2>
          </div>

          <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.number} delay={i * 100} className="relative flex flex-col items-center">
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold tracking-wide text-white ring-4 ring-white dark:bg-blue-500 dark:text-white dark:ring-slate-950">
                  {step.number}
                </div>
                <div className="mt-5 flex w-full min-w-0 flex-1 flex-col items-center rounded-2xl border border-slate-200 bg-white px-5 pb-6 pt-5 text-center transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                    <step.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-semibold text-slate-900 dark:text-slate-50">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
      </Reveal>

      {/* ---------- EXPLORE POR ÁREA (chips de categorias) ---------- */}
      <section
        aria-labelledby="areas-title"
        className="border-y border-slate-200/70 bg-slate-50/60 py-8 sm:py-10 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <h2
              id="areas-title"
              className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400"
            >
              Explore por área
            </h2>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={handleExploreArea}
                    className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- MENTORES EM DESTAQUE ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="destaque-title"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Aprenda ao vivo
            </p>
            <h2
              id="destaque-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
            >
              Mentores em destaque
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Os mais bem avaliados pela comunidade de mentorados.
            </p>
          </div>
          <Button
            variant="link"
            onClick={() => navigate({ name: 'marketplace' })}
            className="gap-1 px-0 font-semibold text-blue-700 dark:text-blue-300"
          >
            Ver todos
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
                >
                  <Skeleton className="h-14 w-full rounded-none" />
                  <div className="p-5">
                    <Skeleton className="-mt-9 h-16 w-16 rounded-full ring-4 ring-white dark:ring-slate-950" />
                    <Skeleton className="mt-4 h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                    <Skeleton className="mt-4 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-4/5" />
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="mt-6 h-11 w-full rounded-full" />
                  </div>
                </div>
              ))
            : featured.map((m) => <FeaturedMentorCard key={m.id} mentor={m} />)}

          {!loading && featured.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3 dark:border-slate-800 dark:text-slate-400">
              Nenhum mentor avaliado por aqui ainda — explore a lista completa.
            </p>
          )}
        </div>
      </Reveal>

      {/* ---------- CURSOS EM DESTAQUE ---------- */}
      {(coursesLoading || topCourses.length > 0) && (
        <section ref={coursesSectionRef} aria-labelledby="cursos-destaque-title">
          <Reveal className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                No seu ritmo
              </p>
              <h2
                id="cursos-destaque-title"
                className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
              >
                Cursos em destaque
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Aprenda no seu ritmo com aulas gravadas e materiais dos nossos mentores.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerCursos}
              className="gap-1 px-0 font-semibold text-blue-700 dark:text-blue-300"
            >
              Ver todos os cursos
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coursesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    <Skeleton className="h-36 w-full rounded-none" />
                    <div className="space-y-2.5 p-5">
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="mt-3 h-11 w-full rounded-full" />
                    </div>
                  </div>
                ))
              : topCourses.map((c) => <FeaturedCourseCard key={c.id} course={c} />)}
          </div>
          </Reveal>
        </section>
      )}

      {/* ---------- TRILHAS EM DESTAQUE ---------- */}
      {(tracksLoading || topTracks.length > 0) && (
        <section ref={tracksSectionRef} aria-labelledby="trilhas-destaque-title">
          <Reveal className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Jornadas guiadas
              </p>
              <h2
                id="trilhas-destaque-title"
                className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
              >
                Trilhas em destaque
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Jornadas guiadas que combinam cursos e mentorias 1:1 dos nossos mentores.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerTrilhas}
              className="gap-1 px-0 font-semibold text-blue-700 dark:text-blue-300"
            >
              Ver todas as trilhas
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracksLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
                  >
                    <Skeleton className="h-36 w-full rounded-none" />
                    <div className="space-y-2.5 p-5">
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="mt-3 h-11 w-full rounded-full" />
                    </div>
                  </div>
                ))
              : topTracks.map((t) => <FeaturedTrackCard key={t.id} track={t} />)}
          </div>
          </Reveal>
        </section>
      )}

      {/* ---------- BIBLIOTECA EM DESTAQUE ---------- */}
      {(libraryLoading || topLibrary.length > 0) && (
        <section ref={librarySectionRef} aria-labelledby="biblioteca-destaque-title">
          <Reveal className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Para ler e reler
              </p>
              <h2
                id="biblioteca-destaque-title"
                className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
              >
                Biblioteca em destaque
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Artigos e livros publicados pelos nossos mentores, com leitor integrado.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerBiblioteca}
              className="gap-1 px-0 font-semibold text-blue-700 dark:text-blue-300"
            >
              Abrir biblioteca
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          {/* Estante: capas e papéis menores lado a lado — 3 colunas no mobile, 6 no desktop */}
          <div className="mt-8 grid grid-cols-3 items-start gap-x-4 gap-y-7 sm:grid-cols-4 sm:gap-x-6 lg:grid-cols-6">
            {libraryLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} aria-hidden>
                    <Skeleton className="aspect-[2/3] w-full rounded-xl" />
                    <div className="space-y-2 pt-3">
                      <Skeleton className="h-3.5 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                    </div>
                  </div>
                ))
              : topLibrary.map((item) => <FeaturedLibraryCard key={item.id} item={item} />)}
          </div>
          </Reveal>
        </section>
      )}

      {/* ---------- A PLATAFORMA EM NÚMEROS (faixa azul de marca) ---------- */}
      <section
        ref={statsSectionRef}
        aria-label="Números da plataforma"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24"
      >
        <Reveal
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 px-6 py-12 ring-1 ring-blue-900/40 sm:px-12 sm:py-14 dark:from-blue-950/70 dark:via-slate-900 dark:to-slate-900 dark:ring-blue-900/30"
        >
          {/* Brilhos decorativos do painel de números */}
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

          <dl className="relative grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-blue-200/75 sm:text-xs">
                mentores especialistas
              </dt>
              {loading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-blue-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  +{mentors.length}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-blue-200/75 sm:text-xs">
                cursos publicados
              </dt>
              {coursesLoading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-blue-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  +{courses.length}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-blue-200/75 sm:text-xs">
                trilhas guiadas
              </dt>
              {tracksLoading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-blue-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  +{tracks.length}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-blue-200/75 sm:text-xs">
                aulas disponíveis
              </dt>
              {coursesLoading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-blue-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  +{totalLessons}
                </dd>
              )}
            </div>
          </dl>
        </Reveal>
      </section>

      {/* ---------- E MUITO MAIS (superpoderes transversais) ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="extras-title"
        className="border-y border-slate-200/70 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              E muito mais
            </p>
            <h2
              id="extras-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
            >
              Superpoderes em toda a plataforma
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
              Recursos que acompanham mentorias, cursos, trilhas e a biblioteca.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXTRAS.map((extra, i) => (
              <Reveal key={extra.title} tag="li" delay={(i % 3) * 70} className="min-w-0">
                <div className="group flex h-full items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:group-hover:bg-blue-900/30">
                    <extra.icon aria-hidden className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{extra.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{extra.text}</p>
                  </span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </Reveal>

      {/* ---------- DEPOIMENTOS ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="depoimentos-title"
        className="border-y border-slate-200/70 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Depoimentos
            </p>
            <h2
              id="depoimentos-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
            >
              Depoimentos de mentorados
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Histórias reais de quem já deu o próximo passo.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => {
              const [namePart, rolePart] = t.author.split(' · ')
              return (
                <figure
                  key={t.author}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 transition dark:border-slate-800 dark:bg-slate-900"
                >
                  <Stars rating={5} size={14} />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={avatarGradient(t.author)}
                    >
                      {initials(namePart ?? t.author)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {namePart?.trim() ?? t.author}
                      </span>
                      {rolePart && (
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{rolePart}</span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </Reveal>

      {/* ---------- FAQ (details/summary nativo — zero JS) ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="faq-title"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Perguntas frequentes
            </p>
            <h2
              id="faq-title"
              className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
            >
              Tudo o que você precisa saber
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Antes da sua primeira sessão, sem surpresas.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                name="mentorhub-faq"
                className="mh-faq group border-slate-100 dark:border-slate-800 [&:not(:first-child)]:border-t"
              >
                <summary
                  className="flex min-h-11 items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-50"
                >
                  {faq.q}
                  <ChevronDown
                    aria-hidden
                    className="mh-faq-chevron h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
                  />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ---------- ACESSIBILIDADE À EDUCAÇÃO (impacto social / ESG) ---------- */}
      <section aria-labelledby="impacto-title" className="mt-4 bg-slate-900 py-16 text-white sm:py-24 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-blue-300">
              Acessibilidade à educação · Impacto social (ESG)
            </p>
            <h2
              id="impacto-title"
              className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Educação que alcança todo mundo
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-100/85 sm:text-lg">
              Levamos palestras sobre temas que importam — cyberbullying, crimes digitais, segurança
              online e outros — a escolas públicas e privadas, com mentores especialistas. Todo
              participante ganha bolsa parcial, e os alunos mais esforçados sem condições de pagar
              concorrem a bolsas integrais.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: Presentation,
                title: 'Palestras que abrem a conversa',
                text: 'Cyberbullying, crimes digitais e outros temas urgentes, apresentados nas escolas pelos nossos mentores.',
              },
              {
                icon: School,
                title: 'Públicas e privadas',
                text: 'Do projeto aberto à turma inteira ao programa personalizado sob medida para colégios particulares.',
              },
              {
                icon: HeartHandshake,
                title: 'Bolsas para todos',
                text: 'Bolsas parciais para todos os participantes — e integrais para os mais esforçados que não têm condições.',
              },
            ].map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-300 ring-1 ring-white/15">
                  <pillar.icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200/80">{pillar.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
            <div>
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">100%</p>
              <p className="mt-1 text-sm text-blue-200/75">
                dos participantes ganham bolsa parcial em projetos escolares
              </p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">Integrais</p>
              <p className="mt-1 text-sm text-blue-200/75">
                para os alunos mais esforçados sem condições de pagar — custo zero
              </p>
            </div>
            <div>
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">Sob medida</p>
              <p className="mt-1 text-sm text-blue-200/75">
                programas personalizados para colégios públicos e particulares
              </p>
            </div>
          </div>

          <div className="mt-10">
            <a
              href="mailto:projetos@orbita.com.br?subject=Projeto%20educacional%20—%20Órbita"
              className="inline-flex min-h-12 items-center rounded-full bg-white px-7 text-base font-medium text-slate-900 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Quero um projeto na minha escola
              <ChevronRight aria-hidden className="ml-1 h-4 w-4" />
            </a>
            <p className="mt-3 text-xs text-blue-200/60">
              Conte um pouco da sua instituição — respondemos com uma proposta.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- CTA DUPLO FINAL ---------- */}
      <Reveal
        tag="section"
        aria-labelledby="cta-title"
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-16 pt-2 sm:pb-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Comece agora
          </p>
          <h2
            id="cta-title"
            className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50"
          >
            Pronto para dar o próximo passo?
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base dark:text-slate-400">
            Escolha o seu lado: aprender com especialistas ou ensinar o que você já vive.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Card azul: quero aprender */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-8 text-white shadow-xl shadow-blue-900/20 sm:p-10 dark:from-blue-800 dark:via-blue-900 dark:to-slate-950">
            {/* Brilho decorativo */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative flex h-full flex-col items-start">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
                <GraduationCap aria-hidden className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                Quero aprender
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-100/85 sm:text-base">
                Mentorias 1:1, cursos, trilhas e biblioteca — comece hoje pelo formato que combina
                com você.
              </p>
              <Button
                onClick={() => navigate({ name: 'marketplace' })}
                className="mt-7 h-12 rounded-full bg-white px-7 font-semibold text-slate-900 hover:bg-slate-100"
              >
                Explorar a plataforma
                <ChevronRight aria-hidden className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Card claro: quero ensinar */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
            <div className="relative flex h-full flex-col items-start">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-900/40">
                <Presentation aria-hidden className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
                Quero ensinar
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                Publique mentorias 1:1, cursos, trilhas e conteúdos no mural — a plataforma cuida
                do vídeo, dos pagamentos e das avaliações.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate({ name: 'for-mentors' })}
                className="mt-7 h-12 rounded-full border-slate-300 px-7 font-semibold text-slate-900 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-700 dark:text-slate-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
              >
                Começar a ensinar
                <ChevronRight aria-hidden className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Slim final: resegurança */}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FINAL_REASSURANCES.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Check aria-hidden className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  )
}

/** Intervalo entre slides do hero rotativo */
const HERO_ROTATE_MS = 5200

/** Carrossel do hero: um card único e leve que alterna entre os 4 formatos da plataforma */
function HeroRotator({
  onOpen,
  mentors,
}: {
  onOpen: (tab: (typeof FORMATS)[number]['tab']) => void
  mentors: MentorListItemDTO[]
}) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const slide = FORMATS[active]

  // Avanço automático — pausa no hover/foco e respeita quem prefere menos movimento
  useEffect(() => {
    if (paused || reducedMotion) return
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % FORMATS.length)
    }, HERO_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, reducedMotion])

  return (
    <div
      role="group"
      aria-roledescription="carrossel"
      aria-label="Formatos da plataforma"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white shadow-xl shadow-slate-900/[0.05] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">

        <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
          {/* key={active} + animação CSS: troca de slide sem lib de animação */}
          <div key={active} className="mh-slide-in min-h-[17rem] sm:min-h-[16rem]">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:ring-blue-900">
                  <slide.icon aria-hidden className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {slide.eyebrow}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {slide.title}
              </h2>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {slide.text}
              </p>

              {/* Um detalhe mínimo por formato (decorativo) */}
              <div className="mt-5">
                {active === 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2.5">
                      {mentors.slice(0, 3).map((m) => (
                        <Avatar
                          key={m.id}
                          name={m.name}
                          src={m.avatarUrl}
                          size="sm"
                          className="ring-2 ring-white dark:ring-slate-900"
                        />
                      ))}
                      {mentors.length === 0 &&
                        Array.from({ length: 3 }).map((_, i) => (
                          <span
                            key={`hero-mentor-filler-${i}`}
                            className="h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white dark:bg-slate-700 dark:ring-slate-900"
                          />
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      especialistas disponíveis agora
                    </p>
                  </div>
                ) : active === 1 ? (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Progresso salvo automaticamente
                      </span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">57%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full w-[57%] rounded-full bg-blue-500" />
                    </div>
                  </div>
                ) : active === 2 ? (
                  <div className="flex items-center gap-2" aria-hidden>
                    {[1, 2, 3].map((s) => (
                      <span key={s} className="flex flex-1 items-center gap-2">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                            s <= 2
                              ? 'bg-blue-700 text-white'
                              : 'border border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                          )}
                        >
                          {s <= 2 ? <Check aria-hidden className="h-3.5 w-3.5" /> : s}
                        </span>
                        {s < 3 && (
                          <span
                            className={cn(
                              'h-px flex-1',
                              s < 2
                                ? 'bg-blue-300 dark:bg-blue-700'
                                : 'bg-slate-200 dark:bg-slate-700'
                            )}
                          />
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md shadow-sm"
                      style={avatarGradient('Biblioteca Órbita')}
                    >
                      <BookOpen aria-hidden className="h-4 w-4 text-white/90" />
                    </span>
                    <span
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md shadow-sm"
                      style={avatarGradient('Artigos e livros')}
                    >
                      <FileText aria-hidden className="h-4 w-4 text-white/90" />
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Leitor integrado, com PDF e favoritos
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpen(slide.tab)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 transition-all hover:gap-2.5 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:text-blue-300 dark:hover:text-blue-200"
              >
                {slide.cta}
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
          </div>
        </div>

        {/* Indicadores: um por formato */}
        <div className="flex items-center gap-1.5 px-6 pb-5 sm:px-8">
          {FORMATS.map((f, i) => (
            <button
              key={f.title}
              type="button"
              aria-label={`Mostrar ${f.title}`}
              aria-current={i === active ? 'true' : undefined}
              onClick={() => setActive(i)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                i === active
                  ? 'w-8 bg-blue-600 dark:bg-blue-400'
                  : 'w-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FeaturedMentorCard({ mentor }: { mentor: MentorListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
      {/* Capa: gradiente determinístico do nome + avatar sobreposto */}
      <div aria-hidden className="relative h-14 w-full shrink-0" style={avatarGradient(mentor.name)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-white/10" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 pt-0">
        <div className="-mt-8 mb-3 flex items-end justify-between gap-2">
          <Avatar name={mentor.name} src={mentor.avatarUrl} size="lg" className="ring-4 ring-white dark:ring-slate-900" />
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
            <Star aria-hidden className="h-3.5 w-3.5 fill-yellow-400 text-blue-400" />
            {mentor.rating.toFixed(1).replace('.', ',')}
          </span>
        </div>

        <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900 dark:text-slate-50">
          {mentor.name}
          {mentor.rating >= 4.5 && mentor.reviewCount >= 3 && (
            <BadgeCheck
              aria-label="Mentor bem avaliado"
              className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
            />
          )}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {firstName(mentor.name)} · {mentor.experienceYears} anos de experiência
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          <Stars rating={mentor.rating} size={13} />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{mentor.rating.toFixed(1)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">({mentor.reviewCount})</span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{mentor.headline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.categories.slice(0, 2).map((c) => (
            <Badge key={c} className="bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              {c}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="font-semibold text-slate-900 dark:text-slate-50">
            {currencyBRL(mentor.hourlyRate)}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/h</span>
          </p>
          <Button
            size="sm"
            className="h-11 rounded-full px-5"
            onClick={() => navigate({ name: 'mentor', mentorId: mentor.id })}
            aria-label={`Ver perfil de ${mentor.name}`}
          >
            Ver perfil
          </Button>
        </div>
      </div>
    </article>
  )
}

function FeaturedCourseCard({ course }: { course: CourseListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full shrink-0 bg-slate-100 dark:bg-slate-800">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={avatarGradient(course.title)}
          >
            <Library className="pointer-events-none absolute -bottom-2 right-2 h-16 w-16 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge className="rounded-full bg-blue-50 text-[11px] text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            {course.category}
          </Badge>
          <Badge className="rounded-full bg-slate-100 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-semibold leading-snug text-slate-900 dark:text-slate-50">
          {course.title}
        </p>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">por {course.mentor.name}</p>

        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {formatTotalDuration(course.totalDurationMin)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {course.studentCount}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p
            className={cn(
              'text-sm font-semibold',
              course.price === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-50'
            )}
          >
            {course.price === 0 ? 'Grátis' : currencyBRL(course.price)}
          </p>
          <Button
            size="sm"
            className="h-11 rounded-full px-5 font-semibold"
            onClick={() => navigate({ name: 'course', courseId: course.id })}
            aria-label={`Ver curso ${course.title}`}
          >
            Ver curso
          </Button>
        </div>
      </div>
    </article>
  )
}

function FeaturedTrackCard({ track }: { track: TrackListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
      onClick={() => navigate({ name: 'track', trackId: track.id })}
    >
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full shrink-0 bg-slate-100 dark:bg-slate-800">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={avatarGradient(track.title)}
          >
            <Route className="pointer-events-none absolute -bottom-2 right-2 h-16 w-16 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge className="rounded-full border border-teal-200 bg-teal-50 text-[11px] text-teal-700 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-300">
            Trilha
          </Badge>
          <Badge className="rounded-full bg-slate-100 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {track.category}
          </Badge>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-semibold leading-snug text-slate-900 dark:text-slate-50">
          {track.title}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {track.courseCount} {track.courseCount === 1 ? 'curso' : 'cursos'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {track.mentorshipSessions} {track.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {formatTotalDuration(track.totalDurationMin)}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <Avatar
            name={track.mentor.name}
            src={track.mentor.avatarUrl}
            size="sm"
            className="h-5 w-5 text-[8px] ring-0"
          />
          <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            por {firstName(track.mentor.name)}
          </span>
          <Stars rating={track.mentor.rating} size={11} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p
            className={cn(
              'text-sm font-semibold',
              track.price === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-50'
            )}
          >
            {track.price === 0 ? 'Grátis' : currencyBRL(track.price)}
          </p>
          <Button
            size="sm"
            className="h-11 rounded-full px-5 font-semibold"
            onClick={(e) => {
              e.stopPropagation()
              navigate({ name: 'track', trackId: track.id })
            }}
            aria-label={`Ver trilha ${track.title}`}
          >
            Ver trilha
          </Button>
        </div>
      </div>
    </article>
  )
}

// ---------- Cards de item da Biblioteca para "Biblioteca em destaque" ----------
// Livro → capa em retrato com lombada (estante); Artigo → papel de revista (mesma estatura)

function FeaturedBookCard({ item }: { item: LibraryItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article
      className="group min-w-0 cursor-pointer"
      onClick={() => navigate({ name: 'reader', itemId: item.id })}
      aria-label={`Ler o livro ${item.title}, ${item.readingMin} minutos, por ${item.author.name}`}
    >
      {/* O livro: capa retrato 2:3, lombada à esquerda, cantos retos na lombada e arredondados nas páginas */}
      <div
        className={cn(
          'relative aspect-[2/3] overflow-hidden rounded-l-[5px] rounded-r-xl bg-slate-100 dark:bg-slate-800',
          'shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_28px_-14px_rgba(0,0,0,0.30)]',
          'transition-[box-shadow,transform] duration-300',
          'group-hover:-translate-y-1 group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_22px_44px_-18px_rgba(0,0,0,0.38)]',
          'dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_28px_-14px_rgba(0,0,0,0.7)]'
        )}
      >
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div aria-hidden className="absolute inset-0" style={avatarGradient(item.title)}>
            <BookOpen className="pointer-events-none absolute -bottom-4 right-2 h-24 w-24 text-white/15" />
          </div>
        )}
        {/* Lombada: sombra interna + fio de luz na dobra */}
        <div aria-hidden className="absolute inset-y-0 left-0 w-[11px] bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
        <div aria-hidden className="absolute inset-y-0 left-[10px] w-px bg-white/25" />
        {/* Brilho de papel no topo */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          Livro
        </span>
      </div>

      {/* Legenda sob a capa */}
      <div className="pt-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
          {item.title}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Avatar
            name={item.author.name}
            src={item.author.avatarUrl}
            size="sm"
            className="h-4.5 w-4.5 shrink-0 text-[8px] ring-0"
          />
          <span className="truncate">
            {item.author.name} · {item.readingMin} min
          </span>
        </div>
      </div>
    </article>
  )
}

function FeaturedArticleCard({ item }: { item: LibraryItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article
      className="group min-w-0 cursor-pointer"
      onClick={() => navigate({ name: 'reader', itemId: item.id })}
      aria-label={`Ler o artigo ${item.title}, ${item.readingMin} minutos, por ${item.author.name}`}
    >
      {/* O papel: retrato 3/4 com masthead tipográfico no topo e ficha na base — mesma estatura do livro, formato diferente */}
      <div
        className={cn(
          'relative flex aspect-[3/4] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-3.5 sm:p-4',
          'shadow-[0_1px_2px_rgba(0,0,0,0.05),0_8px_20px_-12px_rgba(0,0,0,0.22)]',
          'transition-[box-shadow,transform,border-color] duration-300',
          'group-hover:-translate-y-1 group-hover:border-blue-300',
          'group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.07),0_18px_36px_-16px_rgba(0,0,0,0.30)]',
          'dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_20px_-12px_rgba(0,0,0,0.55)]',
          'dark:group-hover:border-blue-700'
        )}
      >
        {/* Masthead: chip Artigo + categoria, hairline embaixo (cara de periódico) */}
        <div className="flex items-baseline justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
            Artigo
          </span>
          <span className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {item.category}
          </span>
        </div>

        {/* Título no miolo do papel */}
        <p className="mt-3 line-clamp-4 text-[15px] font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {item.description}
          </p>
        )}

        {/* Ficha da base: autor + tempo de leitura */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 pt-2.5 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar
              name={item.author.name}
              src={item.author.avatarUrl}
              size="sm"
              className="h-4.5 w-4.5 shrink-0 text-[8px] ring-0"
            />
            <span className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {item.author.name}
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Clock aria-hidden className="h-3 w-3" />
            {item.readingMin} min
          </span>
        </div>
      </div>
    </article>
  )
}

function FeaturedLibraryCard({ item }: { item: LibraryItemDTO }) {
  return item.kind === 'BOOK' ? <FeaturedBookCard item={item} /> : <FeaturedArticleCard item={item} />
}

// ---------- Card de matrícula para "Continue aprendendo" ----------
function ContinueCourseCard({ enrollment }: { enrollment: EnrolledCourseDTO }) {
  const navigate = useAppStore((s) => s.navigate)
  const { course, completedLessonIds } = enrollment
  // Padrão do dashboard (EnrolledCourseCard): total piso 1 evita divisão por zero
  const total = Math.max(course.lessonCount, 1)
  const completed = completedLessonIds.length
  const pct = Math.min(100, Math.round((completed / total) * 100))
  const isDone = completed >= course.lessonCount && course.lessonCount > 0

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback (padrão FeaturedCourseCard) */}
      <div className="relative h-16 w-full shrink-0 bg-slate-100 dark:bg-slate-800">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div aria-hidden className="absolute inset-0" style={avatarGradient(course.title)}>
            <Library className="pointer-events-none absolute -bottom-1 right-1.5 h-10 w-10 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-h-10 line-clamp-2 min-w-0 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {course.title}
          </h3>
          {isDone && (
            <Badge className="rounded-full border-blue-200 bg-blue-100 text-[11px] font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <CheckCircle2 aria-hidden /> Concluído
            </Badge>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">por {course.mentor.name}</p>

        <div className="mt-3">
          <Progress value={pct} className="h-1.5" aria-label={`${pct}% do curso concluído`} />
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {completed} de {course.lessonCount} aulas concluídas
            </span>
            <span className="font-semibold text-slate-400 dark:text-slate-500">{pct}%</span>
          </div>
        </div>

        <div className="mt-auto pt-3.5">
          <Button
            size="sm"
            className="h-11 w-full rounded-full font-semibold"
            onClick={() => navigate({ name: 'course', courseId: enrollment.courseId })}
            aria-label={`Continuar curso ${course.title}`}
          >
            {isDone ? 'Revisar' : 'Continuar'}
          </Button>
        </div>
      </div>
    </article>
  )
}

// ---------- Card de recomendação para "Feito para você" ----------

function RecommendationCard({ rec }: { rec: RecommendationDTO }) {
  const navigate = useAppStore((s) => s.navigate)
  const course = rec.course
  const isFree = course.price <= 0

  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-16 w-full shrink-0 bg-slate-100 dark:bg-slate-800">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div aria-hidden className="absolute inset-0" style={avatarGradient(course.title)}>
            <Library className="pointer-events-none absolute -bottom-1 right-1.5 h-10 w-10 text-white/20" />
          </div>
        )}
        <Badge className="absolute right-2 top-2 rounded-full border-white/40 bg-slate-950/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm dark:border-white/20">
          {course.category}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="min-h-10 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
          {course.title}
        </h3>
        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
          por {course.mentor.name}
        </p>

        {/* Motivo da recomendação (IA) */}
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-blue-50/80 px-2.5 py-2 text-xs leading-snug text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          <Sparkles aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-2">{rec.reason}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <span
            className={cn(
              'text-sm font-semibold',
              isFree
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-slate-900 dark:text-slate-50'
            )}
          >
            {isFree ? 'Gratuito' : currencyBRL(course.price)}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-full border-blue-200 px-4 text-xs font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/30"
            onClick={() => navigate({ name: 'course', courseId: course.id })}
            aria-label={`Ver curso ${course.title}`}
          >
            Ver curso
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  )
}

// ---------- Card "Meta semanal" (gamificação do aprendizado, apenas logado) ----------

const GOAL_CHIPS: number[] = [2, 3, 5, 7]

function WeeklyGoalCard({ userId }: { userId: string }) {
  const [goal, setGoal] = useState<WeeklyGoalDTO | null>(null)
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    api
      .getWeeklyGoal(userId)
      .then((data) => {
        if (active) setGoal(data)
      })
      .catch(() => {
        if (active) setFailed(true) // erro: card some silenciosamente
      })
    return () => {
      active = false
    }
  }, [userId])

  if (failed) return null

  // Atualização otimista: chip aplica na hora e reconcilia com o servidor
  const applyTarget = (nextTarget: number) => {
    if (!goal || saving || goal.targetLessons === nextTarget) return
    const previous = goal
    setSaving(true)
    setGoal({
      ...goal,
      targetLessons: nextTarget,
      goalAchieved: goal.completedLessons >= nextTarget,
    })
    api
      .updateWeeklyGoal({ userId, targetLessons: nextTarget })
      .then((data) => {
        setGoal(data)
        setSaving(false)
      })
      .catch(() => {
        setGoal(previous) // rollback silencioso
        setSaving(false)
      })
  }

  // Loading: skeleton no lugar do card
  if (!goal) {
    return (
      <section aria-label="Meta semanal de estudos" className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div
            aria-hidden
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
            <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="h-11 w-11 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const completed = goal.completedLessons
  const target = goal.targetLessons
  const pct = Math.min(100, Math.round((completed / Math.max(target, 1)) * 100))

  return (
    <section aria-label="Meta semanal de estudos" className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          {/* Cabeçalho: ícone + título + subtítulo + badge de meta batida */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
              >
                <Target className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">Meta semanal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {completed} de {target} {target === 1 ? 'aula' : 'aulas'} nesta semana
                </p>
              </div>
            </div>
            {goal.goalAchieved && (
              <Badge className="rounded-full border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                <Trophy aria-hidden className="h-3.5 w-3.5" />
                Meta batida! 🎉
              </Badge>
            )}
          </div>

          {/* Progresso da semana */}
          <div className="mt-4">
            <Progress
              value={pct}
              className="h-2.5"
              aria-label={`${pct}% da meta semanal concluída`}
            />
            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="shrink-0 text-slate-400 dark:text-slate-500">{pct}% da meta</span>
              {goal.goalAchieved && (
                <span className="text-right font-semibold text-blue-700 dark:text-blue-300">
                  Parabéns! Foram {completed}{' '}
                  {completed === 1 ? 'aula concluída' : 'aulas concluídas'} nesta semana. 🎉
                </span>
              )}
            </div>
          </div>

          {/* Editor: chips 2 · 3 · 5 · 7 (toque ≥44px, ativo emerald sólido) */}
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Aulas por semana
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {GOAL_CHIPS.map((chipTarget) => {
                const isActive = chipTarget === goal.targetLessons
                return (
                  <button
                    key={chipTarget}
                    type="button"
                    disabled={saving}
                    onClick={() => applyTarget(chipTarget)}
                    aria-pressed={isActive}
                    aria-label={`Definir meta de ${chipTarget} ${chipTarget === 1 ? 'aula' : 'aulas'} por semana`}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
                      isActive
                        ? 'border-blue-700 bg-blue-700 text-white shadow-sm shadow-blue-700/25 dark:border-blue-500 dark:bg-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-300',
                      saving && 'cursor-wait opacity-70'
                    )}
                  >
                    {chipTarget}
                  </button>
                )
              })}
              <span className="ml-1 text-xs text-slate-400 dark:text-slate-500">
                Cada aula concluída conta para a sua ofensiva e para o XP.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
