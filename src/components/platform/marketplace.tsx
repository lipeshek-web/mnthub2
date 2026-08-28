'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Clock,
  Globe2,
  GraduationCap,
  Library,
  Search,
  SearchX,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from '@/lib/helpers'
import { useAppStore, type ExploreTab } from '@/lib/store'
import type { CourseListItemDTO, MentorListItemDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const SPOTLIGHT_INTERVAL_MS = 6000

export function MarketplaceView() {
  const navigate = useAppStore((s) => s.navigate)

  // Base completa (sem filtros): alimenta destaque rotativo, contagens e stats
  const [baseMentors, setBaseMentors] = useState<MentorListItemDTO[]>([])
  // Lista filtrada exibida no grid
  const [mentors, setMentors] = useState<MentorListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('relevance')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Aba do Explorar (mentores/cursos): valor inicial lido da store uma única vez
  const [tab, setTab] = useState<ExploreTab>(() => useAppStore.getState().exploreTab)
  // Cursos: base completa (contagens/destaque/stats) e lista filtrada
  const [baseCourses, setBaseCourses] = useState<CourseListItemDTO[]>([])
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [courseSort, setCourseSort] = useState('relevance')

  // Consome termo vindo de outra tela (hero da home) uma única vez
  useEffect(() => {
    const q = useAppStore.getState().exploreQuery
    if (q) {
      setInputValue(q)
      setSearch(q)
      useAppStore.setState({ exploreQuery: '' })
    }
  }, [])

  // Consome a aba pedida por outra tela ("Ver todos os cursos" da home) uma única vez.
  // O valor inicial já foi lido no useState acima; aqui apenas resetamos a store.
  useEffect(() => {
    useAppStore.setState({ exploreTab: 'mentors' })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.listMentors({ search, category, sort })
      setMentors(data)
    } catch {
      setMentors([])
    } finally {
      setLoading(false)
    }
  }, [search, category, sort])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    api
      .listMentors({})
      .then(setBaseMentors)
      .catch(() => {})
  }, [])

  // Base de cursos: alimenta destaque, contagens e stats (busca única)
  useEffect(() => {
    api
      .listCourses({})
      .then(setBaseCourses)
      .catch(() => {})
  }, [])

  // Lista filtrada de cursos — só carrega enquanto a aba Cursos está ativa
  const loadCourses = useCallback(async () => {
    setCoursesLoading(true)
    try {
      const data = await api.listCourses({ search, category, sort: courseSort })
      setCourses(data)
    } catch {
      setCourses([])
    } finally {
      setCoursesLoading(false)
    }
  }, [search, category, courseSort])

  useEffect(() => {
    if (tab === 'courses') void loadCourses()
  }, [tab, loadCourses])

  // Atalho "/" foca a busca (sensação de app nativo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onSearchChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value), 300)
  }

  const clearSearch = () => {
    setInputValue('')
    setSearch('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    searchRef.current?.focus()
  }

  // ---------- Derivados da base ----------

  const spotlightPool = useMemo(() => {
    const rated = baseMentors
      .filter((m) => m.rating > 0)
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    if (rated.length > 0) return rated.slice(0, 4)
    return [...baseMentors].sort((a, b) => b.totalSessions - a.totalSessions).slice(0, 3)
  }, [baseMentors])

  const [spotIdx, setSpotIdx] = useState(0)
  useEffect(() => {
    if (spotlightPool.length < 2) return
    const t = setInterval(
      () => setSpotIdx((i) => (i + 1) % spotlightPool.length),
      SPOTLIGHT_INTERVAL_MS
    )
    return () => clearInterval(t)
  }, [spotlightPool.length])

  const spot = spotlightPool.length > 0 ? spotlightPool[spotIdx % spotlightPool.length] : null

  const stats = useMemo(() => {
    const rated = baseMentors.filter((m) => m.rating > 0)
    return {
      mentors: baseMentors.length,
      sessions: baseMentors.reduce((acc, m) => acc + m.totalSessions, 0),
      avg: rated.length > 0 ? rated.reduce((acc, m) => acc + m.rating, 0) / rated.length : null,
    }
  }, [baseMentors])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of baseMentors) {
      for (const c of m.categories) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    return counts
  }, [baseMentors])

  const baseReady = baseMentors.length > 0

  // ---------- Derivados dos cursos ----------

  const courseCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of baseCourses) counts.set(c.category, (counts.get(c.category) ?? 0) + 1)
    return counts
  }, [baseCourses])

  const baseCoursesReady = baseCourses.length > 0

  const courseStats = useMemo(
    () => ({
      published: baseCourses.length,
      students: baseCourses.reduce((acc, c) => acc + c.studentCount, 0),
      lessons: baseCourses.reduce((acc, c) => acc + c.lessonCount, 0),
    }),
    [baseCourses]
  )

  const topCourse = useMemo(() => {
    if (baseCourses.length === 0) return null
    return [...baseCourses].sort(
      (a, b) => b.studentCount - a.studentCount || b.mentor.rating - a.mentor.rating
    )[0]
  }, [baseCourses])

  return (
    <div>
      {/* ---------- BARRA SUPERIOR: título, ordenação, busca e categorias ---------- */}
      <section className="border-b border-stone-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:py-9">
          {/* Controle segmentado: Mentores | Cursos */}
          <div
            role="tablist"
            aria-label="Explorar mentores ou cursos"
            className="inline-flex rounded-full bg-stone-100 p-1"
          >
            <button
              role="tab"
              aria-selected={tab === 'mentors'}
              onClick={() => setTab('mentors')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'mentors'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              <Users aria-hidden className="h-4 w-4" /> Mentores
            </button>
            <button
              role="tab"
              aria-selected={tab === 'courses'}
              onClick={() => setTab('courses')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'courses'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              <BookOpen aria-hidden className="h-4 w-4" /> Cursos
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              {tab === 'mentors' ? (
                <>
                  <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                    Explorar mentores
                  </h1>
                  <p className="mt-1 text-sm text-stone-500">
                    {loading
                      ? 'Carregando especialistas...'
                      : `${mentors.length} ${mentors.length === 1 ? 'especialista' : 'especialistas'} pronto${
                          mentors.length === 1 ? '' : 's'
                        } para mentoria 1:1`}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                    Explorar cursos
                  </h1>
                  <p className="mt-1 text-sm text-stone-500" aria-live="polite">
                    {coursesLoading
                      ? 'Carregando cursos...'
                      : `${courses.length} ${courses.length === 1 ? 'curso publicado' : 'cursos publicados'}`}
                  </p>
                </>
              )}
            </div>
            <div className="w-44">
              <Select
                value={tab === 'mentors' ? sort : courseSort}
                onValueChange={tab === 'mentors' ? setSort : setCourseSort}
              >
                <SelectTrigger
                  aria-label={tab === 'mentors' ? 'Ordenar mentores' : 'Ordenar cursos'}
                  className="bg-white"
                >
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {tab === 'mentors' ? (
                    <>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="rating">Melhor avaliados</SelectItem>
                      <SelectItem value="price_asc">Menor preço</SelectItem>
                      <SelectItem value="price_desc">Maior preço</SelectItem>
                      <SelectItem value="experience">Mais experiência</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="popular">Populares</SelectItem>
                      <SelectItem value="new">Novidades</SelectItem>
                      <SelectItem value="price_asc">Menor preço</SelectItem>
                      <SelectItem value="price_desc">Maior preço</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative mt-5 max-w-2xl">
            <Search
              aria-hidden
              className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-stone-400"
            />
            <Input
              ref={searchRef}
              value={inputValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                tab === 'mentors'
                  ? 'Busque por nome, especialidade ou área...'
                  : 'Busque por curso, tema ou mentor...'
              }
              aria-label={tab === 'mentors' ? 'Buscar mentores' : 'Buscar cursos'}
              className="h-12 rounded-2xl border-stone-200 bg-white pl-11 pr-16 text-stone-900 shadow-none placeholder:text-stone-400 focus-visible:border-emerald-400 focus-visible:ring-emerald-200"
            />
            {inputValue ? (
              <button
                onClick={clearSearch}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3.5 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-md border border-stone-200 bg-stone-50 px-1.5 font-mono text-[11px] font-medium text-stone-400 sm:inline-flex">
                /
              </kbd>
            )}
          </div>

          <div
            aria-label="Filtrar por categoria"
            className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              onClick={() => setCategory('')}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                category === ''
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700'
              )}
            >
              Todas as áreas
            </button>
            {CATEGORIES.map((c) => {
              const count =
                tab === 'mentors'
                  ? (categoryCounts.get(c) ?? 0)
                  : (courseCounts.get(c) ?? 0)
              return (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? '' : c)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    category === c
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300 hover:text-emerald-700'
                  )}
                >
                  {c}
                  {(tab === 'mentors' ? baseReady : baseCoursesReady) && (
                    <span className={cn('ml-1.5 text-[10px]', category === c ? 'text-emerald-100' : 'text-stone-400')}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------- BENTO: destaque + estatísticas (por aba) ---------- */}
      <section aria-label="Destaques e estatísticas" className="mx-auto w-full max-w-6xl px-4 pt-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Spotlight */}
          <div className="lg:col-span-2">
            {tab === 'mentors' ? (
              spot ? (
                <SpotlightCard mentor={spot} index={spotIdx} total={spotlightPool.length} onSelect={(i) => setSpotIdx(i)} />
              ) : (
                <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
              )
            ) : topCourse ? (
              <CourseSpotlightCard course={topCourse} />
            ) : (
              <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 lg:grid-cols-1">
            {tab === 'mentors' ? (
              <>
                <StatTile icon={<Users className="h-4.5 w-4.5" />} value={`+${stats.mentors}`} label="mentores especialistas" />
                <StatTile icon={<Video className="h-4.5 w-4.5" />} value={`+${stats.sessions}`} label="sessões realizadas" />
                <StatTile
                  icon={<Star className="h-4.5 w-4.5" />}
                  value={stats.avg !== null ? stats.avg.toFixed(1).replace('.', ',') : '—'}
                  label="nota média da comunidade"
                />
              </>
            ) : (
              <>
                <StatTile icon={<Library className="h-4.5 w-4.5" />} value={`+${courseStats.published}`} label="cursos publicados" />
                <StatTile icon={<Users className="h-4.5 w-4.5" />} value={`+${courseStats.students}`} label="alunos inscritos" />
                <StatTile icon={<BookOpen className="h-4.5 w-4.5" />} value={`+${courseStats.lessons}`} label="aulas publicadas" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ---------- RESULTADOS ---------- */}
      <section aria-labelledby="resultado-title" className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="resultado-title" className="text-lg font-extrabold tracking-tight text-stone-900">
            {tab === 'mentors' ? 'Todos os mentores' : 'Todos os cursos'}
          </h2>
          {!(tab === 'mentors' ? loading : coursesLoading) && (
            <p className="text-xs font-medium text-stone-400">
              {search || category ? 'Resultado da busca' : 'Ordenado por relevância'}
            </p>
          )}
        </div>

        {tab === 'mentors' ? (
          <>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-stone-200 p-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <Skeleton className="mt-4 h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-5/6" />
                      <div className="mt-4 flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="mt-4 h-10 w-full rounded-full" />
                    </div>
                  ))
                : mentors.map((m) => <MentorCard key={m.id} mentor={m} />)}
            </div>

            {!loading && mentors.length === 0 && (
              <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                  <SearchX className="h-7 w-7 text-stone-400" />
                </span>
                <p className="font-bold text-stone-900">Nenhum mentor encontrado</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500">
                  Tente remover os filtros ou buscar por outro termo — temos especialistas em várias
                  áreas.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setSearch('')
                    setInputValue('')
                    setCategory('')
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coursesLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-stone-200">
                      <Skeleton className="h-28 w-full rounded-none" />
                      <div className="space-y-3 p-5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                        <Skeleton className="mt-3 h-10 w-full rounded-full" />
                      </div>
                    </div>
                  ))
                : courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>

            {!coursesLoading && courses.length === 0 && (
              <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                  <SearchX className="h-7 w-7 text-stone-400" />
                </span>
                <p className="font-bold text-stone-900">Nenhum curso encontrado</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500">
                  Tente remover os filtros ou buscar por outro tema — temos cursos em várias áreas.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setSearch('')
                    setInputValue('')
                    setCategory('')
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

/* ---------- Spotlight rotativo (bento principal) ---------- */

function SpotlightCard({
  mentor,
  index,
  total,
  onSelect,
}: {
  mentor: MentorListItemDTO
  index: number
  total: number
  onSelect: (index: number) => void
}) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="relative flex h-full min-h-56 flex-col overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:p-6">
      <div
        aria-hidden
        className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
          </span>
          Mentor em destaque
        </span>
        {total > 1 && (
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Alternar destaque">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Ver destaque ${i + 1}`}
                onClick={() => onSelect(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mentor.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="relative mt-5 flex flex-1 flex-col justify-center"
        >
          <div className="flex items-center gap-4">
            <Avatar name={mentor.name} src={mentor.avatarUrl} size="xl" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-lg font-bold">
                {mentor.name}
                {mentor.reviewCount >= 3 && mentor.rating >= 4.5 && (
                  <BadgeCheck className="h-4.5 w-4.5 shrink-0 text-emerald-300" aria-label="Mentor bem avaliado" />
                )}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <Stars rating={mentor.rating} size={13} />
                <span className="text-xs font-semibold text-emerald-50">
                  {mentor.rating.toFixed(1)}
                </span>
                <span className="text-xs text-emerald-100/70">
                  ({mentor.reviewCount} avaliações)
                </span>
              </div>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-emerald-50/90">
            {mentor.headline}
          </p>

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {mentor.categories.slice(0, 3).map((c) => (
              <span
                key={c}
                className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100"
              >
                {c}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-emerald-400/15 pt-4">
        <p className="text-xl font-extrabold tracking-tight">
          {currencyBRL(mentor.hourlyRate)}
          <span className="text-xs font-medium text-emerald-200/70">/h</span>
        </p>
        <Button
          size="sm"
          onClick={() => navigate({ name: 'mentor', mentorId: mentor.id })}
          aria-label={`Ver perfil de ${mentor.name}`}
          className="rounded-full bg-white font-bold text-emerald-950 hover:bg-emerald-100"
        >
          Ver perfil <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Tile de estatística ---------- */

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </span>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-stone-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium leading-snug text-stone-500">{label}</p>
    </div>
  )
}

/* ---------- Card de mentor ---------- */

function MentorCard({ mentor }: { mentor: MentorListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
      <div className="flex items-start gap-3.5">
        <Avatar name={mentor.name} src={mentor.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-bold text-stone-900">
            {mentor.name}
            {mentor.reviewCount >= 3 && mentor.rating >= 4.5 && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Mentor bem avaliado" />
            )}
          </p>
          <p className="text-xs font-medium text-stone-500">
            {firstName(mentor.name)} · {mentor.experienceYears} anos de experiência
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <Stars rating={mentor.rating} size={13} />
            <span className="text-xs font-semibold text-stone-700">
              {mentor.rating > 0 ? mentor.rating.toFixed(1) : 'Novo'}
            </span>
            <span className="text-xs text-stone-400">({mentor.reviewCount})</span>
          </div>
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-600">
        {mentor.headline}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.categories.slice(0, 3).map((c) => (
          <span
            key={c}
            className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 pt-3.5">
        <div className="flex items-center gap-3 text-xs text-stone-400">
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />{' '}
            {mentor.totalSessions} {mentor.totalSessions === 1 ? 'sessão' : 'sessões'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Globe2 className="h-3.5 w-3.5" /> {mentor.languages.split(',')[0]}
          </span>
        </div>
        <p className="text-sm font-extrabold text-stone-900">
          {currencyBRL(mentor.hourlyRate)}
          <span className="text-xs font-medium text-stone-400">/h</span>
        </p>
      </div>

      <Button
        className="mt-3.5 h-10 w-full rounded-full font-semibold"
        onClick={() => navigate({ name: 'mentor', mentorId: mentor.id })}
        aria-label={`Ver perfil de ${mentor.name}`}
      >
        Ver perfil e agendar
      </Button>
    </article>
  )
}

/* ---------- Spotlight de curso (bento da aba Cursos) ---------- */

function CourseSpotlightCard({ course }: { course: CourseListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="relative flex h-full min-h-56 flex-col overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:p-6">
      {course.coverUrl && (
        <img
          src={course.coverUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      {course.coverUrl && <div aria-hidden className="absolute inset-0 bg-emerald-950/40" />}
      <div
        aria-hidden
        className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
      />

      <span className="relative inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </span>
        Curso em destaque
      </span>

      <div className="relative mt-5 flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-4">
          {/* Miniatura da capa com anel gradiente determinístico do título */}
          <span
            aria-hidden
            className="shrink-0 rounded-2xl p-0.5"
            style={avatarGradient(course.title)}
          >
            <span className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-[14px] bg-emerald-950/80">
              {course.coverUrl ? (
                <img src={course.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Library className="h-6 w-6 text-emerald-300" />
              )}
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{course.title}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="truncate text-xs text-emerald-100/80">por {course.mentor.name}</span>
              <Stars rating={course.mentor.rating} size={12} />
              <span className="text-xs font-semibold text-emerald-50">
                {course.mentor.rating > 0 ? course.mentor.rating.toFixed(1) : 'Novo'}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-emerald-50/90">
          {course.description}
        </p>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {course.lessonCount} {course.lessonCount === 1 ? 'aula' : 'aulas'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {formatTotalDuration(course.totalDurationMin)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {course.studentCount} {course.studentCount === 1 ? 'aluno' : 'alunos'}
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-emerald-400/15 pt-4">
        <p className="text-xl font-extrabold tracking-tight">
          {course.price === 0 ? (
            <span className="text-emerald-300">Grátis</span>
          ) : (
            currencyBRL(course.price)
          )}
        </p>
        <Button
          size="sm"
          onClick={() => navigate({ name: 'course', courseId: course.id })}
          aria-label={`Ver curso ${course.title}`}
          className="rounded-full bg-white font-bold text-emerald-950 hover:bg-emerald-100"
        >
          Ver curso <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Card de curso (grade da aba Cursos) ---------- */

function CourseCard({ course }: { course: CourseListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white p-0 transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-28 w-full bg-stone-100">
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
            <Library className="pointer-events-none absolute -bottom-3 right-3 h-20 w-20 text-white/20" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
          {LEVEL_LABELS[course.level] ?? course.level}
        </span>
        {course.price === 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
            Grátis
          </span>
        ) : (
          <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-stone-900">
            {currencyBRL(course.price)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="line-clamp-1 font-bold text-stone-900">{course.title}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
          <Avatar
            name={course.mentor.name}
            src={course.mentor.avatarUrl}
            size="sm"
            className="h-5 w-5 text-[8px] ring-0"
          />
          <span className="truncate">por {firstName(course.mentor.name)}</span>
          <Stars rating={course.mentor.rating} size={11} />
          <span className="text-[11px] font-semibold text-stone-600">
            {course.mentor.rating > 0 ? course.mentor.rating.toFixed(1) : 'Novo'}
          </span>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-600">
          {course.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-100 pt-3.5 text-xs text-stone-400">
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

        <Button
          className="mt-3.5 h-10 w-full rounded-full font-semibold"
          onClick={() => navigate({ name: 'course', courseId: course.id })}
          aria-label={`Ver curso ${course.title}`}
        >
          Ver curso
        </Button>
      </div>
    </article>
  )
}
