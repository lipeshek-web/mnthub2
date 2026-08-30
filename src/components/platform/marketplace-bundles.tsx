'use client'

// Pacotes de cursos (bundles) — conteúdo da aba "Pacotes" do Explorar.
// Componente autocontido: busca, skeletons e empty states próprios.
// CTA "Ver pacote" leva ao checkout com bundleId.

import { useEffect, useMemo, useState } from 'react'
import { BadgePercent, BookOpen, Layers, SearchX, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { avatarGradient, currencyBRL, normalizeText } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { BundleDTO } from '@/lib/types'

/** Moeda com 2 casas fixas (pacotes costumam ter centavos) */
const brl2 = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

function BundleCard({ bundle }: { bundle: BundleDTO }) {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 transition-all hover:-translate-y-0.5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-950/5">
      {/* Capa: mosaico das 2 primeiras capas dos cursos (ou gradiente) */}
      <button
        type="button"
        onClick={() => navigate({ name: 'checkout', bundleId: bundle.id })}
        className="relative block h-32 w-full overflow-hidden text-left"
        aria-label={`Ver pacote ${bundle.title}`}
      >
        {bundle.courses.slice(0, 2).map((c, i) =>
          c.coverUrl ? (
            <img
              key={c.id}
              src={c.coverUrl}
              alt=""
              className={`absolute inset-y-0 w-3/4 object-cover transition-transform duration-500 group-hover:scale-105 ${
                i === 0 ? 'left-0' : 'right-0'
              }`}
            />
          ) : (
            <span
              key={c.id}
              aria-hidden
              className={`absolute inset-y-0 w-3/4 ${i === 0 ? 'left-0' : 'right-0'}`}
              style={avatarGradient(c.title)}
            />
          )
        )}
        {!bundle.courses.some((c) => c.coverUrl) && bundle.courses.length < 2 ? null : null}
        <span
          aria-hidden
          className="absolute inset-0 bg-stone-950/25 transition-colors group-hover:bg-stone-950/10"
        />
        {bundle.discountPercent > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-extrabold text-stone-950 shadow">
            <BadgePercent aria-hidden className="h-3.5 w-3.5" />
            −{bundle.discountPercent}%
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 dark:bg-stone-950/80 px-2.5 py-1 text-xs font-bold text-stone-900 dark:text-stone-50 shadow-sm">
          <Layers aria-hidden className="h-3.5 w-3.5" />
          {bundle.courseCount} {bundle.courseCount === 1 ? 'curso' : 'cursos'}
        </span>
      </button>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Pacote · {bundle.courses[0]?.category ?? bundle.mentor.headline.slice(0, 30)}
        </p>
        <button
          type="button"
          onClick={() => navigate({ name: 'checkout', bundleId: bundle.id })}
          className="mt-1 text-left"
        >
          <h3 className="line-clamp-2 font-bold leading-snug text-stone-900 dark:text-stone-50 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
            {bundle.title}
          </h3>
        </button>

        {/* Cursos incluídos */}
        <ul className="mt-2.5 space-y-1">
          {bundle.courses.slice(0, 3).map((c) => (
            <li key={c.id} className="flex min-w-0 items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
              <BookOpen aria-hidden className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">{c.title}</span>
            </li>
          ))}
          {bundle.courses.length > 3 ? (
            <li className="pl-[18px] text-xs font-medium text-stone-400 dark:text-stone-500">
              + {bundle.courses.length - 3} {bundle.courses.length - 3 === 1 ? 'curso' : 'cursos'}
            </li>
          ) : null}
        </ul>

        {/* Mentor + preço + CTA */}
        <div className="mt-3 flex items-center gap-2 border-t border-stone-100 dark:border-stone-800 pt-3">
          <Avatar name={bundle.mentor.name} src={bundle.mentor.avatarUrl ?? undefined} className="size-7 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-stone-500 dark:text-stone-400">
            {bundle.mentor.name}
          </span>
        </div>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-none text-stone-900 dark:text-stone-50">
              {bundle.price === 0 ? 'Gratuito' : brl2(bundle.price)}
            </p>
            {bundle.coursesTotal > bundle.price && bundle.price > 0 ? (
              <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
                <span className="line-through">{currencyBRL(bundle.coursesTotal)}</span> à parte
              </p>
            ) : null}
          </div>
          <Button
            size="sm"
            onClick={() => navigate({ name: 'checkout', bundleId: bundle.id })}
            className="h-9 shrink-0 rounded-full px-4 font-bold"
          >
            Ver pacote
          </Button>
        </div>
      </div>
    </article>
  )
}

export function MarketplaceBundles({ search }: { search: string }) {
  const [bundles, setBundles] = useState<BundleDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .listBundles({})
      .then((res) => {
        if (active) setBundles(res.bundles.filter((b) => b.courseCount >= 2))
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar os pacotes.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = normalizeText(search.trim())
    if (!q) return bundles
    return bundles.filter(
      (b) =>
        normalizeText(b.title).includes(q) ||
        normalizeText(b.mentor.name).includes(q) ||
        b.courses.some((c) => normalizeText(c.title).includes(q))
    )
  }, [bundles, search])

  if (error) {
    return (
      <p className="py-10 text-center text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="resultado-title" className="text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
          Todos os pacotes
        </h2>
        {!loading && (
          <p className="text-xs font-medium text-stone-400 dark:text-stone-500">
            {search.trim() ? 'Resultado da busca' : 'Ordenado por recentes'}
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="mt-2 flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-9 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          : filtered.map((b) => <BundleCard key={b.id} bundle={b} />)}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
            {search.trim() ? (
              <SearchX aria-hidden className="h-7 w-7 text-stone-400 dark:text-stone-500" />
            ) : (
              <Users aria-hidden className="h-7 w-7 text-stone-400 dark:text-stone-500" />
            )}
          </span>
          <p className="font-bold text-stone-900 dark:text-stone-50">
            {search.trim() ? 'Nenhum pacote encontrado' : 'Ainda não há pacotes publicados'}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {search.trim()
              ? 'Tente buscar por outro termo — os pacotes também aparecem nas páginas dos cursos.'
              : 'Mentores podem criar pacotes com 2 ou mais cursos no painel — fique de olho!'}
          </p>
        </div>
      ) : null}
    </>
  )
}
