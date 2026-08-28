'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Clock,
  Library,
  PlayCircle,
  Quote,
  Route,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  LEVEL_LABELS,
  avatarGradient,
  currencyBRL,
  firstName,
  formatTotalDuration,
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
  },
  {
    number: '02',
    title: 'Agende',
    text: 'Escolha um horário livre na agenda do mentor, descreva seu objetivo e envie sua solicitação.',
  },
  {
    number: '03',
    title: 'Conecte-se',
    text: 'A reunião acontece aqui mesmo, com vídeo integrado. Depois, avalie a sessão e acompanhe sua evolução.',
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

  // Cursos para a seção "Cursos em destaque" (efeito separado)
  useEffect(() => {
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
  }, [])

  // Trilhas populares para a seção "Trilhas em destaque" (efeito separado)
  useEffect(() => {
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
  }, [])

  // "Continuar de onde parou": inscrições do usuário logado (seção oculta para convidados)
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
    }),
    [mentors]
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

  // Até 3 inscrições para "Continuar de onde parou"
  const continueItems = useMemo(() => enrollments.slice(0, 3), [enrollments])

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

  return (
    <div className="flex flex-col bg-white">
      {/* ---------- HERO ---------- */}
      <motion.section
        aria-labelledby="hero-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-50 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1 text-xs font-semibold text-stone-600">
              <Sparkles aria-hidden className="h-3.5 w-3.5 text-emerald-700" />
              Mentorias 1:1 ao vivo, direto na plataforma
            </span>
            <h1
              id="hero-title"
              className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl"
            >
              {user ? (
                <>
                  Olá, <span className="text-emerald-700">{firstName(user.name)}</span>! Pronto para
                  continuar aprendendo?
                </>
              ) : (
                <>
                  Aprenda com quem <span className="text-emerald-700">vive o que ensina</span>
                </>
              )}
            </h1>
            <p className="mt-5 text-lg text-stone-600">
              Encontre especialistas que viveram o caminho que você quer trilhar. Agende em minutos
              e encontre-se por vídeo dentro da própria plataforma.
            </p>

            <form
              role="search"
              onSubmit={handleSearch}
              className="mx-auto mt-8 flex max-w-xl flex-col gap-2.5 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  aria-hidden
                  className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
                />
                <Input
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Qual habilidade você quer dominar?"
                  aria-label="Buscar mentores por área ou especialidade"
                  className="h-13 rounded-2xl border-stone-200 bg-white pl-11 text-stone-900 placeholder:text-stone-400 focus-visible:border-emerald-300 focus-visible:ring-emerald-100"
                />
              </div>
              <Button type="submit" className="h-13 rounded-full px-7 font-bold">
                Explorar mentores
              </Button>
            </form>

            <div className="mt-7 flex items-center justify-center gap-3" aria-live="polite">
              {loading ? (
                <>
                  <div className="flex -space-x-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-full ring-2 ring-white" />
                    ))}
                  </div>
                  <p className="text-sm text-stone-400">Carregando mentores…</p>
                </>
              ) : mentors.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {mentors.slice(0, 5).map((m, i) => (
                      <Avatar key={m.id} name={m.name} src={m.avatarUrl} size={i === 0 ? 'md' : 'sm'} />
                    ))}
                  </div>
                  <p className="text-sm text-stone-500">
                    +{mentors.length} mentores especialistas
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ---------- CONTINUAR DE ONDE PAROU (apenas logado com inscrições) ---------- */}
      {user && (enrollmentsLoading || continueItems.length > 0) && (
        <section
          aria-labelledby="continue-title"
          className="border-b border-stone-200/70 bg-stone-50/50 py-10"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"
              >
                <PlayCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2
                  id="continue-title"
                  className="text-lg font-extrabold tracking-tight text-stone-900 sm:text-xl"
                >
                  Continuar de onde parou
                </h2>
                <p className="text-sm text-stone-500">
                  Retome seus cursos exatamente onde parou.
                </p>
              </div>
            </div>

            {enrollmentsLoading ? (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {continueItems.map((enrollment) => {
                  const total = enrollment.course.lessonCount
                  const percent =
                    total > 0
                      ? Math.round((enrollment.completedLessonIds.length / total) * 100)
                      : 0
                  return (
                    <Card
                      key={enrollment.courseId}
                      className="flex gap-3 rounded-2xl border-stone-200/70 p-4 shadow-sm"
                    >
                      {enrollment.course.coverUrl ? (
                        <img
                          src={enrollment.course.coverUrl}
                          alt={`Capa do curso ${enrollment.course.title}`}
                          className="h-20 w-28 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          aria-hidden
                          className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl"
                          style={avatarGradient(enrollment.course.title)}
                        >
                          <BookOpen className="h-6 w-6 text-white/85" />
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-stone-900">
                          {enrollment.course.title}
                        </h3>
                        <div className="mt-auto pt-2">
                          <Progress
                            value={percent}
                            className="h-1.5"
                            aria-label={`${percent}% do curso concluído`}
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-xs text-stone-500">{percent}% concluído</span>
                            <Button
                              size="sm"
                              className="h-9 rounded-full px-4 text-xs font-bold"
                              onClick={() =>
                                navigate({ name: 'classroom', courseId: enrollment.courseId })
                              }
                              aria-label={`Continuar o curso ${enrollment.course.title}`}
                            >
                              Continuar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- STATS ---------- */}
      <section aria-label="Números da plataforma" className="border-y border-stone-200 bg-stone-50/50 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-stone-200">
            <div className="sm:px-8">
              <p className="text-3xl font-extrabold text-stone-900 sm:text-4xl">+{mentors.length}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                mentores especialistas
              </p>
            </div>
            <div className="sm:px-8">
              <p className="text-3xl font-extrabold text-stone-900 sm:text-4xl">+{stats.sessions}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                sessões realizadas
              </p>
            </div>
            <div className="sm:px-8">
              <p className="text-3xl font-extrabold text-stone-900 sm:text-4xl">+{stats.reviews}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-stone-500">
                avaliações reais
              </p>
            </div>
          </div>
        </div>
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
        <h2
          id="como-funciona-title"
          className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl"
        >
          Como funciona
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Três passos simples até a sua primeira sessão.
        </p>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="border-t-2 border-emerald-700 pt-6">
              <p className="text-xs font-bold text-emerald-700">{step.number}</p>
              <h3 className="mt-2 font-bold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.text}</p>
            </div>
          ))}
        </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="destaque-title"
            className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl"
          >
            Mentores em destaque
          </h2>
          <Button
            variant="link"
            onClick={() => navigate({ name: 'marketplace' })}
            className="gap-1 px-0 font-semibold text-emerald-700"
          >
            Ver todos
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="flex flex-col gap-4 rounded-2xl border border-stone-200 p-6"
                >
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="mt-auto h-8 w-full rounded-full" />
                </div>
              ))
            : featured.map((m) => <FeaturedMentorCard key={m.id} mentor={m} />)}

          {!loading && featured.length === 0 && (
            <p className="rounded-2xl border border-dashed border-stone-200 p-10 text-center text-sm text-stone-500 sm:col-span-3">
              Nenhum mentor avaliado por aqui ainda — explore a lista completa.
            </p>
          )}
        </div>
      </motion.section>

      {/* ---------- CURSOS EM DESTAQUE ---------- */}
      {(coursesLoading || topCourses.length > 0) && (
        <motion.section
          aria-labelledby="cursos-destaque-title"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="cursos-destaque-title"
                className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl"
              >
                Cursos em destaque
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Aprenda no seu ritmo com aulas gravadas e materiais dos nossos mentores.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerCursos}
              className="gap-1 px-0 font-semibold text-emerald-700"
            >
              Ver todos os cursos
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {coursesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-stone-200"
                  >
                    <Skeleton className="h-24 w-full rounded-none" />
                    <div className="space-y-2.5 p-5">
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="mt-3 h-8 w-full rounded-full" />
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
          aria-labelledby="trilhas-destaque-title"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-6xl px-4 pb-14 sm:pb-20"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="trilhas-destaque-title"
                className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl"
              >
                Trilhas em destaque
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Jornadas guiadas que combinam cursos e mentorias 1:1 dos nossos mentores.
              </p>
            </div>
            <Button
              variant="link"
              onClick={handleVerTrilhas}
              className="gap-1 px-0 font-semibold text-emerald-700"
            >
              Ver todas as trilhas
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tracksLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-2xl border border-stone-200"
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
                      <Skeleton className="mt-3 h-9 w-full rounded-full" />
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
        className="border-y border-stone-200 bg-stone-50/50"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <h2
            id="depoimentos-title"
            className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl"
          >
            Depoimentos de mentorados
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            Histórias reais de quem já deu o próximo passo.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.author}
                className="flex flex-col rounded-2xl border border-stone-100 bg-stone-50 p-6"
              >
                <Quote aria-hidden className="h-6 w-6 fill-emerald-700 text-emerald-700" />
                <blockquote className="mt-3 text-sm leading-relaxed text-stone-700">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-4 text-xs font-semibold text-stone-500">
                  {t.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ---------- CTA FINAL ---------- */}
      <motion.section
        aria-labelledby="cta-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20"
      >
        <div className="relative overflow-hidden rounded-3xl bg-emerald-950 px-6 py-14 text-center text-white sm:py-16">
          <div
            aria-hidden
            className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-emerald-600/30 blur-3xl"
          />
          <div className="relative">
            <h2
              id="cta-title"
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Pronto para dar o próximo passo?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-emerald-100/90">
              Explore especialistas, agende em minutos e encontre-se por vídeo aqui mesmo. Sua
              primeira mentoria pode ser hoje.
            </p>
            <Button
              onClick={() => navigate({ name: 'marketplace' })}
              className="mt-8 h-12 rounded-full bg-white px-8 font-bold text-emerald-950 hover:bg-emerald-50"
            >
              Explorar mentores agora
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  )
}

function FeaturedMentorCard({ mentor }: { mentor: MentorListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 p-6 transition hover:border-emerald-300 hover:shadow-md">
      <div className="flex items-center gap-3.5">
        <Avatar name={mentor.name} src={mentor.avatarUrl} size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-bold text-stone-900">
            {mentor.name}
            {mentor.rating >= 4.5 && mentor.reviewCount >= 3 && (
              <BadgeCheck
                aria-label="Mentor bem avaliado"
                className="h-4 w-4 shrink-0 text-emerald-600"
              />
            )}
          </p>
          <p className="text-xs text-stone-500">
            {firstName(mentor.name)} · {mentor.experienceYears} anos de experiência
          </p>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">{mentor.headline}</p>

      <div className="flex items-center gap-1.5">
        <Stars rating={mentor.rating} size={13} />
        <span className="text-xs font-semibold text-stone-700">{mentor.rating.toFixed(1)}</span>
        <span className="text-xs text-stone-500">({mentor.reviewCount})</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {mentor.categories.slice(0, 2).map((c) => (
          <Badge key={c} className="bg-emerald-50 text-emerald-800">
            {c}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-2">
        <p className="font-extrabold text-stone-900">
          {currencyBRL(mentor.hourlyRate)}
          <span className="text-xs font-medium text-stone-500">/h</span>
        </p>
        <Button
          size="sm"
          className="rounded-full"
          onClick={() => navigate({ name: 'mentor', mentorId: mentor.id })}
          aria-label={`Ver perfil de ${mentor.name}`}
        >
          Ver perfil
        </Button>
      </div>
    </div>
  )
}

function FeaturedCourseCard({ course }: { course: CourseListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-emerald-300 hover:shadow-md">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-24 w-full bg-stone-100">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
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

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge className="rounded-full bg-emerald-50 text-[11px] text-emerald-800">
            {course.category}
          </Badge>
          <Badge className="rounded-full bg-stone-100 text-[11px] text-stone-600">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-bold leading-snug text-stone-900">
          {course.title}
        </p>
        <p className="mt-1 truncate text-xs text-stone-500">por {course.mentor.name}</p>

        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {formatTotalDuration(course.totalDurationMin)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
          <p
            className={cn(
              'text-sm font-extrabold',
              course.price === 0 ? 'text-emerald-700' : 'text-stone-900'
            )}
          >
            {course.price === 0 ? 'Grátis' : currencyBRL(course.price)}
          </p>
          <Button
            size="sm"
            className="h-9 rounded-full px-4 font-semibold"
            onClick={() => navigate({ name: 'course', courseId: course.id })}
            aria-label={`Ver curso ${course.title}`}
          >
            Ver curso
          </Button>
        </div>
      </div>
    </div>
  )
}

function FeaturedTrackCard({ track }: { track: TrackListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article
      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-emerald-300 hover:shadow-md"
      onClick={() => navigate({ name: 'track', trackId: track.id })}
    >
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full bg-stone-100">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
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
          <Badge className="rounded-full border border-teal-200 bg-teal-50 text-[11px] text-teal-700">
            Trilha
          </Badge>
          <Badge className="rounded-full bg-stone-100 text-[11px] text-stone-600">
            {track.category}
          </Badge>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 font-bold leading-snug text-stone-900">
          {track.title}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
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
          <span className="truncate text-xs font-medium text-stone-600">
            por {firstName(track.mentor.name)}
          </span>
          <Stars rating={track.mentor.rating} size={11} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
          <p
            className={cn(
              'text-sm font-extrabold',
              track.price === 0 ? 'text-emerald-700' : 'text-stone-900'
            )}
          >
            {track.price === 0 ? 'Grátis' : currencyBRL(track.price)}
          </p>
          <Button
            size="sm"
            className="h-9 rounded-full px-4 font-semibold"
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
