'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import type { AiLessonSummaryDTO } from '@/lib/types'
import type { UserDTO } from '@/lib/types'

/* ==================== RESUMO IA DA AULA ====================
   Gera (1x, cacheado no servidor) um resumo + tópicos-chave do
   material da aula. Primeiro aberto por qualquer aluno gera e
   todos os próximos recebem na hora (cached). */

export function LessonAiSummary({
  lessonId,
  lessonTitle,
  user,
  onLogin,
}: {
  lessonId: string
  lessonTitle: string
  user: UserDTO | null
  onLogin: () => void
}) {
  const [data, setData] = useState<AiLessonSummaryDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const requestedRef = useRef(false)

  const generate = useCallback(async () => {
    if (!user || requestedRef.current) return
    requestedRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await api.lessonAiSummary(lessonId, user.id)
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o resumo.')
    } finally {
      setLoading(false)
    }
  }, [lessonId, user])

  // Gera automaticamente na primeira abertura da aba
  useEffect(() => {
    requestedRef.current = false
    setData(null)
    setError(null)
    if (user) void generate()
  }, [generate, user])

  const copySummary = async () => {
    if (!data) return
    const text = [`Resumo — ${lessonTitle}`, '', data.summary, '', 'Tópicos-chave:', ...data.keyPoints.map((k) => `• ${k}`)].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
      toast.success('Resumo copiado para a área de transferência.')
    } catch {
      toast.error('Não foi possível copiar o resumo.')
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-6 py-10 text-center dark:border-amber-900 dark:bg-amber-950/30">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-700/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <Sparkles aria-hidden className="h-5 w-5" />
        </span>
        <p className="max-w-sm text-sm text-stone-600 dark:text-stone-300">
          Entre com sua conta para gerar o <strong className="font-semibold">resumo com IA</strong> desta aula —
          grátis para alunos matriculados.
        </p>
        <Button
          size="sm"
          className="h-10 rounded-full bg-amber-700 px-5 font-semibold hover:bg-amber-800"
          onClick={onLogin}
        >
          Entrar
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div aria-busy="true" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles aria-hidden className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">
            Gerando o resumo desta aula com IA…
          </p>
        </div>
        <div className="max-w-prose space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[96%]" />
          <Skeleton className="h-4 w-[60%]" />
          <div className="grid gap-2 pt-3 sm:grid-cols-2">
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
        </div>
        <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
          Pode levar alguns segundos na primeira vez — o resultado fica salvo para todos os alunos.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center dark:border-stone-700 dark:bg-stone-900">
        <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{error}</p>
        <Button
          size="sm"
          variant="outline"
          className="h-10 rounded-full font-semibold"
          onClick={() => {
            requestedRef.current = false
            setError(null)
            void generate()
          }}
        >
          <RefreshCw aria-hidden className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <article className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/80 to-white p-5 sm:p-6 dark:border-amber-900 dark:from-amber-950/30 dark:to-stone-900">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700 text-white shadow-sm dark:bg-amber-600">
            <Sparkles aria-hidden className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
              Resumo com IA
            </p>
            <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
              {data.cached ? 'Gerado anteriormente · salvo para todos os alunos' : 'Gerado agora a partir do material desta aula'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 rounded-full font-semibold"
          onClick={() => void copySummary()}
          aria-label="Copiar resumo"
        >
          {copied ? (
            <>
              <Check aria-hidden className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Copiado
            </>
          ) : (
            <>
              <Copy aria-hidden className="h-3.5 w-3.5" />
              Copiar
            </>
          )}
        </Button>
      </header>

      <p className="max-w-prose whitespace-pre-line text-[15px] leading-relaxed text-stone-700 dark:text-stone-200">
        {data.summary}
      </p>

      {data.keyPoints.length > 0 && (
        <section aria-label="Tópicos-chave da aula" className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Tópicos-chave
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
              >
                <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span className="leading-snug">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
