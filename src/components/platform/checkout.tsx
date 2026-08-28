'use client'

// Checkout de curso OU trilha pago — pagamento DEMONSTRATIVO (nenhuma cobrança real).
// Fluxo: resumo do pedido → forma de pagamento (PIX/Cartão) → confirmação,
// com funil de rastreamento (begin_checkout na montagem, purchase no sucesso).
// A loja navega { name: 'checkout', courseId } ou { name: 'checkout', trackId }.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Info,
  Library,
  Loader2,
  Lock,
  LogIn,
  QrCode,
  Route,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, Stars } from '@/components/platform/avatar'
import { api } from '@/lib/api'
import { LEVEL_LABELS, avatarGradient, currencyBRL } from '@/lib/helpers'
import { getAttribution, loadTrackingScripts, trackEvent } from '@/lib/tracking'
import { useAppStore } from '@/lib/store'
import type { CheckoutResultDTO, CourseDetailDTO, TrackDetailDTO } from '@/lib/types'
import { cn } from '@/lib/utils'

type PaymentMethodValue = 'PIX' | 'CREDIT_CARD'

const METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
}

/** Resumo normalizado do item em checkout (curso ou trilha) */
interface ItemSummary {
  kind: 'course' | 'track'
  id: string
  title: string
  coverUrl: string | null
  category: string
  level: string
  price: number
  mentor: {
    id: string
    name: string
    rating: number
    reviewCount: number
    avatarUrl?: string | null
  }
  isEnrolled: boolean
  /** Presente apenas em trilhas: composição da jornada */
  trackStats?: { courseCount: number; mentorshipSessions: number }
}

export function CheckoutView({ courseId, trackId }: { courseId?: string; trackId?: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const setExploreTab = useAppStore((s) => s.setExploreTab)
  const user = useAppStore((s) => s.user)

  const [course, setCourse] = useState<CourseDetailDTO | null>(null)
  const [track, setTrack] = useState<TrackDetailDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('PIX')
  const [paying, setPaying] = useState(false)
  const [freeEnrolling, setFreeEnrolling] = useState(false)
  const [order, setOrder] = useState<CheckoutResultDTO | null>(null)

  // Guarda: begin_checkout apenas na primeira montagem bem-sucedida
  // (evita duplicidade em re-render/StrictMode)
  const trackedRef = useRef(false)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (trackId) {
        const d = await api.getTrack(trackId, user?.id)
        setTrack(d)
        setCourse(null)

        // Pixels da plataforma recebem as conversões deste checkout
        if (!trackedRef.current) {
          trackedRef.current = true
          loadTrackingScripts()
          trackEvent('begin_checkout', {
            mentorId: d.mentor.id,
            value: d.price,
            contentName: d.title,
          })
        }
      } else if (courseId) {
        const d = await api.getCourse(courseId, user?.id)
        setCourse(d)
        setTrack(null)

        // Pixels do mentor recebem as conversões deste checkout
        if (!trackedRef.current) {
          trackedRef.current = true
          loadTrackingScripts({
            mentorGaId: d.mentor.tracking?.gaMeasurementId,
            mentorPixelId: d.mentor.tracking?.metaPixelId,
          })
          trackEvent('begin_checkout', {
            mentorId: d.mentor.id,
            courseId: d.id,
            value: d.price,
            contentName: d.title,
          })
        }
      } else {
        setError('Item não encontrado.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o checkout.')
    } finally {
      setLoading(false)
    }
  }, [courseId, trackId, user?.id])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  /* ---------- Ações ---------- */

  const doEnrollFree = async () => {
    if (!user || !item) return
    setFreeEnrolling(true)
    try {
      if (item.kind === 'track') {
        await api.enrollTrack(item.id, user.id)
        toast.success('Inscrição realizada! Boa jornada 🎉')
        navigate({ name: 'track', trackId: item.id })
      } else {
        const res = await api.enrollCourse(item.id, user.id)
        toast.success(
          res.alreadyEnrolled
            ? 'Você já estava inscrito neste curso.'
            : 'Inscrição realizada! Boa jornada 🎉'
        )
        navigate({ name: 'course', courseId: item.id })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao realizar inscrição.')
    } finally {
      setFreeEnrolling(false)
    }
  }

  const doPay = async () => {
    if (!user || !item || paying) return
    setPaying(true)
    try {
      // A atribuição (utm/gclid/fbclid/canal/landing) viaja no mesmo corpo —
      // o servidor lê body.attribution para o pedido e o evento purchase.
      const payload = {
        userId: user.id,
        courseId: item.kind === 'course' ? item.id : undefined,
        trackId: item.kind === 'track' ? item.id : undefined,
        paymentMethod,
        attribution: getAttribution(),
      }
      const result = await api.checkout(payload)

      trackEvent('purchase', {
        mentorId: item.mentor.id,
        courseId: item.kind === 'course' ? item.id : null,
        value: item.price,
        transactionId: result.order.id,
        contentName: item.title,
      })
      toast.success('Pagamento aprovado! 🎉')
      setOrder(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível concluir o pagamento.'
      toast.error(message)
      // Matrícula já existia (409): recarrega para exibir o estado "já inscrito"
      if (message.includes('já tem acesso')) void fetchSummary()
    } finally {
      setPaying(false)
    }
  }

  /* ---------- Skeleton ---------- */
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8" aria-busy="true">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="mt-4 h-64 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-24 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-12 w-full rounded-full" />
        <p className="sr-only">Carregando checkout…</p>
      </div>
    )
  }

  /* ---------- Erro ---------- */
  if (error || (!course && !track)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
              <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
            </span>
            <p className="font-bold text-stone-900">Não foi possível carregar o checkout</p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500">
              {error ?? 'Item não encontrado.'}
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => void fetchSummary()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ---------- Resumo normalizado (curso ou trilha) ---------- */
  const item: ItemSummary | null = track
    ? {
        kind: 'track',
        id: track.id,
        title: track.title,
        coverUrl: track.coverUrl ?? null,
        category: track.category,
        level: track.level,
        price: track.price,
        mentor: {
          id: track.mentor.id,
          name: track.mentor.name,
          rating: track.mentor.rating,
          reviewCount: track.mentor.reviewCount,
          avatarUrl: track.mentor.avatarUrl,
        },
        isEnrolled: track.myEnrollment !== null,
        trackStats: {
          courseCount: track.courseCount,
          mentorshipSessions: track.mentorshipSessions,
        },
      }
    : course
      ? {
          kind: 'course',
          id: course.id,
          title: course.title,
          coverUrl: course.coverUrl ?? null,
          category: course.category,
          level: course.level,
          price: course.price,
          mentor: {
            id: course.mentor.id,
            name: course.mentor.name,
            rating: course.mentor.rating,
            reviewCount: course.mentor.reviewCount,
            avatarUrl: course.mentor.avatarUrl,
          },
          isEnrolled: course.enrollment !== null,
        }
      : null

  if (!item) return null

  const isTrack = item.kind === 'track'

  /* ---------- Tela de SUCESSO (substitui o formulário) ---------- */
  if (order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <Card className="mx-auto max-w-md rounded-2xl">
          <CardContent className="flex flex-col items-center gap-1.5 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 aria-hidden className="h-9 w-9 text-emerald-600" />
            </span>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
              Pagamento confirmado!
            </h1>
            <p className="text-sm leading-relaxed text-stone-500">
              Você já tem acesso a{' '}
              <span className="font-semibold text-stone-700">“{order.order.itemTitle}”</span>
            </p>

            <dl className="mt-5 w-full space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Pedido</dt>
                <dd className="font-bold text-stone-800">#{order.order.id.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Método</dt>
                <dd className="font-bold text-stone-800">
                  {METHOD_LABEL[order.order.paymentMethod] ?? order.order.paymentMethod}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500">Total</dt>
                <dd className="font-extrabold text-emerald-700">{currencyBRL(order.order.amount)}</dd>
              </div>
            </dl>

            {isTrack ? (
              <>
                <Button
                  onClick={() => navigate({ name: 'track', trackId: item.id })}
                  className="mt-6 h-12 w-full rounded-full font-bold"
                >
                  Acessar a trilha
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExploreTab('tracks')
                    navigate({ name: 'marketplace' })
                  }}
                  className="w-full rounded-full"
                >
                  Explorar mais trilhas
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate({ name: 'course', courseId: item.id })}
                  className="mt-6 h-12 w-full rounded-full font-bold"
                >
                  Acessar o curso
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ name: 'marketplace' })}
                  className="w-full rounded-full"
                >
                  Explorar mais cursos
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ---------- Checkout ---------- */

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      <Button
        variant="ghost"
        onClick={() =>
          isTrack
            ? navigate({ name: 'track', trackId: item.id })
            : navigate({ name: 'course', courseId: item.id })
        }
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {isTrack ? 'Voltar à trilha' : 'Voltar ao curso'}
      </Button>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl">
        Checkout
      </h1>

      {/* Sem login: pedir para entrar */}
      {!user && (
        <Card className="mt-5 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <LogIn aria-hidden className="h-7 w-7 text-emerald-700" />
            </span>
            <p className="font-bold text-stone-900">Entre para concluir a compra</p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500">
              Entre com uma conta para concluir a compra de “{item.title}”.
            </p>
            <Button
              className="mt-1 h-11 rounded-full px-8 font-bold"
              onClick={() => navigate({ name: 'auth', mode: 'login' })}
            >
              Entrar ou criar conta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Já inscrito: acesso liberado */}
      {user && item.isEnrolled && (
        <Card className="mt-5 rounded-2xl border-emerald-200 bg-emerald-50/40">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 aria-hidden className="h-7 w-7 text-emerald-700" />
            </span>
            <p className="font-bold text-stone-900">
              {isTrack ? 'Você já tem acesso a esta trilha' : 'Você já tem acesso a este curso'}
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500">
              Sua matrícula em “{item.title}” já está ativa — bons estudos!
            </p>
            <Button
              onClick={() =>
                isTrack
                  ? navigate({ name: 'track', trackId: item.id })
                  : navigate({ name: 'course', courseId: item.id })
              }
              className="mt-1 h-11 rounded-full px-6 font-bold"
            >
              {isTrack ? 'Acessar a trilha' : 'Ir para o curso'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Item gratuito: matrícula direta (defensivo — trilhas gratuitas normalmente
          são inscritas direto na tela da trilha, sem passar pelo checkout) */}
      {user && !item.isEnrolled && item.price === 0 && (
        <div className="mt-5 flex flex-col items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 text-center">
          <p className="font-bold text-stone-900">
            {isTrack ? 'Esta trilha é gratuita' : 'Este curso é gratuito'}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500">
            Não é preciso pagar nada: matricule-se e comece a aprender agora mesmo.
          </p>
          <Button
            onClick={() => void doEnrollFree()}
            disabled={freeEnrolling}
            className="mt-1 h-11 w-full rounded-full px-8 font-bold sm:w-auto"
          >
            {freeEnrolling && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
            Inscrever-se
          </Button>
        </div>
      )}

      {/* Fluxo de pagamento (item pago + logado + não inscrito) */}
      {user && !item.isEnrolled && item.price > 0 && (
        <>
          {/* ---- RESUMO DO PEDIDO ---- */}
          <Card className="mt-5 gap-0 overflow-hidden rounded-2xl py-0">
            {item.coverUrl ? (
              <img
                src={item.coverUrl}
                alt={`Capa ${isTrack ? 'da trilha' : 'do curso'} ${item.title}`}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="flex h-28 w-full items-center justify-center"
                style={avatarGradient(item.title)}
              >
                {isTrack ? (
                  <Route className="h-8 w-8 text-white/20" />
                ) : (
                  <Library className="h-8 w-8 text-white/20" />
                )}
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  {item.category}
                </Badge>
                <Badge variant="outline" className="rounded-full border-stone-300 text-stone-600">
                  {LEVEL_LABELS[item.level] ?? item.level}
                </Badge>
              </div>

              <h2 className="mt-2.5 text-lg font-extrabold leading-snug text-stone-900">
                {item.title}
              </h2>

              {isTrack && item.trackStats && (
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen aria-hidden className="h-4 w-4 text-stone-400" />
                    Trilha com {item.trackStats.courseCount}{' '}
                    {item.trackStats.courseCount === 1 ? 'curso' : 'cursos'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden className="h-4 w-4 text-stone-400" />e{' '}
                    {item.trackStats.mentorshipSessions}{' '}
                    {item.trackStats.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'} 1:1
                  </span>
                </p>
              )}

              <div className="mt-3 flex items-center gap-3">
                <Avatar name={item.mentor.name} src={item.mentor.avatarUrl} size="sm" />
                <div>
                  <p className="text-sm font-bold text-stone-800">{item.mentor.name}</p>
                  {item.mentor.rating > 0 && (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Stars rating={item.mentor.rating} size={12} />
                      <span className="text-xs text-stone-400">
                        ({item.mentor.reviewCount}{' '}
                        {item.mentor.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-500">Total</span>
                <span className="text-2xl font-extrabold tracking-tight text-stone-900">
                  {currencyBRL(item.price)}
                </span>
              </div>
              <p className="mt-2 text-xs text-stone-400">
                Pagamento processado pela plataforma · demonstração
              </p>
            </div>
          </Card>

          {/* ---- AVISO DEMO ---- */}
          <div
            role="note"
            className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800"
          >
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Ambiente de demonstração — nenhuma cobrança real será feita. A matrícula é liberada
              na hora.
            </span>
          </div>

          {/* ---- FORMA DE PAGAMENTO ---- */}
          <section aria-labelledby="lp-pagamento-title" className="mt-6">
            <h2
              id="lp-pagamento-title"
              className="text-sm font-extrabold uppercase tracking-wider text-stone-500"
            >
              Forma de pagamento
            </h2>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethodValue)}
              aria-labelledby="lp-pagamento-title"
              className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              <Label
                htmlFor="pay-pix"
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-colors',
                  paymentMethod === 'PIX'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <RadioGroupItem value="PIX" id="pay-pix" className="mt-0.5" />
                <QrCode aria-hidden className="h-5 w-5 shrink-0 text-emerald-700" />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-stone-900">PIX</span>
                  <span className="block text-xs text-stone-500">Aprovação imediata</span>
                </span>
              </Label>

              <Label
                htmlFor="pay-card"
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-colors',
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <RadioGroupItem value="CREDIT_CARD" id="pay-card" className="mt-0.5" />
                <CreditCard aria-hidden className="h-5 w-5 shrink-0 text-emerald-700" />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-stone-900">Cartão de crédito</span>
                  <span className="block text-xs text-stone-500">Em até 12x — simulação</span>
                </span>
              </Label>
            </RadioGroup>

            {/* PIX: QR Code ilustrativo */}
            {paymentMethod === 'PIX' && (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-6 text-center">
                <QrCode aria-hidden className="h-24 w-24 text-stone-300" strokeWidth={1.25} />
                <p className="max-w-sm text-sm leading-relaxed text-stone-500">
                  O QR Code aparece aqui em produção — pagamentos reais via gateway (Stripe/Mercado
                  Pago).
                </p>
              </div>
            )}

            {/* Cartão: formulário apenas visual (demo) */}
            {paymentMethod === 'CREDIT_CARD' && (
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="cc-number" className="text-xs font-semibold text-stone-600">
                      Número do cartão
                    </Label>
                    <Input
                      id="cc-number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="•••• •••• •••• 4242"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="cc-name" className="text-xs font-semibold text-stone-600">
                      Nome no cartão
                    </Label>
                    <Input
                      id="cc-name"
                      autoComplete="cc-name"
                      placeholder="Como impresso no cartão"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cc-exp" className="text-xs font-semibold text-stone-600">
                      Validade
                    </Label>
                    <Input
                      id="cc-exp"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cc-cvv" className="text-xs font-semibold text-stone-600">
                      CVV
                    </Label>
                    <Input
                      id="cc-cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="•••"
                      className="mt-1.5 h-10 rounded-xl"
                    />
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-amber-700">
                  <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Ambiente de demonstração — não insira dados reais.
                </p>
              </div>
            )}
          </section>

          {/* ---- BOTÃO PAGAR ---- */}
          <Button
            onClick={() => void doPay()}
            disabled={paying}
            className="mt-6 h-13 w-full rounded-full text-base font-extrabold"
          >
            {paying ? (
              <>
                <Loader2 aria-hidden className="h-5 w-5 animate-spin" /> Pagando…
              </>
            ) : (
              <>
                <Lock aria-hidden className="h-4 w-4" /> Pagar {currencyBRL(item.price)}
              </>
            )}
          </Button>

          {/* ---- SEGURANÇA ---- */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck aria-hidden className="h-4 w-4 text-emerald-600" />
              Compra protegida · 7 dias de garantia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Lock aria-hidden className="h-4 w-4" />
              SSL
            </span>
          </div>
        </>
      )}
    </div>
  )
}
