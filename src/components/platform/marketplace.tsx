'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck,
  CalendarClock,
  Globe2,
  GraduationCap,
  Search,
  SearchX,
  Sparkles,
  Video,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { CATEGORIES, currencyBRL, firstName } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { MentorListItemDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: 'Descubra o mentor ideal',
    text: 'Explore especialistas por área, leia o mural de conteúdos e veja avaliações reais de outros mentorados.',
  },
  {
    icon: CalendarClock,
    title: 'Agende em segundos',
    text: 'Escolha um horário livre na agenda do mentor, descreva seu objetivo e envie sua solicitação.',
  },
  {
    icon: Video,
    title: 'Conecte-se na plataforma',
    text: 'A reunião acontece aqui mesmo, com vídeo integrado. Depois, avalie a sessão e acompanhe sua evolução.',
  },
]

export function MarketplaceView() {
  const navigate = useAppStore((s) => s.navigate)
  const [mentors, setMentors] = useState<MentorListItemDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [sort, setSort] = useState('relevance')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [inputValue, setInputValue] = useState('')

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

  const onSearchChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(value), 300)
  }

  const stats = useMemo(() => {
    return {
      mentors: mentors.length,
      sessions: mentors.reduce((acc, m) => acc + m.totalSessions, 0),
      reviews: mentors.reduce((acc, m) => acc + m.reviewCount, 0),
    }
  }, [mentors])

  return (
    <div className="flex flex-col">
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-emerald-950 text-white">
        <div
          aria-hidden
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-10 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" /> O maior hub de mentorias 1:1 do Brasil
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Aprenda com quem <span className="text-emerald-300">vive o que ensina</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              Profissionais de verdade, agendas reais e reuniões por vídeo dentro da própria
              plataforma. Encontre seu mentor, agende em minutos e dê o próximo passo na carreira.
            </p>

            <div className="mt-7 flex max-w-xl flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-stone-400" />
                <Input
                  value={inputValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Busque por nome, especialidade ou área..."
                  aria-label="Buscar mentores"
                  className="h-12 rounded-xl border-transparent bg-white pl-10 text-stone-900 shadow-lg placeholder:text-stone-400 focus-visible:ring-emerald-400"
                />
              </div>
              <Button
                size="lg"
                onClick={() => document.getElementById('mentores')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 rounded-xl bg-emerald-500 px-6 font-bold text-emerald-950 shadow-lg hover:bg-emerald-400"
              >
                Buscar mentor
              </Button>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
              {[
                { label: 'mentores especialistas', value: `+${stats.mentors}` },
                { label: 'sessões realizadas', value: `+${stats.sessions}` },
                { label: 'avaliações da comunidade', value: `+${stats.reviews}` },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-extrabold text-white sm:text-3xl">{s.value}</dd>
                  <dd className="text-xs text-emerald-200/80">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---------- CATEGORIAS ---------- */}
      <section aria-label="Categorias" className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          {CATEGORIES.map((c) => (
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
            </button>
          ))}
        </div>
      </section>

      {/* ---------- COMO FUNCIONA ---------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Como funciona
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
          Três passos simples entre você e a sua próxima evolução.
        </p>
        <div className="mt-9 grid gap-5 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => (
            <Card key={step.title} className="relative border-stone-200 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <span className="absolute right-5 top-4 text-5xl font-black text-stone-100">
                  {i + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <step.icon className="h-5.5 w-5.5" />
                </span>
                <h3 className="mt-4 font-bold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------- LISTA DE MENTORES ---------- */}
      <section id="mentores" className="w-full bg-stone-50 pb-16" aria-labelledby="mentores-title">
        <div className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="mentores-title" className="text-2xl font-extrabold tracking-tight">
                Mentores disponíveis
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading ? 'Carregando...' : `${mentors.length} especialistas prontos para te ajudar`}
              </p>
            </div>
            <div className="w-48">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger aria-label="Ordenar mentores" className="bg-white">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="rating">Melhor avaliados</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                  <SelectItem value="experience">Mais experiência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-stone-200">
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </CardContent>
                  </Card>
                ))
              : mentors.map((m) => <MentorCard key={m.id} mentor={m} />)}
          </div>

          {!loading && mentors.length === 0 && (
            <Card className="mt-4 border-dashed">
              <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100">
                  <SearchX className="h-7 w-7 text-stone-400" />
                </span>
                <p className="font-semibold">Nenhum mentor encontrado</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Tente remover os filtros ou buscar por outro termo — temos especialistas em
                  várias áreas.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setInputValue('')
                    setCategory('')
                  }}
                >
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}

function MentorCard({ mentor }: { mentor: MentorListItemDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <Card className="group flex flex-col border-stone-200 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg">
      <CardContent className="flex flex-1 flex-col gap-3.5 p-6">
        <div className="flex items-start gap-3.5">
          <Avatar name={mentor.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-bold text-stone-900">
              {mentor.name}
              {mentor.reviewCount >= 3 && mentor.rating >= 4.5 && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Mentor bem avaliado" />
              )}
            </p>
            <p className="text-xs font-medium text-muted-foreground">{firstName(mentor.name)} · {mentor.experienceYears} anos de experiência</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Stars rating={mentor.rating} size={13} />
              <span className="text-xs font-semibold text-stone-700">
                {mentor.rating > 0 ? mentor.rating.toFixed(1) : 'Novo'}
              </span>
              <span className="text-xs text-muted-foreground">
                ({mentor.reviewCount} avaliações)
              </span>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-stone-600">
          {mentor.headline}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {mentor.categories.slice(0, 3).map((c) => (
            <Badge key={c} variant="secondary" className="bg-emerald-50 font-medium text-emerald-800">
              {c}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-stone-100 pt-3.5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> {mentor.totalSessions} sessões
            </span>
            <span className="inline-flex items-center gap-1">
              <Globe2 className="h-3.5 w-3.5" /> {mentor.languages.split(',')[0]}
            </span>
          </div>
          <p className="text-sm font-extrabold text-stone-900">
            {currencyBRL(mentor.hourlyRate)}
            <span className="text-xs font-medium text-muted-foreground">/h</span>
          </p>
        </div>

        <Button
          className="w-full font-bold"
          onClick={() => navigate({ name: 'mentor', mentorId: mentor.id })}
          aria-label={`Ver perfil de ${mentor.name}`}
        >
          Ver perfil e agendar
        </Button>
      </CardContent>
    </Card>
  )
}
