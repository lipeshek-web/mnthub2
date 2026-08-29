'use client'

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  Hand,
  Library,
  Mic,
  MonitorPlay,
  PhoneOff,
  PlayCircle,
  Presentation,
  Quote,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
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
import { Input } from '@/components/ui/input'
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
  MentorListItemDTO,
  TrackListItemDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    number: '01',
    title: 'Descubra',
    text: 'Explore especialistas por área, leia seus murais de conteúdo e veja avaliações reais de outros mentorados.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Agende',
    text: 'Escolha um horário livre na agenda do mentor, descreva seu objetivo e envie sua solicitação.',
    icon: CalendarClock,
  },
  {
    number: '03',
    title: 'Conecte-se',
    text: 'A reunião acontece aqui mesmo, com vídeo integrado. Depois, avalie a sessão e acompanhe sua evolução.',
    icon: Video,
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

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Sala de aula imersiva',
    text: 'Aulas em vídeo e leituras em tela cheia, com perguntas para o mentor e anotações salvas automaticamente.',
  },
  {
    icon: Library,
    title: 'Biblioteca de conhecimento',
    text: 'Artigos e livros dos mentores com leitor de PDF integrado e favoritos para ler depois.',
  },
  {
    icon: Route,
    title: 'Trilhas guiadas',
    text: 'Cursos e mentorias 1:1 combinados em jornadas com progresso acompanhado automaticamente.',
  },
  {
    icon: CalendarCheck,
    title: 'Agendamento simples',
    text: 'Você vê os horários livres da agenda do mentor e confirma sua sessão em poucos minutos.',
  },
  {
    icon: Star,
    title: 'Avaliações reais',
    text: 'Só quem participou da sessão avalia: notas e comentários que você pode confiar de verdade.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagamento seguro',
    text: 'PIX e cartão processados pela plataforma, com recibo, histórico e garantia de 7 dias.',
  },
]

const FAQS = [
  {
    q: 'Como funciona uma mentoria 1:1 na prática?',
    a: 'Você escolhe um mentor, descreve seu objetivo no momento do agendamento e se reúne com ele por vídeo aqui mesmo, dentro da plataforma. Cada sessão dura, em média, 60 minutos e fica registrada no seu histórico para consulta futura.',
  },
  {
    q: 'Preciso instalar algo para a reunião por vídeo?',
    a: 'Não. A sala de reunião abre direto no navegador, com áudio e vídeo integrados. Basta entrar na tela da sua sessão na hora marcada, com um fone e uma conexão razoável.',
  },
  {
    q: 'Como funcionam os pagamentos?',
    a: 'Você paga apenas pelo que contratar: sessões avulsas, cursos ou trilhas. Aceitamos PIX e cartão, com processamento seguro pela plataforma, recibo automático e garantia de 7 dias.',
  },
  {
    q: 'Recebo certificado ou comprovação de progresso?',
    a: 'Seu progresso fica registrado aula a aula em cada curso e trilha, com porcentagem concluída visível no seu painel. As sessões de mentoria também entram no histórico, junto das avaliações que você fez e recebeu.',
  },
  {
    q: 'Como me tornar um mentor na MentorHub?',
    a: 'Clique em "Quero ensinar" no fim desta página, complete seu perfil com áreas de atuação, agenda e valores e publique conteúdos no seu mural. Desde a primeira sessão você já recebe avaliações dos mentorados.',
  },
]

const FINAL_REASSURANCES = [
  'Pagamento seguro via PIX ou cartão',
  'Reuniões de vídeo dentro da plataforma',
  'Avaliações apenas de sessões reais',
]

export function LandingMenteeView() {
  const navigate = useAppStore((s) => s.navigate)
  const setExploreQuery = useAppStore((s) => s.setExploreQuery)
  const setExploreTab = useAppStore((s) => s.setExploreTab)
  const user = useAppStore((s) => s.user)
  const [mentors, setMentors] = useState<MentorListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [tracks, setTracks] = useState<TrackListItemDTO[]>([])
  const [tracksLoading, setTracksLoading] = useState(true)
  const [term, setTerm] = useState('')

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

  // Cursos para a seção "Cursos em destaque" (disparado quando a seção se aproxima)
  useEffect(() => {
    if (!coursesInView) return
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
  }, [coursesInView])

  // Trilhas populares para a seção "Trilhas em destaque" (disparado quando a seção se aproxima)
  useEffect(() => {
    if (!tracksInView) return
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
  }, [tracksInView])

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

  const stats = useMemo(
    () => ({
      sessions: mentors.reduce((acc, m) => acc + m.totalSessions, 0),
      reviews: mentors.reduce((acc, m) => acc + m.reviewCount, 0),
      contents: mentors.reduce((acc, m) => acc + m.contentsCount, 0),
    }),
    [mentors]
  )

  const avgRating = useMemo(() => {
    const rated = mentors.filter((m) => m.rating > 0)
    if (rated.length === 0) return null
    return rated.reduce((acc, m) => acc + m.rating, 0) / rated.length
  }, [mentors])

  // Soma de alunos matriculados em cursos (chega junto com o fetch preguiçoso de cursos)
  const totalStudents = useMemo(
    () => courses.reduce((acc, c) => acc + c.studentCount, 0),
    [courses]
  )

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

  // Tiles do mock de vídeo: mentores reais + placeholders para fechar 4
  const previewMentors = mentors.slice(0, 4)
  const previewFillers = Array.from({ length: Math.max(0, 4 - previewMentors.length) })

  // 4º número da faixa de stats: alunos (quando cursos já carregaram) ou conteúdos publicados
  const fourthStat =
    !coursesLoading && totalStudents > 0
      ? { value: `+${totalStudents}`, label: 'alunos aprendendo' }
      : { value: `+${stats.contents}`, label: 'conteúdos publicados' }

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setExploreQuery(term.trim())
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

  const handleExploreArea = () => {
    setExploreTab('all')
    navigate({ name: 'marketplace' })
  }

  return (
    <div className="flex flex-col bg-white dark:bg-stone-950">
      {/* ---------- HERO (split com preview do produto) ---------- */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        {/* Decoração de fundo: blobs suaves + padrão de pontos */}
        <div
          aria-hidden
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-100/80 blur-3xl dark:bg-emerald-950/50"
        />
        <div
          aria-hidden
          className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-emerald-50 blur-3xl dark:bg-emerald-950/50"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 [mask-image:radial-gradient(75%_60%_at_50%_0%,black,transparent)]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(5, 150, 105, 0.12) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
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
                Mentorias 1:1 ao vivo, direto na plataforma
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
                Encontre especialistas que viveram o caminho que você quer trilhar. Agende em
                minutos e encontre-se por vídeo dentro da própria plataforma.
              </p>

              <form
                role="search"
                onSubmit={handleSearch}
                className="mt-8 flex max-w-xl flex-col gap-2.5 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search
                    aria-hidden
                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                  />
                  <Input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Qual habilidade você quer dominar?"
                    aria-label="Buscar mentores por área ou especialidade"
                    className="h-13 rounded-full border-stone-200 bg-white pl-11 pr-4 text-stone-900 shadow-sm placeholder:text-stone-400 focus-visible:border-emerald-300 focus-visible:ring-emerald-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus-visible:border-emerald-700 dark:focus-visible:ring-emerald-900/40"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-13 shrink-0 rounded-full px-7 font-bold shadow-sm shadow-emerald-700/20"
                >
                  Explorar mentores
                </Button>
              </form>

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
                      +{mentors.length} mentores especialistas · {stats.reviews} avaliações reais
                    </p>
                  </div>
                </div>
              ) : null}

              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {['Reunião por vídeo integrada', 'Biblioteca com artigos e livros', 'Agendamento em minutos'].map(
                  (item) => (
                    <li key={item} className="inline-flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-300">
                      <Check aria-hidden className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </motion.div>

            {/* Coluna direita: composição de produto (decorativa) */}
            <motion.div
              aria-hidden
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative mt-2 min-w-0 lg:mt-0"
            >
              {/* Glow esmeralda atrás da composição */}
              <div className="absolute -inset-x-6 -top-6 bottom-8 rounded-[3rem] bg-gradient-to-br from-emerald-200/70 via-emerald-100/40 to-transparent blur-2xl dark:from-emerald-950/60 dark:via-emerald-950/30" />

              {/* Tile principal: chamada de vídeo */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="overflow-hidden rounded-3xl bg-stone-950 shadow-2xl shadow-stone-900/25 ring-1 ring-stone-900/10 dark:ring-white/10">
                  <div className="flex items-center justify-between px-5 pb-3 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                      </span>
                      <span className="text-xs font-semibold text-white/85">Sessão ao vivo</span>
                      <span className="text-xs text-white/40">· 24:31</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80">
                        <Mic className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80">
                        <Video className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 px-3">
                    {previewMentors.map((m, i) => (
                      <div
                        key={m.id}
                        className={cn(
                          'relative aspect-[4/3] overflow-hidden rounded-xl',
                          i === 0 && 'ring-2 ring-emerald-400/80'
                        )}
                      >
                        <div className="absolute inset-0" style={avatarGradient(m.name)} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Avatar name={m.name} src={m.avatarUrl} size="lg" className="h-12 w-12 shadow-lg" />
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                          {firstName(m.name)}
                        </span>
                        <span className="absolute bottom-2 right-2 text-white/70">
                          <Mic className="h-3 w-3" />
                        </span>
                      </div>
                    ))}
                    {previewFillers.map((_, i) => (
                      <div
                        key={`preview-placeholder-${i}`}
                        className={cn(
                          'relative aspect-[4/3] overflow-hidden rounded-xl bg-white/[0.06]',
                          loading && 'animate-pulse'
                        )}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <GraduationCap className="h-7 w-7 text-white/25" />
                        </div>
                        <span className="absolute bottom-2 left-2 h-3 w-14 rounded-full bg-white/15" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2.5 border-t border-white/10 px-5 py-3.5">
                    {[Mic, Video, Hand].map((Icon, i) => (
                      <span
                        key={i}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    ))}
                    <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                      <PhoneOff className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Card flutuante: progresso de curso */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute -bottom-8 -left-2 hidden w-52 lg:block xl:-left-10 xl:w-56"
              >
                <div className="rounded-2xl border border-stone-200/80 bg-white/95 p-3.5 shadow-xl shadow-stone-900/10 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={avatarGradient('Fundamentos de Gestão de Produto')}
                    >
                      <PlayCircle className="h-5 w-5 text-white/90" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-stone-900 dark:text-stone-50">
                        Fundamentos de Gestão de Produto
                      </p>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Aula 4 de 7 · 12min</p>
                    </div>
                  </div>
                  <Progress value={57} className="mt-3 h-1.5" />
                  <p className="mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">57% concluído</p>
                </div>
              </motion.div>

              {/* Card flutuante: avaliação */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
                className="absolute -right-2 -top-6 hidden w-44 lg:block xl:-right-8 xl:w-48"
              >
                <div className="rounded-2xl border border-stone-200/80 bg-white/95 p-3.5 shadow-xl shadow-stone-900/10 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
                  <Stars rating={5} size={13} />
                  <p className="mt-1.5 text-[11px] leading-snug text-stone-600 dark:text-stone-300">
                    A melhor mentoria que já fiz. Recomendo demais!
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-extrabold text-white"
                      style={avatarGradient('Ana Paula')}
                    >
                      {initials('Ana Paula')}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">
                      Ana Paula · mentorada
                    </span>
                  </div>
                </div>
              </motion.div>
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

      {/* ---------- STATS (faixa dark emerald-950) ---------- */}
      <section aria-label="Números da plataforma" className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-12">
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
                sessões realizadas
              </dt>
              {loading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  +{stats.sessions}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200/75 sm:text-xs">
                avaliações reais
              </dt>
              {loading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  +{stats.reviews}
                </dd>
              )}
            </div>
            <div className="flex flex-col">
              <dt className="order-2 mt-1.5 text-[11px] font-medium uppercase tracking-wider text-emerald-200/75 sm:text-xs">
                {fourthStat.label}
              </dt>
              {loading ? (
                <dd className="order-1">
                  <Skeleton className="h-9 w-20 rounded-lg bg-emerald-100/20" />
                </dd>
              ) : (
                <dd className="order-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {fourthStat.value}
                </dd>
              )}
            </div>
          </dl>
        </motion.div>
      </section>

      {/* ---------- COMO FUNCIONA ---------- */}
      <motion.section
        aria-labelledby="como-funciona-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Como funciona
          </p>
          <h2
            id="como-funciona-title"
            className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
          >
            Três passos até a sua primeira sessão
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
              <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-extrabold tracking-wide text-white shadow-lg shadow-emerald-700/25 ring-4 ring-emerald-100 dark:ring-emerald-900/40">
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

      {/* ---------- FEATURES GRID ---------- */}
      <motion.section
        aria-labelledby="features-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            Plataforma completa
          </p>
          <h2
            id="features-title"
            className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
          >
            Tudo em uma única plataforma
          </h2>
          <p className="mt-2 text-sm text-stone-500 sm:text-base dark:text-stone-400">
            Da descoberta ao certificado — sem sair daqui.
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.li
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
              className="min-w-0"
            >
              <div className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:group-hover:bg-emerald-900/30">
                  <feature.icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-stone-900 dark:text-stone-50">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{feature.text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.section>

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
                Explore mentores, cursos e trilhas e faça a sua primeira sessão acontecer ainda
                esta semana.
              </p>
              <Button
                onClick={() => navigate({ name: 'marketplace' })}
                className="mt-7 h-12 rounded-full bg-white px-7 font-bold text-emerald-950 hover:bg-emerald-50"
              >
                Explorar mentores agora
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
                Publique seus conteúdos, abra a sua agenda e receba mentorados — a plataforma
                cuida do vídeo, dos pagamentos e das avaliações.
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
