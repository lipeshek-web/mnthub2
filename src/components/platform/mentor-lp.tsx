'use client'

// LP pública de conversão do mentor — usada para tráfego pago
// (/ ?mentor=slug &utm_source=...). Foco: prova social → cursos → CTA de mentoria,
// com funil de rastreamento completo (page_view → view_item → begin_checkout → lead).

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  BookOpen,
  CalendarCheck2,
  Clock,
  Clock3,
  Compass,
  Github,
  Globe,
  Instagram,
  Library,
  Linkedin,
  Loader2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import {
  bodyFontStyle,
  headingFontStyle,
} from '@/lib/fonts'
import {
  CONTENT_TYPE_META,
  LEVEL_LABELS,
  MONTHS_PT,
  type SocialKind,
  avatarGradient,
  currencyBRL,
  firstName,
  formatTotalDuration,
  parseNaive,
  socialDisplay,
  socialUrl,
} from '@/lib/helpers'
import { loadTrackingScripts, setAttributionLandingPage, trackEvent } from '@/lib/tracking'
import { useAppStore } from '@/lib/store'
import type { CourseListItemDTO, MentorLpDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const SOCIAL_META: Record<SocialKind, { label: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', Icon: Instagram },
  linkedin: { label: 'LinkedIn', Icon: Linkedin },
  github: { label: 'GitHub', Icon: Github },
  website: { label: 'Site pessoal', Icon: Globe },
}

/** "2025-06-01T..." -> "1 jun 2025" (data curta pt-BR para depoimentos) */
function formatShortDate(iso: string): string {
  const d = parseNaive(iso)
  return `${d.getDate()} ${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`
}

/** Botão circular simples de rede social (apenas ícone redirecionável) */
function SocialButton({
  kind,
  value,
  mentorName,
}: {
  kind: SocialKind
  value: string
  mentorName: string
}) {
  const { label, Icon } = SOCIAL_META[kind]
  const display = socialDisplay(kind, value)
  return (
    <a
      href={socialUrl(kind, value)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} de ${mentorName}: ${display} (abre em nova aba)`}
      title={display}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300"
    >
      <Icon aria-hidden className="h-[18px] w-[18px]" />
    </a>
  )
}

/** Número da barra de prova social */
function LpStat({
  value,
  label,
  headingStyle,
}: {
  value: string
  label: string
  headingStyle?: React.CSSProperties
}) {
  return (
    <div className="text-center">
      <p className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={headingStyle}>
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-amber-200/80">
        {label}
      </p>
    </div>
  )
}

/** Card de curso da LP (capa, badges, stats, preço + CTA) */
function LpCourseCard({
  course,
  enrolling,
  onOpen,
  headingStyle,
  bodyStyle,
}: {
  course: CourseListItemDTO
  enrolling: boolean
  onOpen: (course: CourseListItemDTO) => void
  headingStyle?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}) {
  return (
    <article
      onClick={() => onOpen(course)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-md focus-within:border-amber-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-700 dark:focus-within:border-amber-700"
    >
      {course.coverUrl ? (
        <img
          src={course.coverUrl}
          alt={`Capa do curso ${course.title}`}
          className="h-36 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-36 w-full items-center justify-center"
          style={avatarGradient(course.title)}
        >
          <Library className="h-10 w-10 text-white/20" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/50">
            {course.category}
          </Badge>
          <Badge variant="outline" className="rounded-full border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300">
            {LEVEL_LABELS[course.level] ?? course.level}
          </Badge>
        </div>

        <h3 className="mt-2.5 font-bold leading-snug text-stone-900 dark:text-stone-50" style={headingStyle}>
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400" style={bodyStyle}>
          {course.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
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
            {course.studentCount} {course.studentCount === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
          {course.price === 0 ? (
            <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">Grátis</span>
          ) : (
            <span className="text-base font-extrabold text-stone-900 dark:text-stone-50">
              {currencyBRL(course.price)}
            </span>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onOpen(course)
            }}
            disabled={enrolling}
            className="h-11 gap-1.5 rounded-full px-5 font-bold"
          >
            {enrolling && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            {course.price === 0 ? 'Inscrever-se grátis' : 'Comprar agora'}
          </Button>
        </div>
      </div>
    </article>
  )
}

export function MentorLpView({ slug }: { slug: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)

  const [data, setData] = useState<MentorLpDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)

  // Guarda: garante que page_view/view_item sejam enviados uma única vez
  // (inclusive sob React StrictMode, que invoca o effect duas vezes em dev)
  const trackedRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await api.getMentorBySlug(slug)
      setData(d)

      // Rastreamento: marca a landing correta ANTES do primeiro evento,
      // injeta os pixels do mentor e registra o funnel inicial.
      if (!trackedRef.current) {
        trackedRef.current = true
        setAttributionLandingPage('mentor_lp')
        loadTrackingScripts({
          mentorGaId: d.mentor.tracking?.gaMeasurementId,
          mentorPixelId: d.mentor.tracking?.metaPixelId,
        })
        trackEvent('page_view', { mentorId: d.mentor.id })
        const firstCourse = d.courses[0]
        if (firstCourse) {
          trackEvent('view_item', {
            mentorId: d.mentor.id,
            courseId: firstCourse.id,
            contentName: firstCourse.title,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar esta página.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  /** Clique em curso: view_item + (grátis: matrícula | pago: begin_checkout + checkout) */
  const handleCourseClick = async (course: CourseListItemDTO) => {
    if (!data) return
    const mentorId = data.mentor.id

    trackEvent('view_item', { mentorId, courseId: course.id, contentName: course.title })

    if (course.price === 0) {
      if (!user) {
        toast.info('Entre com uma conta para se inscrever.')
        navigate({ name: 'auth', mode: 'login' })
        return
      }
      setEnrollingId(course.id)
      try {
        const res = await api.enrollCourse(course.id, user.id)
        toast.success(
          res.alreadyEnrolled
            ? 'Você já estava inscrito neste curso.'
            : 'Inscrição realizada! Boa jornada 🎉'
        )
        navigate({ name: 'course', courseId: course.id })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao realizar inscrição.')
      } finally {
        setEnrollingId(null)
      }
      return
    }

    trackEvent('begin_checkout', {
      mentorId,
      courseId: course.id,
      value: course.price,
      contentName: course.title,
    })
    navigate({ name: 'checkout', courseId: course.id })
  }

  /** CTA de mentoria: evento de lead + perfil completo (agendamento) */
  const handleSchedule = () => {
    if (!data) return
    trackEvent('lead', { mentorId: data.mentor.id })
    navigate({ name: 'mentor', mentorId: data.mentor.id })
  }

  const scrollToCourses = () => {
    document.getElementById('lp-cursos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* ---------- Skeleton ---------- */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8" aria-busy="true">
        <Skeleton className="h-48 w-full rounded-2xl sm:h-56" />
        <div className="mt-[-2.5rem] flex items-center gap-4 px-2 sm:gap-5">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="mt-8 h-24 w-full rounded-2xl" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <p className="sr-only">Carregando página do mentor…</p>
      </div>
    )
  }

  /* ---------- Erro / não encontrado ---------- */
  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
              <Compass aria-hidden className="h-7 w-7 text-stone-400 dark:text-stone-500" />
            </span>
            <p className="font-bold text-stone-900 dark:text-stone-50">Esta página não está disponível.</p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              {error ?? 'O link pode estar incorreto ou o mentor não foi encontrado.'}
            </p>
            <Button className="mt-1 rounded-full" onClick={() => navigate({ name: 'home' })}>
              Conhecer a plataforma
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { mentor, courses, contents, reviews, studentCount } = data
  const fname = firstName(mentor.name)
  const socialEntries = (
    [
      ['instagram', mentor.socials.instagram],
      ['linkedin', mentor.socials.linkedin],
      ['github', mentor.socials.github],
      ['website', mentor.socials.website],
    ] as [SocialKind, string | null | undefined][]
  ).filter(([, v]) => Boolean(v && v.trim()))

  // Tipografia escolhida pelo criador (null = padrão da plataforma)
  const headingStyle = headingFontStyle(mentor.fontHeading)
  const bodyStyle = bodyFontStyle(mentor.fontBody)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* ============ HERO ============ */}
      <section
        aria-label={`Página oficial de ${mentor.name}`}
        className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="relative">
          {mentor.coverUrl ? (
            <img
              src={mentor.coverUrl}
              alt={`Capa do perfil de ${mentor.name}`}
              className="h-72 w-full object-cover sm:h-80 md:h-96"
            />
          ) : (
            <div
              aria-hidden
              className="h-64 w-full sm:h-72 md:h-80"
              style={avatarGradient(mentor.name)}
            />
          )}
          {mentor.coverUrl && (
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/10 to-transparent"
            />
          )}
        </div>

        <div className="px-5 pb-6 sm:px-8">
          {/* Apenas o avatar invade a capa — o texto fica na área branca, sem colisão */}
          <Avatar
            name={mentor.name}
            src={mentor.avatarUrl}
            size="xl"
            className="-mt-12 h-24 w-24 shadow-lg ring-4 ring-amber-500/70"
          />
          <div className="mt-3">
            <Badge className="gap-1 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/50">
              <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
              Mentor verificado
            </Badge>
            <h1
              className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50"
              style={headingStyle}
            >
              {mentor.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-stone-600 sm:text-[15px] dark:text-stone-300" style={bodyStyle}>
              {mentor.headline}
            </p>
          </div>
        </div>

          {/* Chips de credenciais */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {mentor.rating > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm dark:border-stone-800 dark:bg-stone-900">
                <Stars rating={mentor.rating} size={13} />
                <span className="font-bold text-stone-800 dark:text-stone-200">{mentor.rating.toFixed(1).replace('.', ',')}</span>
                <span className="text-stone-500 dark:text-stone-400">
                  ({mentor.reviewCount} {mentor.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
                Novo na plataforma
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              <CalendarCheck2 aria-hidden className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              {mentor.totalSessions}+ sessões
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              <Clock3 aria-hidden className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              {mentor.experienceYears} anos de experiência
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
              <Globe aria-hidden className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              {mentor.languages}
            </span>
          </div>

          {/* Redes sociais: apenas ícones redirecionáveis */}
          {socialEntries.length > 0 && (
            <div role="group" aria-label={`Redes sociais e portfólio de ${mentor.name}`} className="mt-4 flex flex-wrap items-center gap-2.5">
              {socialEntries.map(([kind, value]) => (
                <SocialButton key={kind} kind={kind} value={value as string} mentorName={mentor.name} />
              ))}
            </div>
          )}
      </section>

      {/* ============ BARRA DE PROVA SOCIAL ============ */}
      <section
        aria-label="Números do mentor"
        className="mt-6 grid grid-cols-2 gap-y-6 rounded-2xl bg-amber-950 px-6 py-7 text-white sm:grid-cols-4 sm:px-8"
      >
        <LpStat value={String(studentCount)} label={studentCount === 1 ? 'aluno matriculado' : 'alunos matriculados'} headingStyle={headingStyle} />
        <LpStat
          value={String(mentor.totalSessions)}
          label={mentor.totalSessions === 1 ? 'sessão concluída' : 'sessões concluídas'}
          headingStyle={headingStyle}
        />
        <LpStat
          value={mentor.rating > 0 ? mentor.rating.toFixed(1).replace('.', ',') : '—'}
          label="nota média"
          headingStyle={headingStyle}
        />
        <LpStat
          value={String(courses.length)}
          label={courses.length === 1 ? 'curso publicado' : 'cursos publicados'}
          headingStyle={headingStyle}
        />
      </section>

      {/* ============ CURSOS ============ */}
      <section id="lp-cursos" aria-labelledby="lp-cursos-title" className="mt-10 scroll-mt-6">
        <h2
          id="lp-cursos-title"
          className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50"
          style={headingStyle}
        >
          Cursos para aprender no seu ritmo
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400" style={bodyStyle}>
          Estude com {fname} quando e onde quiser, com acesso vitalício.
        </p>

        {courses.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center dark:border-stone-700">
            <Library aria-hidden className="mx-auto h-9 w-9 text-stone-300 dark:text-stone-600" />
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
              Ainda não há cursos publicados — agende uma mentoria para aprender com {fname}.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {courses.map((course) => (
              <LpCourseCard
                key={course.id}
                course={course}
                enrolling={enrollingId === course.id}
                onOpen={(c) => void handleCourseClick(c)}
                headingStyle={headingStyle}
                bodyStyle={bodyStyle}
              />
            ))}
          </div>
        )}
      </section>

      {/* ============ SOBRE ============ */}
      <section aria-labelledby="lp-sobre-title" className="mt-10">
        <h2
          id="lp-sobre-title"
          className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50"
          style={headingStyle}
        >
          Sobre {fname}
        </h2>
        <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-stone-600 dark:text-stone-300" style={bodyStyle}>
          {mentor.description}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {mentor.categories.map((c) => (
            <Badge
              key={c}
              className="rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/50"
            >
              {c}
            </Badge>
          ))}
          <Badge variant="outline" className="gap-1 rounded-full border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300">
            <Globe aria-hidden className="h-3.5 w-3.5" /> {mentor.languages}
          </Badge>
        </div>
      </section>

      {/* ============ MURAL (opcional) ============ */}
      {contents.length > 0 && (
        <section aria-labelledby="lp-mural-title" className="mt-10">
          <h2
            id="lp-mural-title"
            className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50"
            style={headingStyle}
          >
            Conteúdos publicados
          </h2>
          <ul className="mt-4 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {contents.map((c) => {
              const meta = CONTENT_TYPE_META[c.type] ?? {
                label: c.type,
                className: 'bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-800',
              }
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <Badge className={cn('shrink-0 rounded-full border', meta.className)}>
                    {meta.label}
                  </Badge>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {c.title}
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                    <Clock aria-hidden className="h-3.5 w-3.5" />
                    {c.durationMin} min
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ============ DEPOIMENTOS ============ */}
      {reviews.length > 0 && (
        <section aria-labelledby="lp-depoimentos-title" className="mt-10">
          <h2
            id="lp-depoimentos-title"
            className="text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50"
            style={headingStyle}
          >
            O que os alunos dizem sobre {fname}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {reviews.map((r) => (
              <figure
                key={r.id}
                className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900"
              >
                <Stars rating={r.rating} size={14} />
                <blockquote
                  className="mt-2.5 line-clamp-4 flex-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300"
                  style={bodyStyle}
                >
                  “{r.comment}”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-stone-100 pt-3.5 dark:border-stone-800">
                  <Avatar name={r.authorName} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200">{r.authorName}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{formatShortDate(r.createdAt)}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ============ CTA FINAL ============ */}
      <section
        aria-labelledby="lp-cta-title"
        className="relative mt-12 overflow-hidden rounded-3xl bg-amber-950 px-6 py-10 text-center text-white sm:px-10 sm:py-12"
      >
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl" />
        <div className="relative">
          <h2
            id="lp-cta-title"
            className="text-2xl font-extrabold tracking-tight sm:text-3xl"
            style={headingStyle}
          >
            Aprenda com {fname} de perto
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-amber-100/85" style={bodyStyle}>
            Agende uma mentoria 1:1 ou continue aprendendo nos cursos, no seu ritmo.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={handleSchedule}
              className="h-12 w-full rounded-full bg-white px-8 font-bold text-amber-950 hover:bg-amber-50 sm:w-auto"
            >
              <CalendarCheck2 aria-hidden className="h-4.5 w-4.5" />
              Agendar uma mentoria
            </Button>
            <Button
              onClick={scrollToCourses}
              variant="outline"
              className="h-12 w-full rounded-full border-white/30 bg-transparent px-8 font-bold text-white hover:bg-white/10 hover:text-white sm:w-auto"
            >
              Ver cursos
            </Button>
          </div>
        </div>
      </section>

      {/* ============ RODAPÉ FINO ============ */}
      <footer className="mt-10 border-t border-stone-100 py-6 text-center text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
        Página oficial de {mentor.name} na plataforma{' '}
        <button
          onClick={() => navigate({ name: 'home' })}
          className="font-bold text-stone-500 underline-offset-2 transition-colors hover:text-amber-700 hover:underline dark:text-stone-400 dark:hover:text-amber-300"
        >
          Órbita
        </button>
      </footer>
    </div>
  )
}
