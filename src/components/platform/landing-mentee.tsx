'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Library,
  MessagesSquare,
  MonitorPlay,
  Presentation,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Video,
} from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
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
    q: 'O que eu encontro na MentorHub?',
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
    q: 'Como me tornar um mentor na MentorHub?',
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
  const user = useAppStore((s) => s.user)
  const [mentors, setMentors] = useState<MentorListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [tracks, setTracks] = useState<TrackListItemDTO[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)

  // Fetch preguiçoso: cursos e trilhas só saem quando as seções se aproximam da viewport
  const coursesSectionRef = useRef<HTMLElement | null>(null)
  const coursesInView = useInView(coursesSectionRef, { once: true, margin: '600px' })
  const tracksSectionRef = useRef<HTMLElement | null>(null)
  const tracksInView = useInView(tracksSectionRef, { once: true, margin: '600px' })

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
  const statsSectionRef = useRef<HTMLElement | null>(null)
  const statsInView = useInView(statsSectionRef, { once: true, margin: '600px' })

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
  const librarySectionRef = useRef<HTMLElement | null>(null)
  const libraryInView = useInView(librarySectionRef, { once: true, margin: '600px' })
  const [libraryItems, setLibraryItems] = useState<LibraryItemDTO[]>([])
  const [libraryLoading, setLibraryLoading] = useState(true)

  useEffect(() => {
    if (!libraryInView) return
    let active = true
    api
      .listLibrary({ sort: 'popular' })
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

  // Top 3 itens da biblioteca (a API já devolve ordenada por popularidade)
  const topLibrary = useMemo(() => libraryItems.slice(0, 3), [libraryItems])

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
    <div className="flex flex-col bg-white dark:bg-stone-950">
      {/* ---------- HERO (split com carrossel leve dos formatos) ---------- */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        {/* Decoração de fundo: um único brilho suave — leve, sem ruído */}
        <div
          aria-hidden
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-950/40"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 sm:pt-16 lg:pb-24">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-12">
            {/* Coluna esquerda: mensagem + busca + prova social */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="min-w-0"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Sparkles aria-hidden className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
                Mentorias, cursos, trilhas e biblioteca — tudo em um só lugar
              </span>

              <h1
                id="hero-title"
                className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl xl:text-6xl dark:text-stone-50"
              >
                {user ? (
                  <>
                    Olá, <span className="text-emerald-700 dark:text-emerald-300">{firstName(user.name)}</span>! Pronto
                    para{' '}
                    <span className="underline decoration-emerald-400/60 decoration-[0.12em] underline-offset-[0.16em]">
                      continuar aprendendo
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Aprenda com quem{' '}
                    <span className="text-emerald-700 underline decoration-emerald-400/60 decoration-[0.12em] underline-offset-[0.16em] dark:text-emerald-300">
                      vive o que ensina
                    </span>
                  </>
                )}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg dark:text-stone-300">
                Especialistas que viveram o caminho que você quer trilhar — em mentorias 1:1, cursos
                gravados, trilhas guiadas e uma biblioteca completa. Tudo dentro da plataforma, do
                primeiro clique ao certificado.
              </p>

              {/* CTA: a busca vive na barra central do header — aqui, o convite direto */}
              <div className="mt-8 flex max-w-xl flex-col gap-2.5 sm:flex-row sm:items-center">
                <Button
                  onClick={handleExploreArea}
                  className="h-13 w-full rounded-full px-8 font-bold shadow-sm shadow-emerald-700/20 sm:w-auto"
                >
                  <Search aria-hidden className="h-4.5 w-4.5" /> Explorar tudo
                </Button>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  ou use a busca acima ✨
                </p>
              </div>

              {/* Prova social: avatares + nota média + avaliações reais */}
              {loading ? (
                <div className="mt-7 flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-44" />
                </div>
              ) : mentors.length > 0 ? (
                <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className="flex -space-x-2.5">
                    {mentors.slice(0, 5).map((m) => (
                      <Avatar key={m.id} name={m.name} src={m.avatarUrl} size="sm" />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={avgRating ?? 5} size={14} />
                      <span className="text-sm font-bold text-stone-800 dark:text-stone-200">
                        {avgRating ? avgRating.toFixed(1).replace('.', ',') : '—'}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">de média</span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      +{mentors.length} mentores especialistas · {totalReviews} avaliações reais
                    </p>
                  </div>
                </div>
              ) : null}

            </motion.div>

            {/* Coluna direita: carrossel leve — um formato por vez, sem excesso de efeitos */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="relative mt-2 min-w-0 lg:mt-0"
            >
              <HeroRotator onOpen={handleFormatTab} mentors={mentors} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------- CONTINUE APRENDENDO (apenas logado com inscrições; silencioso enquanto carrega) ---------- */}
      {user && !enrollmentsLoading && continueItems.length > 0 && (
        <section
          aria-labelledby="continue-title"
          className="border-y border-stone-200/70 bg-stone-50/50 py-8 sm:py-10 dark:border-stone-800 dark:bg-stone-900/60"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2
              id="continue-title"
              className="text-sm font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400"
            >
              Continue aprendendo
            </h2>
            <p className="mt-1 text-xs text-stone-400 sm:text-sm dark:text-stone-500">
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
                className="group flex h-full min-h-40 min-w-0 flex-col items-start justify-center gap-1.5 rounded-2xl border border-dashed border-stone-300 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-stone-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/30"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500 transition group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:bg-stone-800 dark:text-stone-400 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-300"
                >
                  <Library className="h-4 w-4" />
                </span>
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-stone-700 transition group-hover:text-emerald-800 dark:text-stone-200 dark:group-hover:text-emerald-300">
                  Explorar mais cursos
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500">
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
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                aria-hidden
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2
                id="foryou-title"
                className="text-sm font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400"
              >
                Feito para você
              </h2>
              {recsGenerated && (
                <Badge className="rounded-full border-emerald-200 bg-emerald-50 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  IA personalizada
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-400 sm:text-sm dark:text-stone-500">
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
      <motion.section
        aria-labelledby="formatos-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Tudo em um só lugar
          </p>
          <h2
            id="formatos-title"
            className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
          >
            Quatro formas de aprender
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base dark:text-stone-400">
            Escolha um formato — ou combine todos. O progresso se conecta na mesma conta.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FORMATS.map((format, i) => (
            <motion.div
              key={format.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="min-w-0"
            >
              <div className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:group-hover:bg-emerald-900/30">
                  <format.icon aria-hidden className="h-5 w-5" />
                </span>
                <p className="mt-4 text-[10px] font-extrabold uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  {format.eyebrow}
                </p>
                <h3 className="mt-1 font-extrabold text-stone-900 dark:text-stone-50">{format.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {format.text}
                </p>
                <button
                  type="button"
                  onClick={() => handleFormatTab(format.tab)}
                  className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-300 dark:hover:text-emerald-200"
                  aria-label={`${format.cta} — ${format.title}`}
                >
                  {format.cta}
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ---------- COMO FUNCIONA ---------- */}
      <motion.section
        aria-labelledby="como-funciona-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 pb-4 pt-14 sm:pt-20"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Como funciona
          </p>
            <h2
              id="como-funciona-title"
              className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
            >
              Do descobrimento ao certificado
            </h2>
          </div>

          <div className="relative mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {/* Linha tracejada conectando os círculos no desktop */}
            <div
              aria-hidden
              className="absolute left-[16%] right-[16%] top-8 hidden border-t-2 border-dashed border-emerald-200 sm:block dark:border-emerald-900"
            />
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative flex flex-col items-center"
              >
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-extrabold tracking-wide text-white shadow-lg shadow-emerald-700/25 ring-4 ring-white dark:ring-stone-950">
                  {step.number}
                </div>
                <div className="mt-5 flex w-full min-w-0 flex-1 flex-col items-center rounded-2xl border border-stone-200 bg-white px-5 pb-6 pt-5 text-center transition hover:border-emerald-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <step.icon aria-hidden className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-extrabold text-stone-900 dark:text-stone-50">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
      </motion.section>

      {/* ---------- EXPLORE POR ÁREA (chips de categorias) ---------- */}
      <section
        aria-labelledby="areas-title"
        className="border-y border-stone-200/70 bg-stone-50/60 py-8 sm:py-10 dark:border-stone-800 dark:bg-stone-900/60"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
            <h2
              id="areas-title"
              className="shrink-0 text-sm font-extrabold uppercase tracking-widest text-stone-500 dark:text-stone-400"
            >
              Explore por área
            </h2>
            <ul className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={handleExploreArea}
                    className="inline-flex min-h-11 items-center rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
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
      <motion.section
        aria-labelledby="destaque-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Aprenda ao vivo
            </p>
            <h2
              id="destaque-title"
              className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
            >
              Mentores em destaque
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Os mais bem avaliados pela comunidade de mentorados.
            </p>
          </div>
          <Button
            variant="link"
            onClick={() => navigate({ name: 'marketplace' })}
            className="gap-1 px-0 font-semibold text-emerald-700 dark:text-emerald-300"
          >
            Ver todos
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800"
                >
                  <Skeleton className="h-14 w-full rounded-none" />
                  <div className="p-5">
                    <Skeleton className="-mt-9 h-16 w-16 rounded-full ring-4 ring-white dark:ring-stone-950" />
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
            <p className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-sm text-stone-500 sm:col-span-2 lg:col-span-3 dark:border-stone-800 dark:text-stone-400">
              Nenhum mentor avaliado por aqui ainda — explore a lista completa.
            </p>
          )}
        </div>
      </motion.section>

      {/* ---------- CURSOS EM DESTAQUE ---------- */}
      {(coursesLoading || topCourses.length > 0) && (
        <motion.section
          ref={coursesSectionRef}
          aria-labelledby="cursos-destaque-title"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                No seu ritmo
              </p>
              <h2
                id="cursos-destaque-title"
                className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
              >
                Cursos em destaque
              </h2>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Aprenda no seu ritmo com aulas gravadas e materiais dos nossos mentores.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerCursos}
              className="gap-1 px-0 font-semibold text-emerald-700 dark:text-emerald-300"
            >
              Ver todos os cursos
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coursesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800"
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
        </motion.section>
      )}

      {/* ---------- TRILHAS EM DESTAQUE ---------- */}
      {(tracksLoading || topTracks.length > 0) && (
        <motion.section
          ref={tracksSectionRef}
          aria-labelledby="trilhas-destaque-title"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Jornadas guiadas
              </p>
              <h2
                id="trilhas-destaque-title"
                className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
              >
                Trilhas em destaque
              </h2>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Jornadas guiadas que combinam cursos e mentorias 1:1 dos nossos mentores.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerTrilhas}
              className="gap-1 px-0 font-semibold text-emerald-700 dark:text-emerald-300"
            >
              Ver todas as trilhas
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracksLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800"
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
        </motion.section>
      )}

      {/* ---------- BIBLIOTECA EM DESTAQUE ---------- */}
      {(libraryLoading || topLibrary.length > 0) && (
        <motion.section
          ref={librarySectionRef}
          aria-labelledby="biblioteca-destaque-title"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Para ler e reler
              </p>
              <h2
                id="biblioteca-destaque-title"
                className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
              >
                Biblioteca em destaque
              </h2>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                Artigos e livros publicados pelos nossos mentores, com leitor integrado.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerBiblioteca}
              className="gap-1 px-0 font-semibold text-emerald-700 dark:text-emerald-300"
            >
              Abrir biblioteca
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {libraryLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800"
                  >
                    <Skeleton className="h-36 w-full rounded-none" />
                    <div className="space-y-2.5 p-5">
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="mt-3 h-11 w-full rounded-full" />
                    </div>
                  </div>
                ))
              : topLibrary.map((item) => <FeaturedLibraryCard key={item.id} item={item} />)}
          </div>
        </motion.section>
      )}

      {/* ---------- A PLATAFORMA EM NÚMEROS (faixa dark emerald-950) ---------- */}
      <section
        ref={statsSectionRef}
        aria-label="Números da plataforma"
        className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-emerald-950 px-6 py-10 sm:px-12 sm:py-12"
        >
          <div
            aria-hidden
            className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-emerald-600/25 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
          />

          <dl className="relative grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200/75 sm:text-xs">
                mentores especialistas
              </dt>
              {loading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  +{mentors.length}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200/75 sm:text-xs">
                cursos publicados
              </dt>
              {coursesLoading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  +{courses.length}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200/75 sm:text-xs">
                trilhas guiadas
              </dt>
              {tracksLoading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  +{tracks.length}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200/75 sm:text-xs">
                aulas disponíveis
              </dt>
              {coursesLoading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  +{totalLessons}
                </dd>
              )}
            </div>
          </dl>
        </motion.div>
      </section>

      {/* ---------- E MUITO MAIS (superpoderes transversais) ---------- */}
      <motion.section
        aria-labelledby="extras-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="border-y border-stone-200/70 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/60"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              E muito mais
            </p>
            <h2
              id="extras-title"
              className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
            >
              Superpoderes em toda a plataforma
            </h2>
            <p className="mt-2 text-sm text-stone-500 sm:text-base dark:text-stone-400">
              Recursos que acompanham mentorias, cursos, trilhas e a biblioteca.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXTRAS.map((extra, i) => (
              <motion.li
                key={extra.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
                className="min-w-0"
              >
                <div className="group flex h-full items-start gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:group-hover:bg-emerald-900/30">
                    <extra.icon aria-hidden className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <h3 className="font-bold text-stone-900 dark:text-stone-50">{extra.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{extra.text}</p>
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* ---------- DEPOIMENTOS ---------- */}
      <motion.section
        aria-labelledby="depoimentos-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="border-y border-stone-200/70 bg-stone-50/60 dark:border-stone-800 dark:bg-stone-900/60"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Depoimentos
            </p>
            <h2
              id="depoimentos-title"
              className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
            >
              Depoimentos de mentorados
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Histórias reais de quem já deu o próximo passo.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => {
              const [namePart, rolePart] = t.author.split(' · ')
              return (
                <figure
                  key={t.author}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
                >
                  <Stars rating={5} size={14} />
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-2.5 border-t border-stone-100 pt-4 dark:border-stone-800">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                      style={avatarGradient(t.author)}
                    >
                      {initials(namePart ?? t.author)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-stone-800 dark:text-stone-200">
                        {namePart?.trim() ?? t.author}
                      </span>
                      {rolePart && (
                        <span className="block truncate text-xs text-stone-500 dark:text-stone-400">{rolePart}</span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </motion.section>

      {/* ---------- FAQ ---------- */}
      <motion.section
        aria-labelledby="faq-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              Perguntas frequentes
            </p>
            <h2
              id="faq-title"
              className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
            >
              Tudo o que você precisa saber
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Antes da sua primeira sessão, sem surpresas.
            </p>
          </div>

          <Accordion
            type="single"
            collapsible
            className="mt-8 rounded-2xl border border-stone-200 bg-white px-5 shadow-sm sm:px-6 dark:border-stone-800 dark:bg-stone-900"
          >
            {FAQS.map((faq, i) => (
              <AccordionItem key={faq.q} value={`faq-${i}`} className="border-stone-100 dark:border-stone-800">
                <AccordionTrigger className="py-5 text-left text-sm font-bold text-stone-900 hover:no-underline sm:text-base dark:text-stone-50">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.section>

      {/* ---------- CTA DUPLO FINAL ---------- */}
      <motion.section
        aria-labelledby="cta-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 pb-16 pt-2 sm:pb-24"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Comece agora
          </p>
          <h2
            id="cta-title"
            className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
          >
            Pronto para dar o próximo passo?
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base dark:text-stone-400">
            Escolha o seu lado: aprender com especialistas ou ensinar o que você já vive.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Card escuro: quero aprender */}
          <div className="relative overflow-hidden rounded-3xl bg-emerald-950 p-8 text-white sm:p-10">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
            />
            <div className="relative flex h-full flex-col items-start">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
                <GraduationCap aria-hidden className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Quero aprender
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-emerald-100/85 sm:text-base">
                Mentorias 1:1, cursos, trilhas e biblioteca — comece hoje pelo formato que combina
                com você.
              </p>
              <Button
                onClick={() => navigate({ name: 'marketplace' })}
                className="mt-7 h-12 rounded-full bg-white px-7 font-bold text-emerald-950 hover:bg-emerald-50"
              >
                Explorar a plataforma
                <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Card claro: quero ensinar */}
          <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-8 sm:p-10 dark:border-stone-800 dark:bg-stone-900">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-950/50"
            />
            <div className="relative flex h-full flex-col items-start">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/40">
                <Presentation aria-hidden className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50">
                Quero ensinar
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base dark:text-stone-300">
                Publique mentorias 1:1, cursos, trilhas e conteúdos no mural — a plataforma cuida
                do vídeo, dos pagamentos e das avaliações.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate({ name: 'for-mentors' })}
                className="mt-7 h-12 rounded-full border-stone-300 px-7 font-bold text-stone-900 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 dark:border-stone-700 dark:text-stone-50 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
              >
                Começar a ensinar
                <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Slim final: resegurança */}
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FINAL_REASSURANCES.map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
              <Check aria-hidden className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
      </motion.section>
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
  const reducedMotion = useReducedMotion()
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
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <div
          aria-hidden
          className="h-1 w-full bg-gradient-to-r from-emerald-600/70 via-teal-400/50 to-amber-300/60"
        />

        <div className="px-6 pb-4 pt-6 sm:px-8 sm:pt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="min-h-[17rem] sm:min-h-[16rem]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900">
                  <slide.icon aria-hidden className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                  {slide.eyebrow}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                {slide.title}
              </h2>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
                          className="ring-2 ring-white dark:ring-stone-900"
                        />
                      ))}
                      {mentors.length === 0 &&
                        Array.from({ length: 3 }).map((_, i) => (
                          <span
                            key={`hero-mentor-filler-${i}`}
                            className="h-8 w-8 rounded-full bg-stone-200 ring-2 ring-white dark:bg-stone-700 dark:ring-stone-900"
                          />
                        ))}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      especialistas disponíveis agora
                    </p>
                  </div>
                ) : active === 1 ? (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 dark:text-stone-400">
                        Progresso salvo automaticamente
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">57%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                      <div className="h-full w-[57%] rounded-full bg-emerald-500" />
                    </div>
                  </div>
                ) : active === 2 ? (
                  <div className="flex items-center gap-2" aria-hidden>
                    {[1, 2, 3].map((s) => (
                      <span key={s} className="flex flex-1 items-center gap-2">
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold',
                            s <= 2
                              ? 'bg-emerald-700 text-white'
                              : 'border border-stone-300 bg-white text-stone-400 dark:border-stone-600 dark:bg-stone-800'
                          )}
                        >
                          {s <= 2 ? <Check aria-hidden className="h-3.5 w-3.5" /> : s}
                        </span>
                        {s < 3 && (
                          <span
                            className={cn(
                              'h-px flex-1',
                              s < 2
                                ? 'bg-emerald-300 dark:bg-emerald-700'
                                : 'bg-stone-200 dark:bg-stone-700'
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
                      style={avatarGradient('Biblioteca MentorHub')}
                    >
                      <BookOpen aria-hidden className="h-4 w-4 text-white/90" />
                    </span>
                    <span
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md shadow-sm"
                      style={avatarGradient('Artigos e livros')}
                    >
                      <FileText aria-hidden className="h-4 w-4 text-white/90" />
                    </span>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Leitor integrado, com PDF e favoritos
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpen(slide.tab)}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition-all hover:gap-2.5 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                {slide.cta}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
            </motion.div>
          </AnimatePresence>
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
                'h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                i === active
                  ? 'w-8 bg-emerald-600 dark:bg-emerald-400'
                  : 'w-3 bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600'
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
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
      {/* Capa: gradiente determinístico do nome + avatar sobreposto */}
      <div aria-hidden className="relative h-14 w-full shrink-0" style={avatarGradient(mentor.name)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-white/10" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 pt-0">
        <div className="-mt-8 mb-3 flex items-end justify-between gap-2">
          <Avatar name={mentor.name} src={mentor.avatarUrl} size="lg" className="ring-4 ring-white dark:ring-stone-900" />
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-stone-800 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:ring-stone-800">
            <Star aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {mentor.rating.toFixed(1).replace('.', ',')}
          </span>
        </div>

        <p className="flex items-center gap-1.5 truncate font-bold text-stone-900 dark:text-stone-50">
          {mentor.name}
          {mentor.rating >= 4.5 && mentor.reviewCount >= 3 && (
            <BadgeCheck
              aria-label="Mentor bem avaliado"
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            />
          )}
        </p>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {firstName(mentor.name)} · {mentor.experienceYears} anos de experiência
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          <Stars rating={mentor.rating} size={13} />
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">{mentor.rating.toFixed(1)}</span>
          <span className="text-xs text-stone-500 dark:text-stone-400">({mentor.reviewCount})</span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{mentor.headline}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.categories.slice(0, 2).map((c) => (
            <Badge key={c} className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              {c}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
          <p className="font-extrabold text-stone-900 dark:text-stone-50">
            {currencyBRL(mentor.hourlyRate)}
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">/h</span>
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
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full shrink-0 bg-stone-100 dark:bg-stone-800">
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
          <Badge className="rounded-full bg-emerald-50 text-[11px] text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            {course.category}
          </Badge>
          <Badge className="rounded-full bg-stone-100 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-bold leading-snug text-stone-900 dark:text-stone-50">
          {course.title}
        </p>
        <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">por {course.mentor.name}</p>

        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
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

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
          <p
            className={cn(
              'text-sm font-extrabold',
              course.price === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-900 dark:text-stone-50'
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
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700"
      onClick={() => navigate({ name: 'track', trackId: track.id })}
    >
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full shrink-0 bg-stone-100 dark:bg-stone-800">
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
          <Badge className="rounded-full bg-stone-100 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {track.category}
          </Badge>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-bold leading-snug text-stone-900 dark:text-stone-50">
          {track.title}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
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
          <span className="truncate text-xs font-medium text-stone-600 dark:text-stone-300">
            por {firstName(track.mentor.name)}
          </span>
          <Stars rating={track.mentor.rating} size={11} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
          <p
            className={cn(
              'text-sm font-extrabold',
              track.price === 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-900 dark:text-stone-50'
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

// ---------- Card de item da Biblioteca para "Biblioteca em destaque" ----------
function FeaturedLibraryCard({ item }: { item: LibraryItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)
  const isBook = item.kind === 'BOOK'

  return (
    <article
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700"
      onClick={() => navigate({ name: 'reader', itemId: item.id })}
    >
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full shrink-0 bg-stone-100 dark:bg-stone-800">
        {item.coverUrl ? (
          <img
            src={item.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div aria-hidden className="absolute inset-0" style={avatarGradient(item.title)}>
            {isBook ? (
              <BookOpen className="pointer-events-none absolute -bottom-2 right-2 h-16 w-16 text-white/20" />
            ) : (
              <Library className="pointer-events-none absolute -bottom-2 right-2 h-16 w-16 text-white/20" />
            )}
          </div>
        )}
        <Badge className="absolute right-2 top-2 rounded-full border-white/40 bg-stone-950/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm dark:border-white/20">
          {isBook ? 'Livro' : 'Artigo'}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge className="rounded-full bg-emerald-50 text-[11px] text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            {item.category}
          </Badge>
          {item.hasPdf && (
            <Badge className="rounded-full bg-stone-100 text-[11px] text-stone-600 dark:bg-stone-800 dark:text-stone-300">
              PDF
            </Badge>
          )}
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-bold leading-snug text-stone-900 dark:text-stone-50">
          {item.title}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {item.readingMin} min de leitura
          </span>
          {item.hasPdf && (
            <span className="inline-flex items-center gap-1">
              <BookOpen aria-hidden className="h-3.5 w-3.5" />
              PDF
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
          <div className="flex min-w-0 items-center gap-1.5">
            <Avatar
              name={item.author.name}
              src={item.author.avatarUrl}
              size="sm"
              className="h-6 w-6 text-[9px] ring-0"
            />
            <span className="truncate text-xs font-medium text-stone-600 dark:text-stone-300">
              {item.author.name}
            </span>
          </div>
          <Button
            size="sm"
            className="h-11 shrink-0 rounded-full px-5 font-semibold"
            onClick={(e) => {
              e.stopPropagation()
              navigate({ name: 'reader', itemId: item.id })
            }}
            aria-label={`Ler ${item.title}`}
          >
            Ler agora
          </Button>
        </div>
      </div>
    </article>
  )
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
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback (padrão FeaturedCourseCard) */}
      <div className="relative h-16 w-full shrink-0 bg-stone-100 dark:bg-stone-800">
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
          <h3 className="min-h-10 line-clamp-2 min-w-0 text-sm font-bold leading-snug text-stone-900 dark:text-stone-50">
            {course.title}
          </h3>
          {isDone && (
            <Badge className="rounded-full border-emerald-200 bg-emerald-100 text-[11px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle2 aria-hidden /> Concluído
            </Badge>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">por {course.mentor.name}</p>

        <div className="mt-3">
          <Progress value={pct} className="h-1.5" aria-label={`${pct}% do curso concluído`} />
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-stone-500 dark:text-stone-400">
              {completed} de {course.lessonCount} aulas concluídas
            </span>
            <span className="font-semibold text-stone-400 dark:text-stone-500">{pct}%</span>
          </div>
        </div>

        <div className="mt-auto pt-3.5">
          <Button
            size="sm"
            className="h-11 w-full rounded-full font-bold"
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
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-stone-900/5 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-16 w-full shrink-0 bg-stone-100 dark:bg-stone-800">
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
        <Badge className="absolute right-2 top-2 rounded-full border-white/40 bg-stone-950/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm dark:border-white/20">
          {course.category}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="min-h-10 line-clamp-2 text-sm font-bold leading-snug text-stone-900 dark:text-stone-50">
          {course.title}
        </h3>
        <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
          por {course.mentor.name}
        </p>

        {/* Motivo da recomendação (IA) */}
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-emerald-50/80 px-2.5 py-2 text-xs leading-snug text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Sparkles aria-hidden className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-2">{rec.reason}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
          <span
            className={cn(
              'text-sm font-extrabold',
              isFree
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-stone-900 dark:text-stone-50'
            )}
          >
            {isFree ? 'Gratuito' : currencyBRL(course.price)}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-10 rounded-full border-emerald-200 px-4 text-xs font-bold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
            onClick={() => navigate({ name: 'course', courseId: course.id })}
            aria-label={`Ver curso ${course.title}`}
          >
            Ver curso
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
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
        <div className="mx-auto max-w-6xl px-4">
          <div
            aria-hidden
            className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900"
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
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 dark:border-stone-800 dark:bg-stone-900">
          {/* Cabeçalho: ícone + título + subtítulo + badge de meta batida */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <Target className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-extrabold text-stone-900 dark:text-stone-50">Meta semanal</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {completed} de {target} {target === 1 ? 'aula' : 'aulas'} nesta semana
                </p>
              </div>
            </div>
            {goal.goalAchieved && (
              <Badge className="rounded-full border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
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
              <span className="shrink-0 text-stone-400 dark:text-stone-500">{pct}% da meta</span>
              {goal.goalAchieved && (
                <span className="text-right font-semibold text-emerald-700 dark:text-emerald-300">
                  Parabéns! Foram {completed}{' '}
                  {completed === 1 ? 'aula concluída' : 'aulas concluídas'} nesta semana. 🎉
                </span>
              )}
            </div>
          </div>

          {/* Editor: chips 2 · 3 · 5 · 7 (toque ≥44px, ativo emerald sólido) */}
          <div className="mt-5 border-t border-stone-100 pt-4 dark:border-stone-800">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-stone-400 dark:text-stone-500">
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
                      'flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40',
                      isActive
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm shadow-emerald-700/25 dark:border-emerald-500 dark:bg-emerald-600'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300',
                      saving && 'cursor-wait opacity-70'
                    )}
                  >
                    {chipTarget}
                  </button>
                )
              })}
              <span className="ml-1 text-xs text-stone-400 dark:text-stone-500">
                Cada aula concluída conta para a sua ofensiva e para o XP.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
