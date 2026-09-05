'use client'

// Programa de indicação — "Indique e ganhe".
// Mostra o código/link de convite (?ref=), saldo de créditos, estatísticas
// e a lista de convidados. Quem convida ganha R$ 20 quando o convidado
// conclui a 1ª compra; o convidado entra com R$ 10 de crédito.

import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  Copy,
  Gift,
  PartyPopper,
  Share2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import type { ReferralsDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
      {hint ? <p className="mt-1 text-xs leading-snug text-slate-400 dark:text-slate-500">{hint}</p> : null}
    </div>
  )
}

export function ReferralsView() {
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)

  const [data, setData] = useState<ReferralsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    api
      .referrals(user.id)
      .then((res) => {
        if (active) setData(res)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar suas indicações.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  if (!user) return null

  const shareUrl = data ? `${window.location.origin}/?ref=${data.code}` : ''
  const shareText = encodeURIComponent(
    'Aprenda com quem vive o que ensina na Órbita! Use meu convite e ganhe R$ 10 em créditos:'
  )

  const copy = async (value: string, what: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(what)
      toast.success(what === 'link' ? 'Link de convite copiado!' : 'Código copiado!')
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <Button
        variant="ghost"
        onClick={() => navigate({ name: 'home' })}
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Voltar
      </Button>

      {/* Hero: convite */}
      <div className="relative mt-3 overflow-hidden rounded-3xl bg-blue-700 p-6 text-white sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-blue-500/20 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-14 -left-8 size-44 rounded-full bg-teal-400/10 blur-2xl"
        />
        <Badge className="border border-blue-400/40 bg-blue-400/10 text-blue-100 hover:bg-blue-400/10">
          <Gift aria-hidden className="h-3 w-3" />
          Programa de indicação
        </Badge>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Indique amigos, ganhe créditos 💚
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-50/90">
          Compartilhe seu link: seu amigo entra com <strong>R$ 10 de crédito</strong> e você
          ganha <strong>R$ 20</strong> quando ele concluir a primeira compra.
        </p>

        {loading ? (
          <div className="mt-5 space-y-3" aria-busy="true">
            <Skeleton className="h-12 w-full rounded-full bg-blue-900/60" />
            <Skeleton className="h-10 w-40 rounded-full bg-blue-900/60" />
            <span className="sr-only">Carregando seu convite…</span>
          </div>
        ) : error ? (
          <p className="mt-5 text-sm font-medium text-blue-100">{error}</p>
        ) : data ? (
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-blue-900/60 py-1.5 pl-4 pr-1.5 ring-1 ring-blue-500/30">
              <Input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Link de convite"
                className="h-9 border-0 bg-transparent p-0 text-sm font-medium text-blue-50 shadow-none focus-visible:ring-0 dark:border-0 dark:bg-transparent"
              />
              <Button
                size="sm"
                onClick={() => void copy(shareUrl, 'link')}
                className="h-9 shrink-0 rounded-full bg-white px-4 font-bold text-blue-900 hover:bg-blue-100"
              >
                {copied === 'link' ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
                {copied === 'link' ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <Button
              asChild
              className="h-12 shrink-0 rounded-full bg-blue-500 px-5 font-bold text-white hover:bg-blue-400 sm:h-12"
            >
              <a
                href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
              >
                <Share2 aria-hidden className="h-4 w-4" />
                Compartilhar link
              </a>
            </Button>
          </div>
        ) : null}

        {data && !error ? (
          <button
            type="button"
            onClick={() => void copy(data.code, 'code')}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-900/40 px-3 py-1.5 text-xs font-semibold text-blue-100 ring-1 ring-blue-500/20 transition-colors hover:bg-blue-900/60"
          >
            {copied === 'code' ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
            Seu código: <span className="font-mono tracking-widest">{data.code}</span>
          </button>
        ) : null}
      </div>

      {/* Saldo + estatísticas */}
      {loading ? (
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={CircleDollarSign}
              label="Saldo de créditos"
              value={brl(data.creditCents)}
              hint="Desconta automaticamente no checkout"
            />
            <StatTile icon={Users} label="Convites enviados" value={String(data.invitedCount)} />
            <StatTile
              icon={PartyPopper}
              label="Convertidos"
              value={String(data.convertedCount)}
              hint={data.pendingCount > 0 ? `${data.pendingCount} aguardando 1ª compra` : undefined}
            />
            <StatTile icon={Gift} label="Total ganho" value={brl(data.earnedCents)} />
          </div>

          {/* Como funciona */}
          <Card className="mt-5 rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Como funciona
              </h2>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    n: 1,
                    t: 'Compartilhe seu link',
                    d: 'Envie para amigos no WhatsApp, Instagram ou onde quiser.',
                  },
                  {
                    n: 2,
                    t: 'Seu amigo entra com R$ 10',
                    d: 'O crédito de boas-vindas cai na conta dele na hora do cadastro.',
                  },
                  {
                    n: 3,
                    t: 'Você ganha R$ 20',
                    d: 'Quando ele concluir a primeira compra, o crédito cai no seu saldo.',
                  },
                ].map((step) => (
                  <li
                    key={step.n}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-4"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      {step.n}
                    </span>
                    <p className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-50">{step.t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{step.d}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Lista de convidados */}
          <Card className="mt-5 rounded-2xl">
            <CardContent className="p-5 sm:p-6">
              <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Seus convidados
              </h2>
              {data.referrals.length === 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Ninguém ainda — compartilhe seu link e comece a acumular créditos!
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                  {data.referrals.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {r.referredName}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          entrou em {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'shrink-0 rounded-full',
                          r.status === 'REWARDED'
                            ? 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                            : 'border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                        )}
                      >
                        {r.status === 'REWARDED' ? '+ R$ 20 creditados' : 'Aguardando 1ª compra'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {error && !loading ? (
        <Card className="mt-5 rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{error}</p>
            <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Rodapé informativo */}
      <p className="mt-8 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        Créditos são aplicados automaticamente como desconto nos próximos checkouts e não são
        conversíveis em dinheiro.
      </p>
    </div>
  )
}
