'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  BookOpen,
  Clock,
  Download,
  Info,
  Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { avatarGradient, firstName } from '@/lib/helpers'
import { useAppStore } from '@/lib/store'
import type { LibraryItemDTO, LibraryItemDetailDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const KIND_META: Record<string, { label: string; badge: string; badgeDark: string }> = {
  ARTICLE: {
    label: 'Artigo',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
    badgeDark: 'border-emerald-300/25 bg-white/10 text-emerald-100 hover:bg-white/10',
  },
  BOOK: {
    label: 'Livro',
    badge: 'border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/50',
    badgeDark: 'border-amber-300/30 bg-amber-300/10 text-amber-100 hover:bg-amber-300/10',
  },
}

/** Blocos simples: parágrafo normal, "## " → h2, linhas "- " → lista com marcador esmeralda */
function ArticleBlocks({ content }: { content: string }) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)

        // Subtítulo: "## "
        if (lines.length === 1 && lines[0].startsWith('## ')) {
          return (
            <h2 key={i} className="mt-8 text-xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              {lines[0].slice(3).trim()}
            </h2>
          )
        }

        // Lista: todas as linhas começando com "- "
        if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((l, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">{l.slice(2).trim()}</span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
            {block}
          </p>
        )
      })}
    </div>
  )
}

export function ReaderView({ itemId }: { itemId: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const setExploreTab = useAppStore((s) => s.setExploreTab)

  const [item, setItem] = useState<LibraryItemDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [related, setRelated] = useState<LibraryItemDTO[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  // Retorno contextual: quando aberto a partir de uma aula (sala de aula),
  // o botão voltar devolve à aula exata; caso contrário, vai para a Biblioteca.
  const goBack = useCallback(() => {
    const view = useAppStore.getState().view
    const returnTo = view.name === 'reader' ? view.returnTo : undefined
    if (returnTo) {
      navigate({ name: 'classroom', courseId: returnTo.courseId, lessonId: returnTo.lessonId })
    } else {
      setExploreTab('library')
      navigate({ name: 'marketplace' })
    }
  }, [navigate, setExploreTab])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setItem(null)
    setRelated([])
    try {
      const data = await api.getLibraryItem(itemId, useAppStore.getState().user?.id)
      setItem(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o conteúdo.')
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    void load()
  }, [load])

  // "Continue lendo": mesma categoria, excluindo o item atual (máx. 3)
  useEffect(() => {
    if (!item || !item.canRead || !item.category) return
    let active = true
    api
      .listLibrary({ category: item.category })
      .then((list) => {
        if (active) setRelated(list.filter((r) => r.id !== item.id).slice(0, 3))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [item])

  // Reset de scroll/progresso ao trocar de item
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    if (barRef.current) barRef.current.style.width = '0%'
  }, [itemId])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Barra de progresso: atualiza o DOM via ref (sem setState por pixel), throttled com rAF
  const handleScroll = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const el = scrollRef.current
      const bar = barRef.current
      if (!el || !bar) return
      const max = el.scrollHeight - el.clientHeight
      const pct = max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0
      bar.style.width = `${pct}%`
    })
  }, [])

  const kindMeta = item ? (KIND_META[item.kind] ?? KIND_META.ARTICLE) : null
  const firstCourse = item?.linkedCourses?.[0]

  const footerSections = (wide: boolean) =>
    item && item.canRead ? (
      <>
        {/* Card do autor */}
        <section className={cn('mt-10', wide && 'max-w-3xl')}>
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <Avatar name={item.author.name} src={item.author.avatarUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-stone-900 dark:text-stone-50">{item.author.name}</p>
              <p className="truncate text-sm text-stone-500 dark:text-stone-400">{item.author.headline}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => navigate({ name: 'mentor', mentorId: item.author.id })}
              aria-label={`Ver perfil de ${item.author.name}`}
            >
              Ver perfil
            </Button>
          </div>
        </section>

        {/* Cursos que usam este conteúdo */}
        {item.linkedCourses && item.linkedCourses.length > 0 && (
          <section className={cn('mt-8', wide && 'max-w-3xl')}>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
              Este conteúdo está nos cursos
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.linkedCourses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => navigate({ name: 'course', courseId: course.id })}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
                  aria-label={`Ver curso ${course.title}`}
                >
                  <BookOpen aria-hidden className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{course.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Continue lendo */}
        {related.length > 0 && (
          <section className={cn('mt-8', wide && 'max-w-3xl')}>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
              Continue lendo
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    const view = useAppStore.getState().view
                    navigate({ name: 'reader', itemId: r.id, returnTo: view.name === 'reader' ? view.returnTo : undefined })
                  }}
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 text-left transition-all hover:border-emerald-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-emerald-700"
                  aria-label={`Ler ${r.title}`}
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
                    {r.coverUrl ? (
                      <img src={r.coverUrl} alt="" aria-hidden className="h-full w-full object-cover" />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-full w-full items-center justify-center"
                        style={avatarGradient(r.title)}
                      >
                        {r.kind === 'BOOK' ? (
                          <BookMarked className="h-5 w-5 text-white/60" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-white/60" />
                        )}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Badge
                      variant="outline"
                      className={cn('rounded-full px-2 py-0 text-[10px]', (KIND_META[r.kind] ?? KIND_META.ARTICLE).badge)}
                    >
                      {(KIND_META[r.kind] ?? KIND_META.ARTICLE).label}
                    </Badge>
                    <span className="mt-1 line-clamp-2 block text-sm font-semibold leading-snug text-stone-900 dark:text-stone-50">
                      {r.title}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </>
    ) : null

  return (
    <div className="flex h-full flex-col bg-stone-50 dark:bg-stone-950">
      {/* ---------- TOP BAR IMERSIVA ---------- */}
      <header className="shrink-0 border-b border-emerald-400/15 bg-emerald-950 text-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-white hover:bg-white/10 hover:text-white"
            aria-label="Voltar"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Button>

          {/* Centro: tipo + título + autor */}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
            {kindMeta && (
              <Badge variant="outline" className={cn('shrink-0 gap-1 rounded-full', kindMeta.badgeDark)}>
                {item?.kind === 'BOOK' ? (
                  <BookMarked aria-hidden className="h-3 w-3" />
                ) : (
                  <BookOpen aria-hidden className="h-3 w-3" />
                )}
                {kindMeta.label}
              </Badge>
            )}
            <p className="truncate font-bold text-white">{item?.title ?? 'Carregando...'}</p>
            {item && (
              <p className="hidden min-w-0 items-center gap-1 text-xs text-emerald-100/70 md:flex">
                <span aria-hidden className="text-emerald-100/40">·</span>
                <span className="truncate">
                  {firstName(item.author.name)} · {item.author.headline}
                </span>
              </p>
            )}
          </div>

          {/* Direita: tempo de leitura + download */}
          <div className="flex shrink-0 items-center gap-2">
            {item && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-emerald-100/70">
                <Clock aria-hidden className="h-3.5 w-3.5" />
                {item.readingMin} min
              </span>
            )}
            {item?.canRead && item.pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-white/20 bg-transparent text-white shadow-none hover:bg-white/10 hover:text-white"
                asChild
              >
                <a
                  href={item.pdfUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Baixar PDF"
                >
                  <Download aria-hidden className="h-4 w-4" />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Linha de progresso de leitura (colada no fundo da top bar) */}
        {item?.canRead && !item.pdfUrl && item.content && (
          <div aria-hidden className="h-0.5 w-full bg-white/10">
            <div ref={barRef} className="h-full bg-emerald-400" style={{ width: '0%' }} />
          </div>
        )}
      </header>

      {/* ---------- CORPO ---------- */}
      <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto">
        {loading ? (
          /* Skeleton do leitor */
          <div className="mx-auto w-full max-w-3xl px-4 py-8">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="mt-4 h-9 w-3/4" />
            <div className="mt-4 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="mt-6 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-5/6" />
            <Skeleton className="mt-2 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-2/3" />
            <div className="mt-8 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-4/6" />
            </div>
          </div>
        ) : error || !item ? (
          /* Erro / 404 */
          <div className="flex h-full items-center justify-center p-6">
            <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center dark:border-stone-700 dark:bg-stone-900">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                <AlertCircle className="h-7 w-7 text-stone-400 dark:text-stone-500" aria-hidden />
              </span>
              <p className="font-bold text-stone-900 dark:text-stone-50">Não foi possível carregar o conteúdo.</p>
              <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                {error || 'Este conteúdo pode ter sido removido da Biblioteca.'}
              </p>
              <Button variant="outline" className="mt-1 rounded-full" onClick={() => void load()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : !item.canRead ? (
          /* Estado de bloqueio: conteúdo exclusivo de curso */
          <div className="flex h-full items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900/40">
                <Lock className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                Este conteúdo é exclusivo
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                {firstCourse ? (
                  <>
                    Ele faz parte do curso{' '}
                    <span className="font-semibold text-stone-700 dark:text-stone-200">{firstCourse.title}</span>.
                    Inscreva-se para ter acesso.
                  </>
                ) : (
                  <>Ele faz parte do material de um curso. Inscreva-se para ter acesso.</>
                )}
              </p>
              {firstCourse ? (
                <Button
                  className="mt-5 rounded-full"
                  onClick={() => navigate({ name: 'course', courseId: firstCourse.id })}
                >
                  Ver curso
                </Button>
              ) : (
                <Button variant="outline" className="mt-5 rounded-full" onClick={goBack}>
                  Explorar biblioteca
                </Button>
              )}
            </div>
          </div>
        ) : item.pdfUrl ? (
          /* Modo PDF */
          <div className="mx-auto w-full max-w-5xl p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
              <Info aria-hidden className="h-3.5 w-3.5" />
              Use os controles do leitor para navegar e ampliar.
            </p>
            <iframe
              src={`${item.pdfUrl}#view=FitH`}
              title={item.title}
              className="h-[calc(100dvh-8rem)] min-h-[520px] w-full rounded-xl border border-stone-200 bg-white"
            />
            {footerSections(true)}
            <div className="h-6" />
          </div>
        ) : item.content ? (
          /* Modo texto: artigo editorial */
          <article className="mx-auto w-full max-w-3xl px-4 py-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">{item.title}</h1>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={item.author.name} src={item.author.avatarUrl} size="sm" />
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-stone-800 dark:text-stone-200">{item.author.name}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {item.description && (
              <p className="mt-6 text-lg leading-relaxed text-stone-500 dark:text-stone-400">{item.description}</p>
            )}
            <div className="mt-8">
              <ArticleBlocks content={item.content ?? ''} />
            </div>
            {footerSections(false)}
          </article>
        ) : (
          /* Publicado sem PDF nem texto (não deveria ocorrer via UI) */
          <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
            <BookOpen aria-hidden className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
            <p className="mt-4 font-bold text-stone-900 dark:text-stone-50">Este item ainda não tem conteúdo disponível.</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={goBack}>
              Voltar para a Biblioteca
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
