'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe2,
  GraduationCap,
  LayoutGrid,
  Library,
  Layers,
  Route,
  SearchX,
  Star,
  Users,
  Video,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  normalizeText,
} from '@/lib/helpers'
import { useAppStore, type ExploreTab } from '@/lib/store'
import type {
  CourseListItemDTO,
  LibraryItemDTO,
  MentorListItemDTO,
  TrackListItemDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { MarketplaceBundles } from './marketplace-bundles'

const SPOTLIGHT_INTERVAL_MS = 6000

/** Itens visíveis por seção da aba "Tudo" antes do botão "Ver mais" */
const ALL_VISIBLE = 8

/** Nota média formatada no padrão pt-BR (vírgula): 4.5 → "4,5" */
const ratingBR = (rating: number) => rating.toFixed(1).replace('.', ',')

type ExpandedKey = 'mentors' | 'courses' | 'tracks' | 'lib' | 'authors'

export function MarketplaceView() {
  const navigate = useAppStore((s) => s.navigate)

  // Base completa (sem filtros): alimenta destaque rotativo, contagens e stats
  const [baseMentors, setBaseMentors] = useState<MentorListItemDTO[]>([])
  // Lista filtrada exibida no grid
  const [mentors, setMentors] = useState<MentorListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('relevance')

  // Aba do Explorar (mentores/cursos): valor inicial lido da store uma única vez
  const [tab, setTab] = useState<ExploreTab>(() => useAppStore.getState().exploreTab)
  // Cursos: base completa (contagens/destaque/stats) e lista filtrada
  const [baseCourses, setBaseCourses] = useState<CourseListItemDTO[]>([])
  const [courses, setCourses] = useState<CourseListItemDTO[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [courseSort, setCourseSort] = useState('relevance')
  // Trilhas: base completa (contagens/destaque/stats) e lista filtrada
  const [baseTracks, setBaseTracks] = useState<TrackListItemDTO[]>([])
  const [tracks, setTracks] = useState<TrackListItemDTO[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)
  const [trackSort, setTrackSort] = useState('relevance')
  // Biblioteca: base completa (destaque/stats) e lista filtrada
  const [baseLibItems, setBaseLibItems] = useState<LibraryItemDTO[]>([])
  const [libItems, setLibItems] = useState<LibraryItemDTO[]>([])
  const [libLoading, setLibLoading] = useState(false)
  const [libKind, setLibKind] = useState<'ALL' | 'ARTICLE' | 'BOOK'>('ALL')
  const [libCategory, setLibCategory] = useState('')
  const [libSort, setLibSort] = useState('recent')
  // Ordenação das seções da aba "Tudo" (Select do cabeçalho)
  const [allSort, setAllSort] = useState('relevance')
  // Seções da aba "Tudo" expandidas além dos primeiros ALL_VISIBLE itens
  const [expanded, setExpanded] = useState<Record<ExpandedKey, boolean>>({
    mentors: false,
    courses: false,
    tracks: false,
    lib: false,
    authors: false,
  })
  const toggleExpanded = useCallback((key: ExpandedKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  // Consome a aba pedida por outra tela ("Ver todos os cursos" da home) uma única vez.
  // O valor inicial já foi lido no useState acima; aqui apenas resetamos a store.
  useEffect(() => {
    useAppStore.setState({ exploreTab: 'all' })
  }, [])

  // ---------- Busca principal: o campo central do header ----------
  // O Explorar não tem barra própria: o termo vem da store (busca central do
  // header, ao vivo) e o corpo reage — navegando ou exibindo só resultados.
  const search = useAppStore((s) => s.exploreQuery)

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

  // Base de trilhas: alimenta destaque, contagens e stats (busca única)
  useEffect(() => {
    api
      .listTracks({})
      .then(setBaseTracks)
      .catch(() => {})
  }, [])

  // Base da Biblioteca: alimenta destaque e stats (busca única)
  useEffect(() => {
    api
      .listLibrary({})
      .then(setBaseLibItems)
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

  // Lista filtrada de trilhas — só carrega enquanto a aba Trilhas está ativa
  const loadTracks = useCallback(async () => {
    setTracksLoading(true)
    try {
      const data = await api.listTracks({ search, category, sort: trackSort })
      setTracks(data)
    } catch {
      setTracks([])
    } finally {
      setTracksLoading(false)
    }
  }, [search, category, trackSort])

  useEffect(() => {
    if (tab === 'tracks') void loadTracks()
  }, [tab, loadTracks])

  // Lista filtrada da Biblioteca — só carrega enquanto a aba Biblioteca está ativa
  const loadLibrary = useCallback(async () => {
    setLibLoading(true)
    try {
      const data = await api.listLibrary({
        search,
        category: libCategory,
        kind: libKind === 'ALL' ? undefined : libKind,
        sort: libSort,
      })
      setLibItems(data)
    } catch {
      setLibItems([])
    } finally {
      setLibLoading(false)
    }
  }, [search, libCategory, libKind, libSort])

  useEffect(() => {
    if (tab === 'library') void loadLibrary()
  }, [tab, loadLibrary])

  /** Limpa o termo da busca principal (header) — volta ao modo navegar */
  const clearSearch = () => {
    useAppStore.getState().setExploreQuery('')
  }

  /** Limpa termo + filtros de área/formato */
  const clearAllSearch = () => {
    useAppStore.getState().setExploreQuery('')
    setCategory('')
    setLibCategory('')
    setLibKind('ALL')
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

  // ---------- Derivados das trilhas ----------

  const trackCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of baseTracks) counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    return counts
  }, [baseTracks])

  const baseTracksReady = baseTracks.length > 0

  const trackStats = useMemo(
    () => ({
      published: baseTracks.length,
      students: baseTracks.reduce((acc, t) => acc + t.studentCount, 0),
      mentorships: baseTracks.reduce((acc, t) => acc + t.mentorshipSessions, 0),
    }),
    [baseTracks]
  )

  const topTrack = useMemo(() => {
    if (baseTracks.length === 0) return null
    return [...baseTracks].sort(
      (a, b) => b.studentCount - a.studentCount || b.mentor.rating - a.mentor.rating
    )[0]
  }, [baseTracks])

  // ---------- Derivados da Biblioteca ----------

  const libStats = useMemo(
    () => ({
      total: baseLibItems.length,
      articles: baseLibItems.filter((i) => i.kind === 'ARTICLE').length,
      books: baseLibItems.filter((i) => i.kind === 'BOOK').length,
      authors: new Set(baseLibItems.map((i) => i.author.userId)).size,
    }),
    [baseLibItems]
  )

  const topLibItem = useMemo(() => {
    if (baseLibItems.length === 0) return null
    return [...baseLibItems].sort(
      (a, b) => b.usageCount - a.usageCount || b.createdAt.localeCompare(a.createdAt)
    )[0]
  }, [baseLibItems])

  // ---------- Aba "Tudo": prateleiras editoriais, áreas e autores ----------

  const totalContents =
    baseMentors.length + baseCourses.length + baseTracks.length + baseLibItems.length

  // Busca consciente: filtra todas as prateleiras client-side (nunca filtra com filtros vazios)
  const allView = useMemo(() => {
    const q = normalizeText(search.trim())
    const filtering = q !== '' || category !== ''
    const matchesTerm = (parts: (string | null | undefined)[]) =>
      q === '' || parts.some((p) => normalizeText(p ?? '').includes(q))
    const matchesCategory = (cats: string | string[]) =>
      category === '' || (Array.isArray(cats) ? cats.includes(category) : cats === category)

    const mentorList = baseMentors
      .filter(
        (m) =>
          matchesTerm([m.name, m.headline, m.categories.join(' ')]) &&
          matchesCategory(m.categories)
      )
      .sort((a, b) =>
        allSort === 'popular'
          ? b.totalSessions - a.totalSessions
          : b.rating - a.rating || b.reviewCount - a.reviewCount
      )
    const courseList = baseCourses
      .filter(
        (c) =>
          matchesTerm([c.title, c.description, c.mentor.name, c.category]) &&
          matchesCategory(c.category)
      )
      .sort((a, b) => b.studentCount - a.studentCount || b.mentor.rating - a.mentor.rating)
    const trackList = baseTracks
      .filter(
        (t) =>
          matchesTerm([t.title, t.description, t.mentor.name, t.category]) &&
          matchesCategory(t.category)
      )
      .sort((a, b) => b.studentCount - a.studentCount || b.mentor.rating - a.mentor.rating)
    const libList = baseLibItems
      .filter(
        (l) =>
          matchesTerm([l.title, l.description, l.author.name, l.category]) &&
          matchesCategory(l.category)
      )
      .sort((a, b) =>
        allSort === 'popular'
          ? b.usageCount - a.usageCount
          : b.createdAt.localeCompare(a.createdAt)
      )
    const authorList = baseMentors
      .filter((m) => matchesTerm([m.name, m.headline]) && matchesCategory(m.categories))
      .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)

    return {
      filtering,
      // Listas completas (a seção em grade decide quantos exibir)
      mentors: mentorList,
      courses: courseList,
      tracks: trackList,
      lib: libList,
      authors: authorList,
      counts: {
        mentors: mentorList.length,
        courses: courseList.length,
        tracks: trackList.length,
        lib: libList.length,
        authors: authorList.length,
      },
      total: mentorList.length + courseList.length + trackList.length + libList.length,
    }
  }, [baseMentors, baseCourses, baseTracks, baseLibItems, search, category, allSort])

  // Itens exibidos numa seção da aba "Tudo": 8 por padrão; quando a seção
  // está expandida OU há busca/categoria ativa, mostra todos os resultados.
  const visibleSlice = <T,>(list: T[], key: ExpandedKey): T[] =>
    allView.filtering || expanded[key] ? list : list.slice(0, ALL_VISIBLE)

  // Pílulas "Explore por área": contagem unificada das 4 bases por categoria
  const unifiedAreas = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of baseMentors) {
      for (const c of m.categories) counts.set(c, (counts.get(c) ?? 0) + 1)
    }
    for (const c of baseCourses) counts.set(c.category, (counts.get(c.category) ?? 0) + 1)
    for (const t of baseTracks) counts.set(t.category, (counts.get(t.category) ?? 0) + 1)
    for (const l of baseLibItems) counts.set(l.category, (counts.get(l.category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [baseMentors, baseCourses, baseTracks, baseLibItems])

  const shelfCountText = (baseCount: number, matchCount: number, unit: string) => {
    if (baseCount === 0) return 'Carregando…'
    if (allView.filtering) return `${matchCount} ${matchCount === 1 ? 'resultado' : 'resultados'}`
    return `${baseCount} ${unit}`
  }

  // ---------- Modo busca: corpo enxuto, só resultados ----------
  const searching = search.trim() !== ''
  const searchTotal =
    tab === 'all'
      ? allView.total
      : tab === 'mentors'
        ? mentors.length
        : tab === 'courses'
          ? courses.length
          : tab === 'tracks'
            ? tracks.length
            : tab === 'library'
              ? libItems.length
              : null
  const clearAllFilters = clearAllSearch

  // Títulos por aba (modo navegar)
  const tabTitle =
    tab === 'all'
      ? 'Explorar tudo'
      : tab === 'mentors'
        ? 'Explorar mentores'
        : tab === 'courses'
          ? 'Explorar cursos'
          : tab === 'tracks'
            ? 'Explorar trilhas'
            : tab === 'bundles'
              ? 'Pacotes de cursos'
              : 'Explorar a Biblioteca'
  const tabSubtitle =
    tab === 'all'
      ? totalContents === 0
        ? 'Carregando conteúdos...'
        : `${totalContents} conteúdos — ${baseMentors.length} mentores, ${baseCourses.length} cursos, ${baseTracks.length} trilhas e ${baseLibItems.length} leituras`
      : tab === 'mentors'
        ? loading
          ? 'Carregando especialistas...'
          : `${mentors.length} ${mentors.length === 1 ? 'especialista' : 'especialistas'} pronto${
              mentors.length === 1 ? '' : 's'
            } para mentoria 1:1`
        : tab === 'courses'
          ? coursesLoading
            ? 'Carregando cursos...'
            : `${courses.length} ${courses.length === 1 ? 'curso publicado' : 'cursos publicados'}`
          : tab === 'tracks'
            ? tracksLoading
              ? 'Carregando trilhas...'
              : `${tracks.length} ${tracks.length === 1 ? 'trilha publicada' : 'trilhas publicadas'}`
            : tab === 'bundles'
              ? 'Vários cursos do mesmo mentor por um preço especial — economize comprando o conjunto'
              : libLoading
                ? 'Carregando conteúdos...'
                : `${libItems.length} ${libItems.length === 1 ? 'conteúdo publicado' : 'conteúdos publicados'}`
  const searchSubtitle =
    searchTotal === null
      ? 'Exibindo resultados'
      : `${searchTotal} ${searchTotal === 1 ? 'resultado' : 'resultados'}`

  return (
    <div>
      {/* ---------- BARRA SUPERIOR: título, ordenação, busca e categorias ---------- */}
      <section className="border-b border-stone-200/70 dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-7 sm:py-9">
          {/* Controle segmentado: Tudo | Mentores | Cursos | Trilhas | Biblioteca */}
          <div
            role="tablist"
            aria-label="Seções do Explorar"
            className="inline-flex max-w-full flex-wrap rounded-full bg-stone-100 dark:bg-stone-800 p-1"
          >
            <button
              role="tab"
              aria-selected={tab === 'all'}
              onClick={() => setTab('all')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <LayoutGrid aria-hidden className="h-4 w-4" /> Tudo
            </button>
            <button
              role="tab"
              aria-selected={tab === 'mentors'}
              onClick={() => setTab('mentors')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'mentors'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
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
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <BookOpen aria-hidden className="h-4 w-4" /> Cursos
            </button>
            <button
              role="tab"
              aria-selected={tab === 'tracks'}
              onClick={() => setTab('tracks')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'tracks'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <Route aria-hidden className="h-4 w-4" /> Trilhas
            </button>
            <button
              role="tab"
              aria-selected={tab === 'bundles'}
              onClick={() => setTab('bundles')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'bundles'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <Layers aria-hidden className="h-4 w-4" /> Pacotes
            </button>
            <button
              role="tab"
              aria-selected={tab === 'library'}
              onClick={() => setTab('library')}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all',
                tab === 'library'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              )}
            >
              <Library aria-hidden className="h-4 w-4" /> Biblioteca
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              {searching ? (
                /* Modo busca: título compacto com o termo + limpar (a busca é a do header) */
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-xl">
                      <span className="sm:hidden">Resultados: </span>
                      <span className="hidden sm:inline">Resultados para </span>
                      <span className="text-emerald-700 dark:text-emerald-400">“{search.trim()}”</span>
                    </h1>
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Limpar busca"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                    >
                      <X aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
                    {searchSubtitle} em toda a plataforma
                  </p>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
                    {tabTitle}
                  </h1>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
                    {tabSubtitle}
                  </p>
                </>
              )}
            </div>
            <div className="w-44">
              {tab === 'bundles' ? null : (
              <Select
                value={
                  tab === 'all'
                    ? allSort
                    : tab === 'mentors'
                      ? sort
                      : tab === 'courses'
                        ? courseSort
                        : tab === 'tracks'
                          ? trackSort
                          : libSort
                }
                onValueChange={
                  tab === 'all'
                    ? setAllSort
                    : tab === 'mentors'
                      ? setSort
                      : tab === 'courses'
                        ? setCourseSort
                        : tab === 'tracks'
                          ? setTrackSort
                          : setLibSort
                }
              >
                <SelectTrigger
                  aria-label={
                    tab === 'all'
                      ? 'Ordenar destaques do Explorar'
                      : tab === 'mentors'
                        ? 'Ordenar mentores'
                        : tab === 'courses'
                          ? 'Ordenar cursos'
                          : tab === 'tracks'
                            ? 'Ordenar trilhas'
                            : 'Ordenar conteúdos da Biblioteca'
                  }
                  className="bg-white dark:bg-stone-900"
                >
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  {tab === 'all' ? (
                    <>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="popular">Populares</SelectItem>
                    </>
                  ) : tab === 'mentors' ? (
                    <>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="rating">Melhor avaliados</SelectItem>
                      <SelectItem value="price_asc">Menor preço</SelectItem>
                      <SelectItem value="price_desc">Maior preço</SelectItem>
                      <SelectItem value="experience">Mais experiência</SelectItem>
                    </>
                  ) : tab === 'library' ? (
                    <>
                      <SelectItem value="recent">Recentes</SelectItem>
                      <SelectItem value="popular">Populares</SelectItem>
                      <SelectItem value="title">Título (A–Z)</SelectItem>
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
              )}
            </div>
          </div>

          {/* A busca é a barra central do header — o corpo não tem campo próprio;
              ao digitar no header o corpo inteiro vira somente resultados. */}

          {tab === 'library' ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Select
                value={libKind}
                onValueChange={(value) => setLibKind(value as 'ALL' | 'ARTICLE' | 'BOOK')}
              >
                <SelectTrigger aria-label="Filtrar por formato" className="w-44 bg-white dark:bg-stone-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os formatos</SelectItem>
                  <SelectItem value="ARTICLE">Artigos</SelectItem>
                  <SelectItem value="BOOK">Livros</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={libCategory || 'all'}
                onValueChange={(value) => setLibCategory(value === 'all' ? '' : value)}
              >
                <SelectTrigger aria-label="Filtrar por categoria" className="w-48 bg-white dark:bg-stone-900">
                  <SelectValue placeholder="Todas as áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as áreas</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : tab === 'all' || tab === 'bundles' ? null : (
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
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300'
              )}
            >
              Todas as áreas
            </button>
            {CATEGORIES.map((c) => {
              const count =
                tab === 'mentors'
                  ? (categoryCounts.get(c) ?? 0)
                  : tab === 'courses'
                    ? (courseCounts.get(c) ?? 0)
                    : (trackCounts.get(c) ?? 0)
              const countsReady =
                tab === 'mentors'
                  ? baseReady
                  : tab === 'courses'
                    ? baseCoursesReady
                    : baseTracksReady
              return (
                <button
                  key={c}
                  onClick={() => setCategory(category === c ? '' : c)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    category === c
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300'
                  )}
                >
                  {c}
                  {countsReady && (
                    <span className={cn('ml-1.5 text-[10px]', category === c ? 'text-emerald-100' : 'text-stone-400 dark:text-stone-500')}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
            </div>
          )}
        </div>
      </section>

      {tab === 'bundles' ? (
        <section aria-labelledby="resultado-title" className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12 pt-8">
          <MarketplaceBundles search={search} />
        </section>
      ) : tab !== 'all' && (
        <>
          {/* ---------- BENTO: destaque + estatísticas (por aba) — oculto no modo busca ---------- */}
          {!searching && (
          <section aria-label="Destaques e estatísticas" className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Spotlight */}
          <div className="lg:col-span-2">
            {tab === 'mentors' ? (
              spot ? (
                <SpotlightCard mentor={spot} index={spotIdx} total={spotlightPool.length} onSelect={(i) => setSpotIdx(i)} />
              ) : (
                <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
              )
            ) : tab === 'courses' ? (
              topCourse ? (
                <CourseSpotlightCard course={topCourse} />
              ) : (
                <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
              )
            ) : tab === 'tracks' ? (
              topTrack ? (
                <TrackSpotlightCard track={topTrack} />
              ) : (
                <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
              )
            ) : topLibItem ? (
              <LibrarySpotlightCard item={topLibItem} />
            ) : (
              <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
            )}
          </div>

          {/* Stats */}
          <div
            className={cn(
              'grid gap-4',
              tab === 'library' ? 'grid-cols-2 lg:grid-cols-1' : 'grid-cols-3 lg:grid-cols-1'
            )}
          >
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
            ) : tab === 'courses' ? (
              <>
                <StatTile icon={<Library className="h-4.5 w-4.5" />} value={`+${courseStats.published}`} label="cursos publicados" />
                <StatTile icon={<Users className="h-4.5 w-4.5" />} value={`+${courseStats.students}`} label="alunos inscritos" />
                <StatTile icon={<BookOpen className="h-4.5 w-4.5" />} value={`+${courseStats.lessons}`} label="aulas publicadas" />
              </>
            ) : tab === 'library' ? (
              <>
                <StatTile icon={<Library className="h-4.5 w-4.5" />} value={`+${libStats.total}`} label="itens publicados" />
                <StatTile icon={<BookOpen className="h-4.5 w-4.5" />} value={`+${libStats.articles}`} label="artigos" />
                <StatTile icon={<BookMarked className="h-4.5 w-4.5" />} value={`+${libStats.books}`} label="livros" />
                <StatTile icon={<Users className="h-4.5 w-4.5" />} value={`+${libStats.authors}`} label="mentores autores" />
              </>
            ) : (
              <>
                <StatTile icon={<Route className="h-4.5 w-4.5" />} value={`+${trackStats.published}`} label="trilhas publicadas" />
                <StatTile icon={<Users className="h-4.5 w-4.5" />} value={`+${trackStats.students}`} label="alunos em trilhas" />
                <StatTile icon={<Video className="h-4.5 w-4.5" />} value={`+${trackStats.mentorships}`} label="mentorias inclusas" />
              </>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ---------- RESULTADOS ---------- */}
      <section aria-labelledby="resultado-title" className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="resultado-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
            {searching
              ? 'Resultados'
              : tab === 'mentors'
                ? 'Todos os mentores'
                : tab === 'courses'
                  ? 'Todos os cursos'
                  : tab === 'tracks'
                    ? 'Todas as trilhas'
                    : 'Todos os conteúdos'}
          </h2>
          {!(tab === 'mentors'
            ? loading
            : tab === 'courses'
              ? coursesLoading
              : tab === 'tracks'
                ? tracksLoading
                : libLoading) && (
            <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
              {(tab === 'library'
                ? Boolean(search || libCategory || libKind !== 'ALL')
                : Boolean(search || category))
                ? 'Resultado da busca'
                : tab === 'library'
                  ? 'Ordenado por recentes'
                  : 'Ordenado por relevância'}
            </p>
          )}
        </div>

        {tab === 'mentors' ? (
          <>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-stone-200 dark:border-stone-800 p-5">
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
              <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <SearchX className="h-7 w-7 text-stone-400 dark:text-stone-500" />
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-50">Nenhum mentor encontrado</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  Tente remover os filtros ou buscar por outro termo — temos especialistas em várias
                  áreas.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={clearAllSearch}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </>
        ) : tab === 'courses' ? (
          <>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coursesLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
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
              <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <SearchX className="h-7 w-7 text-stone-400 dark:text-stone-500" />
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-50">Nenhum curso encontrado</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  Tente remover os filtros ou buscar por outro tema — temos cursos em várias áreas.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={clearAllSearch}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </>
        ) : tab === 'tracks' ? (
          <>
            <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tracksLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
                      <Skeleton className="h-36 w-full rounded-none" />
                      <div className="space-y-3 p-4">
                        <div className="flex gap-1.5">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="mt-3 h-11 w-full rounded-full" />
                      </div>
                    </div>
                  ))
                : tracks.map((t) => <TrackCard key={t.id} track={t} />)}
            </div>

            {!tracksLoading && tracks.length === 0 && (
              <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <SearchX className="h-7 w-7 text-stone-400 dark:text-stone-500" />
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-50">Nenhuma trilha encontrada</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  Tente remover os filtros ou buscar por outro tema — temos trilhas combinando cursos
                  e mentorias 1:1 em várias áreas.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={clearAllSearch}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-5 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {libLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
                      <Skeleton className="h-36 w-full rounded-none" />
                      <div className="space-y-3 p-4">
                        <div className="flex gap-1.5">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-3 w-14" />
                        </div>
                      </div>
                    </div>
                  ))
                : libItems.map((item) => <LibraryCard key={item.id} item={item} />)}
            </div>

            {!libLoading && libItems.length === 0 && (
              <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <SearchX className="h-7 w-7 text-stone-400 dark:text-stone-500" />
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-50">Nenhum conteúdo encontrado na Biblioteca.</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  Tente remover os filtros ou buscar por outro tema — temos artigos e livros em
                  várias áreas.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={clearAllSearch}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </>
        )}
      </section>
        </>
      )}

      {tab === 'all' && (
        <>
          {/* ---------- HERO BENTO (aba Tudo): título editorial + stats globais + destaques — oculto no modo busca ---------- */}
          {!searching && (
          <section aria-label="Visão geral do Explorar" className="mx-auto w-full max-w-7xl px-4 sm:px-6 pt-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="max-w-2xl">
                <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl">
                  Tudo em um só lugar
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500 dark:text-stone-400 sm:text-[15px]">
                  Mentorias 1:1, cursos, trilhas e leituras — feitos por quem vive o que ensina.
                </p>
              </div>

              {/* Stats globais combinadas das 4 bases */}
              <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatTile
                  dark
                  icon={<LayoutGrid aria-hidden className="h-4.5 w-4.5" />}
                  value={`+${totalContents}`}
                  label="mentores, cursos, trilhas e leituras"
                />
                <StatTile
                  icon={<Users aria-hidden className="h-4.5 w-4.5" />}
                  value={`+${courseStats.students + trackStats.students}`}
                  label="alunos aprendendo na plataforma"
                />
                <StatTile
                  icon={<Star aria-hidden className="h-4.5 w-4.5" />}
                  value={stats.avg !== null ? stats.avg.toFixed(1).replace('.', ',') : '—'}
                  label="nota média da comunidade"
                />
                <StatTile
                  icon={<Video aria-hidden className="h-4.5 w-4.5" />}
                  value={`+${stats.sessions}`}
                  label="sessões 1:1 realizadas"
                />
              </div>

              {/* Destaques: mentor rotativo + curso top, lado a lado */}
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {spot ? (
                  <SpotlightCard
                    mentor={spot}
                    index={spotIdx}
                    total={spotlightPool.length}
                    onSelect={(i) => setSpotIdx(i)}
                  />
                ) : (
                  <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
                )}
                {topCourse ? (
                  <CourseSpotlightCard course={topCourse} />
                ) : (
                  <div className="h-full min-h-56 animate-pulse rounded-2xl bg-emerald-950/90" aria-hidden />
                )}
              </div>
            </motion.div>
          </section>
          )}

          {/* ---------- SEÇÕES EM GRADE + ÁREAS + AUTORES (aba Tudo) ---------- */}
          <section
            aria-label="Conteúdos em destaque do Explorar"
            className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-12 pt-10"
          >
            {allView.filtering && allView.total === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <SearchX className="h-7 w-7 text-stone-400 dark:text-stone-500" />
                </span>
                <p className="font-bold text-stone-900 dark:text-stone-50">Nenhum conteúdo encontrado</p>
                <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  Tente remover os filtros ou buscar por outro termo — temos mentorias, cursos,
                  trilhas e leituras em várias áreas.
                </p>
                <Button variant="outline" className="rounded-full" onClick={clearAllFilters}>
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {(!allView.filtering || allView.counts.mentors > 0) && (
                  <motion.section
                    aria-label="Mentores em destaque"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
                  >
                    <GridSection
                      title="Mentores em destaque"
                      countText={shelfCountText(baseMentors.length, allView.counts.mentors, 'mentores')}
                      regionLabel="Mentores em destaque"
                      seeAllLabel="Ver todos os mentores"
                      onSeeAll={() => setTab('mentors')}
                      loading={baseMentors.length === 0}
                      hiddenCount={allView.filtering ? 0 : allView.counts.mentors - ALL_VISIBLE}
                      expanded={expanded.mentors}
                      onToggleExpand={() => toggleExpanded('mentors')}
                      moreLabel="mentores"
                    >
                      {visibleSlice(allView.mentors, 'mentors').map((m) => (
                        <MentorCard key={m.id} mentor={m} />
                      ))}
                    </GridSection>
                  </motion.section>
                )}

                {(!allView.filtering || allView.counts.courses > 0) && (
                  <motion.section
                    aria-label="Cursos em alta"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.11, ease: 'easeOut' }}
                  >
                    <GridSection
                      title="Cursos em alta"
                      countText={shelfCountText(baseCourses.length, allView.counts.courses, 'cursos')}
                      regionLabel="Cursos em alta"
                      seeAllLabel="Ver todos os cursos"
                      onSeeAll={() => setTab('courses')}
                      loading={baseCourses.length === 0}
                      hiddenCount={allView.filtering ? 0 : allView.counts.courses - ALL_VISIBLE}
                      expanded={expanded.courses}
                      onToggleExpand={() => toggleExpanded('courses')}
                      moreLabel="cursos"
                    >
                      {visibleSlice(allView.courses, 'courses').map((c) => (
                        <CourseCard key={c.id} course={c} />
                      ))}
                    </GridSection>
                  </motion.section>
                )}

                {(!allView.filtering || allView.counts.tracks > 0) && (
                  <motion.section
                    aria-label="Trilhas guiadas"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.17, ease: 'easeOut' }}
                  >
                    <GridSection
                      title="Trilhas guiadas"
                      countText={shelfCountText(baseTracks.length, allView.counts.tracks, 'trilhas')}
                      regionLabel="Trilhas guiadas"
                      seeAllLabel="Ver todas as trilhas"
                      onSeeAll={() => setTab('tracks')}
                      loading={baseTracks.length === 0}
                      hiddenCount={allView.filtering ? 0 : allView.counts.tracks - ALL_VISIBLE}
                      expanded={expanded.tracks}
                      onToggleExpand={() => toggleExpanded('tracks')}
                      moreLabel="trilhas"
                    >
                      {visibleSlice(allView.tracks, 'tracks').map((t) => (
                        <TrackCard key={t.id} track={t} />
                      ))}
                    </GridSection>
                  </motion.section>
                )}

                {(!allView.filtering || allView.counts.lib > 0) && (
                  <motion.section
                    aria-label="Artigos e livros"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.23, ease: 'easeOut' }}
                  >
                    <GridSection
                      title="Artigos &amp; livros"
                      countText={shelfCountText(baseLibItems.length, allView.counts.lib, 'leituras')}
                      regionLabel="Artigos e livros da Biblioteca"
                      seeAllLabel="Ver toda a Biblioteca"
                      onSeeAll={() => {
                        if (category) setLibCategory(category)
                        setTab('library')
                      }}
                      loading={baseLibItems.length === 0}
                      hiddenCount={allView.filtering ? 0 : allView.counts.lib - ALL_VISIBLE}
                      expanded={expanded.lib}
                      onToggleExpand={() => toggleExpanded('lib')}
                      moreLabel="leituras"
                    >
                      {visibleSlice(allView.lib, 'lib').map((item) => (
                        <LibraryCard key={item.id} item={item} />
                      ))}
                    </GridSection>
                  </motion.section>
                )}
              </div>
            )}

            {/* Explore por área: pílulas com contagem unificada das 4 bases — oculto no modo busca */}
            {!searching && (
            <motion.section
              aria-labelledby="explore-areas-title"
              className="pt-10"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.26, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2
                  id="explore-areas-title"
                  className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50"
                >
                  Explore por área
                </h2>
                {category && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700 bg-emerald-700 py-1 pl-3.5 pr-1.5 text-xs font-semibold text-white">
                      Área: {category}
                      <button
                        type="button"
                        onClick={() => setCategory('')}
                        aria-label={`Remover filtro da área ${category}`}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-emerald-100 transition-colors hover:bg-emerald-600 hover:text-white"
                      >
                        <X aria-hidden className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-full"
                      onClick={() => setTab('mentors')}
                    >
                      Ver mentores de {category} <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {unifiedAreas.map(([cat, count]) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(category === cat ? '' : cat)}
                    aria-pressed={category === cat}
                    className={cn(
                      'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                      category === cat
                        ? 'border-emerald-700 bg-emerald-700 text-white'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-700 dark:hover:text-emerald-300'
                    )}
                  >
                    {cat}
                    <span
                      className={cn(
                        'ml-1.5 text-[10px]',
                        category === cat ? 'text-emerald-100' : 'text-stone-400 dark:text-stone-500'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </motion.section>
            )}

            {/* Conheça os mentores: tira editorial de autores (induz ver mais do autor) — oculto no modo busca */}
            {!searching && (!allView.filtering || allView.counts.authors > 0) && (
              <motion.section
                aria-label="Conheça os mentores"
                className="pt-10"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.32, ease: 'easeOut' }}
              >
                <GridSection
                  title="Conheça os mentores"
                  countText={shelfCountText(baseMentors.length, allView.counts.authors, 'mentores')}
                  regionLabel="Conheça os mentores"
                  seeAllLabel="Ver todos os mentores"
                  onSeeAll={() => setTab('mentors')}
                  loading={baseMentors.length === 0}
                  hiddenCount={allView.filtering ? 0 : allView.counts.authors - ALL_VISIBLE}
                  expanded={expanded.authors}
                  onToggleExpand={() => toggleExpanded('authors')}
                  moreLabel="mentores"
                  gridClassName="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                  skeletonClassName="h-44 rounded-2xl"
                >
                  {visibleSlice(allView.authors, 'authors').map((m) => (
                    <AuthorMiniCard key={m.id} mentor={m} />
                  ))}
                </GridSection>
              </motion.section>
            )}
          </section>
        </>
      )}
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
  dark = false,
}: {
  icon: React.ReactNode
  value: string
  label: string
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col justify-center rounded-2xl border p-4 sm:p-5',
        dark
          ? 'border-emerald-400/20 bg-emerald-950 text-white shadow-lg shadow-emerald-950/20'
          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
        )}
      >
        {icon}
      </span>
      <p
        className={cn(
          'mt-3 text-2xl font-extrabold tracking-tight',
          dark ? 'text-white' : 'text-stone-900 dark:text-stone-50'
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'mt-0.5 text-xs font-medium leading-snug',
          dark ? 'text-emerald-100/80' : 'text-stone-500 dark:text-stone-400'
        )}
      >
        {label}
      </p>
    </div>
  )
}

/* ---------- Card de mentor ---------- */

const MentorCard = memo(function MentorCard({ mentor }: { mentor: MentorListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md">
      <div className="flex items-start gap-3.5">
        <Avatar name={mentor.name} src={mentor.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-bold text-stone-900 dark:text-stone-50">
            {mentor.name}
            {mentor.reviewCount >= 3 && mentor.rating >= 4.5 && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label="Mentor bem avaliado" />
            )}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <Stars rating={mentor.rating} size={13} />
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {mentor.rating > 0 ? mentor.rating.toFixed(1) : 'Novo'}
            </span>
            {mentor.rating > 0 && (
              <span className="text-stone-400 dark:text-stone-500">({mentor.reviewCount})</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
        {mentor.headline}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.categories.slice(0, 3).map((c) => (
          <span
            key={c}
            className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300"
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 pt-3.5 dark:border-stone-800">
        <div className="flex min-w-0 items-center gap-3 text-xs whitespace-nowrap text-stone-400 dark:text-stone-500">
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5" />{' '}
            {mentor.totalSessions} {mentor.totalSessions === 1 ? 'sessão' : 'sessões'}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <Globe2 className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{mentor.languages.split(',')[0]}</span>
          </span>
        </div>
        <p className="text-sm font-extrabold text-stone-900 dark:text-stone-50">
          {currencyBRL(mentor.hourlyRate)}
          <span className="text-xs font-medium text-stone-400 dark:text-stone-500">/h</span>
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
})

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
          loading="lazy"
          decoding="async"
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
                <img src={course.coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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
          {course.rating > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100"
              title={`${course.reviewCount} ${course.reviewCount === 1 ? 'avaliação' : 'avaliações'} do curso`}
            >
              <Star aria-hidden className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              {ratingBR(course.rating)}
            </span>
          ) : null}
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

const CourseCard = memo(function CourseCard({ course }: { course: CourseListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-0 transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md">
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-28 w-full bg-stone-100 dark:bg-stone-800">
        {course.coverUrl ? (
          <img
            src={course.coverUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
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
        <p className="line-clamp-1 font-bold text-stone-900 dark:text-stone-50">{course.title}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
          <Avatar
            name={course.mentor.name}
            src={course.mentor.avatarUrl}
            size="sm"
            className="h-5 w-5 text-[8px] ring-0"
          />
          <span className="truncate">por {firstName(course.mentor.name)}</span>
        </div>

        <p className="mt-2.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {course.description}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-stone-100 dark:border-stone-800 pt-3.5 text-xs text-stone-400 dark:text-stone-500">
          {course.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-200">
              <Star aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {ratingBR(course.rating)}
              <span className="font-normal text-stone-400 dark:text-stone-500">({course.reviewCount})</span>
            </span>
          ) : null}
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
})

/* ---------- Spotlight de trilha (bento da aba Trilhas) ---------- */

function TrackSpotlightCard({ track }: { track: TrackListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="relative flex h-full min-h-56 flex-col overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:p-6">
      {track.coverUrl && (
        <img
          src={track.coverUrl}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      {track.coverUrl && <div aria-hidden className="absolute inset-0 bg-emerald-950/40" />}
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
        Trilha em destaque
      </span>

      <div className="relative mt-5 flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-4">
          {/* Miniatura da capa com anel gradiente determinístico do título */}
          <span
            aria-hidden
            className="shrink-0 rounded-2xl p-0.5"
            style={avatarGradient(track.title)}
          >
            <span className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-[14px] bg-emerald-950/80">
              {track.coverUrl ? (
                <img src={track.coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <Route className="h-6 w-6 text-emerald-300" />
              )}
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{track.title}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="truncate text-xs text-emerald-100/80">por {track.mentor.name}</span>
              <Stars rating={track.mentor.rating} size={12} />
              <span className="text-xs font-semibold text-emerald-50">
                {track.mentor.rating > 0 ? track.mentor.rating.toFixed(1) : 'Novo'}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-emerald-50/90">
          {track.description}
        </p>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {track.courseCount} {track.courseCount === 1 ? 'curso' : 'cursos'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {track.mentorshipSessions} {track.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {formatTotalDuration(track.totalDurationMin)}
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-emerald-400/15 pt-4">
        <p className="text-xl font-extrabold tracking-tight">
          {track.price === 0 ? (
            <span className="text-emerald-300">Grátis</span>
          ) : (
            currencyBRL(track.price)
          )}
        </p>
        <Button
          size="sm"
          onClick={() => navigate({ name: 'track', trackId: track.id })}
          aria-label={`Ver trilha ${track.title}`}
          className="rounded-full bg-white font-bold text-emerald-950 hover:bg-emerald-100"
        >
          Ver trilha <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Card de trilha (grade da aba Trilhas) ---------- */

const TrackCard = memo(function TrackCard({ track }: { track: TrackListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-0 transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
      onClick={() => navigate({ name: 'track', trackId: track.id })}
    >
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full bg-stone-100 dark:bg-stone-800">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={avatarGradient(track.title)}
          >
            <Route className="pointer-events-none absolute -bottom-3 right-3 h-20 w-20 text-white/20" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
          {LEVEL_LABELS[track.level] ?? track.level}
        </span>
        {track.price === 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[11px] font-bold text-white">
            Grátis
          </span>
        ) : (
          <span className="absolute right-3 top-3 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-stone-900">
            {currencyBRL(track.price)}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="rounded-full border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50">
            Trilha
          </Badge>
          <Badge variant="outline" className="rounded-full border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300">
            {track.category}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-1 font-bold text-stone-900 dark:text-stone-50">{track.title}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {track.courseCount} {track.courseCount === 1 ? 'curso' : 'cursos'}
          </span>
          <span aria-hidden className="text-stone-300 dark:text-stone-600">
            ·
          </span>
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="h-3.5 w-3.5" />
            {track.mentorshipSessions} {track.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'}
          </span>
          <span aria-hidden className="text-stone-300 dark:text-stone-600">
            ·
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

        <div className="mt-auto border-t border-stone-100 pt-3.5 dark:border-stone-800">
          <Button
            className="h-10 w-full rounded-full font-semibold"
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
})

/* ---------- Spotlight da Biblioteca (bento da aba Biblioteca) ---------- */

function LibrarySpotlightCard({ item }: { item: LibraryItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <div className="relative flex h-full min-h-56 flex-col overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:p-6">
      {item.coverUrl && (
        <img
          src={item.coverUrl}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      {item.coverUrl && <div aria-hidden className="absolute inset-0 bg-emerald-950/40" />}
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
        Mais lido
      </span>

      <div className="relative mt-5 flex flex-1 flex-col justify-center">
        <div className="flex items-center gap-4">
          {/* Miniatura da capa com anel gradiente determinístico do título */}
          <span
            aria-hidden
            className="shrink-0 rounded-2xl p-0.5"
            style={avatarGradient(item.title)}
          >
            <span className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-[14px] bg-emerald-950/80">
              {item.coverUrl ? (
                <img src={item.coverUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : item.kind === 'BOOK' ? (
                <BookMarked className="h-6 w-6 text-emerald-300" />
              ) : (
                <BookOpen className="h-6 w-6 text-emerald-300" />
              )}
            </span>
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{item.title}</p>
            <p className="mt-0.5 truncate text-xs text-emerald-100/80">por {item.author.name}</p>
          </div>
        </div>

        {item.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-emerald-50/90">
            {item.description}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <BookOpen aria-hidden className="h-3.5 w-3.5" />
            {item.kind === 'BOOK' ? 'Livro' : 'Artigo'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            {item.category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {item.readingMin} min
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-emerald-400/15 pt-4">
        <p className="text-xs font-medium text-emerald-200/80">
          {item.usageCount > 0
            ? `Usado em ${item.usageCount} ${item.usageCount === 1 ? 'aula' : 'aulas'} de cursos`
            : 'Novo na Biblioteca'}
        </p>
        <Button
          size="sm"
          onClick={() => navigate({ name: 'reader', itemId: item.id })}
          aria-label={`Ler agora ${item.title}`}
          className="rounded-full bg-white font-bold text-emerald-950 hover:bg-emerald-100"
        >
          Ler agora <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Card da Biblioteca (grade da aba Biblioteca) ---------- */

const LibraryCard = memo(function LibraryCard({ item }: { item: LibraryItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article
      className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-0 transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
      onClick={() => navigate({ name: 'reader', itemId: item.id })}
    >
      {/* Capa: foto quando disponível; gradiente determinístico como fallback */}
      <div className="relative h-36 w-full bg-stone-100 dark:bg-stone-800">
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
          <div
            aria-hidden
            className="absolute inset-0"
            style={avatarGradient(item.title)}
          >
            {item.kind === 'BOOK' ? (
              <BookMarked className="pointer-events-none absolute -bottom-3 right-3 h-20 w-20 text-white/20" />
            ) : (
              <BookOpen className="pointer-events-none absolute -bottom-3 right-3 h-20 w-20 text-white/20" />
            )}
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
          {LEVEL_LABELS[item.level] ?? item.level}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            className={cn(
              'rounded-full border',
              item.kind === 'BOOK'
                ? 'border-amber-200 dark:border-amber-900 bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
            )}
          >
            {item.kind === 'BOOK' ? 'Livro' : 'Artigo'}
          </Badge>
          <Badge variant="outline" className="rounded-full border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300">
            {item.category}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-1 font-bold text-stone-900 dark:text-stone-50">{item.title}</p>

        {item.description && (
          <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 dark:border-stone-800 pt-3.5">
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
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
            <Clock aria-hidden className="h-3.5 w-3.5" />
            {item.readingMin} min
          </span>
        </div>
      </div>
    </article>
  )
})

/* ---------- Seção em grade organizada (aba Tudo) ---------- */

function GridSection({
  title,
  countText,
  regionLabel,
  seeAllLabel,
  onSeeAll,
  loading = false,
  hiddenCount = 0,
  expanded = false,
  onToggleExpand,
  moreLabel,
  gridClassName = 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
  skeletonClassName = 'h-72 rounded-2xl',
  children,
}: {
  title: string
  countText: string
  regionLabel: string
  seeAllLabel: string
  onSeeAll: () => void
  loading?: boolean
  hiddenCount?: number
  expanded?: boolean
  onToggleExpand?: () => void
  moreLabel?: string
  gridClassName?: string
  skeletonClassName?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <h3 className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">{title}</h3>
          <span className="text-xs font-medium text-stone-400 dark:text-stone-500">{countText}</span>
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="group inline-flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-300 transition-colors hover:text-emerald-800 dark:hover:text-emerald-200"
        >
          {seeAllLabel}
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>

      {/* Grade responsiva: sem rolagem lateral — tudo organizado em colunas */}
      <div role="region" aria-label={regionLabel} className={cn('mt-4', gridClassName)}>
        {loading
          ? Array.from({ length: ALL_VISIBLE }).map((_, i) => (
              <Skeleton key={i} className={skeletonClassName} />
            ))
          : children}
      </div>

      {hiddenCount > 0 && onToggleExpand && (
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full px-5 font-semibold"
            onClick={onToggleExpand}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Ver menos <ChevronUp aria-hidden className="h-4 w-4" />
              </>
            ) : (
              <>
                Ver mais {hiddenCount} {moreLabel}{' '}
                <ChevronDown aria-hidden className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

/* ---------- Mini card de autor (tira "Conheça os mentores") ---------- */

const AuthorMiniCard = memo(function AuthorMiniCard({ mentor }: { mentor: MentorListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <button
      type="button"
      onClick={() => navigate({ name: 'mentor', mentorId: mentor.id })}
      aria-label={`Ver perfil de ${mentor.name}`}
      className="flex h-full w-full flex-col items-start rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md"
    >
      <Avatar name={mentor.name} src={mentor.avatarUrl} size="xl" />
      <p className="mt-3 w-full truncate text-sm font-bold text-stone-900 dark:text-stone-50">{mentor.name}</p>
      <p className="mt-0.5 w-full line-clamp-1 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {mentor.headline}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <Stars rating={mentor.rating} size={12} />
        <span className="text-xs font-semibold text-stone-700 dark:text-stone-200">
          {mentor.rating > 0 ? mentor.rating.toFixed(1) : 'Novo'}
        </span>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
        Ver perfil <ArrowRight aria-hidden className="h-3.5 w-3.5" />
      </span>
    </button>
  )
})
