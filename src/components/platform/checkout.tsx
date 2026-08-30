'use client'

// Checkout de curso, trilha, pacote ou assinatura — via gateway Asaas (sandbox
// em testes) ou modo demonstração (sem chave configurada).
// Fluxo: resumo do pedido → cupom/créditos → forma de pagamento → PIX/fatura,
// com funil de rastreamento (begin_checkout na montagem, purchase no sucesso).
// A loja navega { name: 'checkout', courseId | trackId | bundleId | membershipId }.

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Info,
  Landmark,
  Layers,
  Library,
  Loader2,
  Lock,
  LogIn,
  QrCode,
  Route,
  ShieldCheck,
  Tag,
  Users,
  X,
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
import { groupSessionLabel } from '@/lib/membership-serialize'
import { LEVEL_LABELS, avatarGradient, currencyBRL } from '@/lib/helpers'
import { getAttribution, loadTrackingScripts, trackEvent } from '@/lib/tracking'
import { useAppStore } from '@/lib/store'
import type {
  BundleCourseDTO,
  BundleDetailDTO,
  CheckoutResultDTO,
  CouponValidationDTO,
  CourseDetailDTO,
  MembershipDTO,
  PaymentsConfigDTO,
  PendingPaymentDTO,
  TrackDetailDTO,
} from '@/lib/types'
import { cn } from '@/lib/utils'

type PaymentMethodValue = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

const METHOD_LABEL: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de crédito',
  BOLETO: 'Boleto',
}

/** Moeda com 2 casas fixas (descontos costumam ter centavos: R$ 170,10) */
const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

/** Resumo normalizado do item em checkout (curso, trilha ou pacote) */
interface ItemSummary {
  kind: 'course' | 'track' | 'bundle' | 'membership'
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
  /** Presente apenas em pacotes: cursos inclusos e economia */
  bundleStats?: {
    courses: BundleCourseDTO[]
    coursesTotal: number
    discountPercent: number
    enrolledCount: number
  }
  /** Presente apenas em assinaturas: benefícios do plano */
  membershipStats?: { coursesCount: number; sessionLabel: string }
}

export function CheckoutView({
  courseId,
  trackId,
  bundleId,
  membershipId,
}: {
  courseId?: string
  trackId?: string
  bundleId?: string
  membershipId?: string
}) {
  const navigate = useAppStore((s) => s.navigate)
  const setExploreTab = useAppStore((s) => s.setExploreTab)
  const user = useAppStore((s) => s.user)

  const [course, setCourse] = useState<CourseDetailDTO | null>(null)
  const [track, setTrack] = useState<TrackDetailDTO | null>(null)
  const [bundle, setBundle] = useState<BundleDetailDTO | null>(null)
  const membershipTuple = useState<MembershipDTO | null>(null)
  const membership = membershipTuple[0]
  const setMembership = membershipTuple[1]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Créditos de indicação (saldo fresco da API — o store pode estar desatualizado)
  const [creditCents, setCreditCents] = useState(0)
  const [useCredits, setUseCredits] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('PIX')
  const [paying, setPaying] = useState(false)
  const [freeEnrolling, setFreeEnrolling] = useState(false)
  const [order, setOrder] = useState<CheckoutResultDTO | null>(null)

  // Gateway: ASAAS (real, sandbox em testes) ou SIMULADO (modo demonstração)
  const [gateway, setGateway] = useState<PaymentsConfigDTO | null>(null)
  const [cpfCnpj, setCpfCnpj] = useState('')
  // Cobrança pendente no Asaas (PIX/fatura) — substitui o formulário até cair
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentDTO | null>(null)
  const [pendingOrder, setPendingOrder] = useState<CheckoutResultDTO['order'] | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)

  // Cupom de desconto (apenas itens pagos)
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState<CouponValidationDTO | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Guarda: begin_checkout apenas na primeira montagem bem-sucedida
  // (evita duplicidade em re-render/StrictMode)
  const trackedRef = useRef(false)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (membershipId) {
        const { membership: m } = await api.getMembership(membershipId, user?.id)
        setMembership(m)
        setBundle(null)
        setCourse(null)
        setTrack(null)

        if (!trackedRef.current) {
          trackedRef.current = true
          loadTrackingScripts()
          trackEvent('begin_checkout', {
            mentorId: m.mentor.id,
            value: m.price,
            contentName: m.title,
          })
        }
      } else if (bundleId) {
        const { bundle: b } = await api.getBundle(bundleId, user?.id)
        setBundle(b)
        setCourse(null)
        setTrack(null)
        setMembership(null)

        if (!trackedRef.current) {
          trackedRef.current = true
          loadTrackingScripts()
          trackEvent('begin_checkout', {
            mentorId: b.mentor.id,
            value: b.price,
            contentName: b.title,
          })
        }
      } else if (trackId) {
        const d = await api.getTrack(trackId, user?.id)
        setTrack(d)
        setCourse(null)
        setMembership(null)

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
        setBundle(null)
        setMembership(null)

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
  }, [bundleId, courseId, trackId, membershipId, user?.id])

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  // Saldo fresco de créditos de indicação (a sessão pode ser antiga)
  useEffect(() => {
    if (!user) return
    let active = true
    api
      .me(user.id)
      .then(({ user: fresh }) => {
        if (active && fresh) setCreditCents(fresh.creditCents ?? 0)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  // Trocou o item do checkout: volta o cupom ao estado inicial
  useEffect(() => {
    setCouponInput('')
    setCouponApplied(null)
    setCouponError(null)
    setCouponLoading(false)
    setUseCredits(false)
  }, [bundleId, courseId, trackId, membershipId])

  // Qual gateway está ativo? (ASAAS real vs modo demonstração)
  useEffect(() => {
    let active = true
    api
      .paymentsConfig()
      .then((cfg) => {
        if (active) setGateway(cfg)
      })
      .catch(() => {
        if (active) setGateway({ gateway: 'SIMULADO', env: null })
      })
    return () => {
      active = false
    }
  }, [])

  const isGateway = gateway?.gateway === 'ASAAS'

  /** Máscara leve de CPF/CNPJ para digitação */
  const maskCpfCnpj = (raw: string): string => {
    const v = raw.replace(/\D/g, '').slice(0, 14)
    if (v.length <= 11) {
      return v
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return v
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  /* ---------- Ações ---------- */

  const applyCoupon = async () => {
    if (!item || couponLoading) return
    const code = couponInput.trim().toUpperCase()
    if (!code) {
      setCouponApplied(null)
      setCouponError('Digite um cupom para aplicar.')
      return
    }
    setCouponLoading(true)
    setCouponError(null)
    try {
      const result = await api.validateCoupon({
        code,
        courseId: item.kind === 'course' ? item.id : undefined,
        trackId: item.kind === 'track' ? item.id : undefined,
        bundleId: item.kind === 'bundle' ? item.id : undefined,
        membershipId: item.kind === 'membership' ? item.id : undefined,
      })
      setCouponApplied(result)
      setCouponInput('')
    } catch (err) {
      setCouponApplied(null)
      setCouponError(err instanceof Error ? err.message : 'Não foi possível validar o cupom.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponApplied(null)
    setCouponInput('')
    setCouponError(null)
  }

  const doEnrollFree = async () => {
    if (!user || !item) return
    setFreeEnrolling(true)
    try {
      if (item.kind === 'bundle') {
        // Pacote gratuito: matrícula em todos os cursos inclusos
        const courses = item.bundleStats?.courses ?? []
        for (const c of courses) {
          await api.enrollCourse(c.id, user.id).catch(() => {})
        }
        toast.success('Inscrição realizada em todos os cursos do pacote! Boa jornada 🎉')
        navigate({ name: 'dashboard' })
      } else if (item.kind === 'track') {
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
    if (isGateway && cpfCnpj.replace(/\D/g, '').length < 11) {
      toast.error('Informe seu CPF/CNPJ para o pagamento seguro via Asaas.')
      return
    }
    setPaying(true)
    try {
      // A atribuição (utm/gclid/fbclid/canal/landing) viaja no mesmo corpo —
      // o servidor lê body.attribution para o pedido e o evento purchase.
      const payload = {
        userId: user.id,
        courseId: item.kind === 'course' ? item.id : undefined,
        trackId: item.kind === 'track' ? item.id : undefined,
        bundleId: item.kind === 'bundle' ? item.id : undefined,
        membershipId: item.kind === 'membership' ? item.id : undefined,
        paymentMethod,
        couponCode: couponApplied?.code || undefined,
        useCredits,
        cpfCnpj: isGateway ? cpfCnpj : undefined,
        attribution: getAttribution(),
      }
      const result = await api.checkout(payload)

      // Gateway real: cobrança criada — mostra PIX/fatura e aguarda o pagamento
      if ('pending' in result && result.pending) {
        setPendingPayment(result.payment)
        setPendingOrder(result.order)
        toast.info(
          result.payment.pix
            ? 'PIX gerado! Pague com o QR Code ou o copia e cola.'
            : 'Cobrança criada! Conclua na fatura segura do Asaas.'
        )
        return
      }

      const instant = result as CheckoutResultDTO
      trackEvent('purchase', {
        mentorId: item.mentor.id,
        courseId: item.kind === 'course' ? item.id : null,
        value: item.price,
        transactionId: instant.order.id,
        contentName: item.title,
      })
      toast.success('Pagamento aprovado! 🎉')
      setOrder(instant)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível concluir o pagamento.'
      toast.error(message)
      // Cupom pode ter esgotado/expirado entre a validação e o pagamento:
      // mostra o erro no fluxo normal e volta o cupom ao estado inicial.
      if (/cupom/i.test(message)) {
        setCouponApplied(null)
        setCouponInput('')
        setCouponError(message)
      }
      // Matrícula já existia (409): recarrega para exibir o estado "já inscrito"
      if (message.includes('já tem acesso') || message.includes('assinatura ativa')) void fetchSummary()
    } finally {
      setPaying(false)
    }
  }

  /** Consulta o status da cobrança pendente (sincroniza com o Asaas) */
  const checkPaymentStatus = async () => {
    if (!user || !pendingPayment || checkingStatus) return
    setCheckingStatus(true)
    try {
      const status = await api.paymentStatus(user.id, pendingPayment.id)
      if (status.status === 'PAID' || status.orderStatus === 'PAID') {
        if (pendingOrder) {
          setOrder({ order: pendingOrder } as CheckoutResultDTO)
        }
        setPendingPayment(null)
        toast.success('Pagamento confirmado! Acesso liberado 🎉')
      } else if (status.status === 'OVERDUE' || status.status === 'CANCELED' || status.orderStatus === 'CANCELED') {
        setPendingPayment(null)
        toast.error('A cobrança venceu ou foi cancelada. Gere uma nova.')
      } else {
        toast.info('Ainda não identificamos o pagamento. Tente novamente em instantes.')
      }
    } catch {
      toast.error('Não foi possível verificar o pagamento agora.')
    } finally {
      setCheckingStatus(false)
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
  if (error || (!course && !track && !bundle && !membership)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <Card className="mx-auto max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/50">
              <AlertCircle aria-hidden className="h-7 w-7 text-rose-500" />
            </span>
            <p className="font-bold text-stone-900 dark:text-stone-50">Não foi possível carregar o checkout</p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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

  /* ---------- Resumo normalizado (curso, trilha, pacote ou assinatura) ---------- */
  const item: ItemSummary | null = membership
    ? {
        kind: 'membership',
        id: membership.id,
        title: membership.title,
        coverUrl: null,
        category: 'Assinatura',
        level: '',
        price: membership.price,
        mentor: {
          id: membership.mentor.id,
          name: membership.mentor.name,
          rating: 0,
          reviewCount: 0,
          avatarUrl: membership.mentor.avatarUrl,
        },
        isEnrolled: membership.myStatus === 'ACTIVE',
        membershipStats: {
          coursesCount: membership.coursesCount,
          sessionLabel: groupSessionLabel(
            membership.groupSessionDay,
            membership.groupSessionTime
          ),
        },
      }
    : bundle
    ? {
        kind: 'bundle',
        id: bundle.id,
        title: bundle.title,
        coverUrl: bundle.courses.find((c) => c.coverUrl)?.coverUrl ?? null,
        category: bundle.courses[0]?.category ?? '',
        level: '',
        price: bundle.price,
        mentor: {
          id: bundle.mentor.id,
          name: bundle.mentor.name,
          rating: 0,
          reviewCount: 0,
          avatarUrl: bundle.mentor.avatarUrl,
        },
        isEnrolled:
          bundle.courseCount > 0 &&
          (bundle.myEnrolledCourseIds?.length ?? 0) >=
            bundle.courses.filter((c) => c.id).length,
        bundleStats: {
          courses: bundle.courses,
          coursesTotal: bundle.coursesTotal,
          discountPercent: bundle.discountPercent,
          enrolledCount: bundle.myEnrolledCourseIds?.length ?? 0,
        },
      }
    : track
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
  const isBundle = item.kind === 'bundle'
  const isMembership = item.kind === 'membership'

  // Descontos combinados: cupom + créditos de indicação
  const couponDiscount = couponApplied?.discount ?? 0
  const afterCoupon = Math.max(0, Math.round((item.price - couponDiscount) * 100) / 100)
  const creditsApplied =
    useCredits && creditCents > 0 ? Math.min(creditCents / 100, afterCoupon) : 0
  const finalAmount = Math.max(0, Math.round((afterCoupon - creditsApplied) * 100) / 100)

  /* ---------- Tela de AGUARDANDO PAGAMENTO (gateway Asaas) ---------- */
  if (pendingPayment && pendingOrder && item) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <Card className="mx-auto max-w-md rounded-2xl">
          <CardContent className="flex flex-col items-center gap-1.5 p-6 text-center sm:p-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <Clock aria-hidden className="h-9 w-9 text-amber-600 dark:text-amber-400" />
            </span>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl">
              Aguardando pagamento
            </h1>
            <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              <span className="font-semibold text-stone-700 dark:text-stone-200">
                “{pendingOrder.itemTitle}”
              </span>{' '}
              · {formatBRL(pendingPayment.value)} ·{' '}
              {METHOD_LABEL[pendingPayment.billingType] ?? pendingPayment.billingType}
              {pendingPayment.env === 'sandbox' && (
                <Badge variant="secondary" className="ml-1.5 rounded-full text-[10px]">
                  SANDBOX
                </Badge>
              )}
            </p>

            {/* PIX: QR + copia e cola */}
            {pendingPayment.pix ? (
              <div className="mt-4 w-full space-y-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 p-4">
                { }
                <img
                  src={`data:image/png;base64,${pendingPayment.pix.encodedImage}`}
                  alt="QR Code PIX para pagamento"
                  className="mx-auto h-44 w-44 rounded-lg bg-white p-1.5"
                />
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Escaneie no app do banco ou use o copia e cola:
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2 py-1.5 text-left text-[10px] text-stone-500 dark:text-stone-400">
                    {pendingPayment.pix.payload}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg"
                    onClick={() => {
                      void navigator.clipboard.writeText(pendingPayment.pix!.payload)
                      setCopiedPix(true)
                      toast.success('Código PIX copiado!')
                      window.setTimeout(() => setCopiedPix(false), 2500)
                    }}
                  >
                    {copiedPix ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
                    <span className="sr-only">Copiar código PIX</span>
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                {pendingPayment.billingType === 'CREDIT_CARD'
                  ? 'Conclua o pagamento com cartão na fatura segura do Asaas.'
                  : 'O boleto foi gerado — pague em qualquer banco ou lotérica.'}
              </p>
            )}

            <Button
              onClick={() =>
                pendingPayment.invoiceUrl && window.open(pendingPayment.invoiceUrl, '_blank', 'noopener')
              }
              variant={pendingPayment.pix ? 'outline' : 'default'}
              className="mt-4 h-12 w-full rounded-full font-bold"
              disabled={!pendingPayment.invoiceUrl}
            >
              <ExternalLink aria-hidden className="h-4 w-4" />
              Abrir fatura no Asaas
            </Button>
            <Button
              onClick={() => void checkPaymentStatus()}
              disabled={checkingStatus}
              className="mt-2.5 h-12 w-full rounded-full font-bold"
            >
              {checkingStatus ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Verificando…
                </>
              ) : (
                'Já paguei — verificar status'
              )}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
              O acesso é liberado automaticamente quando o pagamento cai. Em{' '}
              <span className="font-semibold">sandbox</span>, você também pode confirmar a cobrança
              no painel do Asaas ou pedir ao admin.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  /* ---------- Tela de SUCESSO (substitui o formulário) ---------- */
  if (order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <Card className="mx-auto max-w-md rounded-2xl">
          <CardContent className="flex flex-col items-center gap-1.5 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
              <CheckCircle2 aria-hidden className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            </span>
            <h1 className="mt-2 text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl">
              Pagamento confirmado!
            </h1>
            <p className="text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              Você já tem acesso a{' '}
              <span className="font-semibold text-stone-700 dark:text-stone-200">“{order.order.itemTitle}”</span>
            </p>

            <dl className="mt-5 w-full space-y-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 p-4 text-left text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500 dark:text-stone-400">Pedido</dt>
                <dd className="font-bold text-stone-800 dark:text-stone-200">#{order.order.id.slice(0, 8).toUpperCase()}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500 dark:text-stone-400">Método</dt>
                <dd className="font-bold text-stone-800 dark:text-stone-200">
                  {METHOD_LABEL[order.order.paymentMethod] ?? order.order.paymentMethod}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-stone-500 dark:text-stone-400">Total</dt>
                <dd className="font-extrabold text-emerald-700 dark:text-emerald-300">{formatBRL(order.order.amount)}</dd>
              </div>
            </dl>

            {isBundle ? (
              <>
                <p className="mt-1 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                  Todos os {item.bundleStats?.courses.length ?? 0} cursos do pacote já estão na sua conta.
                </p>
                <Button
                  onClick={() => navigate({ name: 'dashboard' })}
                  className="mt-4 h-12 w-full rounded-full font-bold"
                >
                  Ir para meus cursos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setExploreTab('bundles')
                    navigate({ name: 'marketplace' })
                  }}
                  className="w-full rounded-full"
                >
                  Explorar mais pacotes
                </Button>
              </>
            ) : isMembership ? (
              <>
                <p className="mt-1 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                  Todos os {item.membershipStats?.coursesCount ?? 0} cursos de {item.mentor.name} já
                  estão na sua conta, mais a sessão em grupo mensal.
                </p>
                <Button
                  onClick={() => navigate({ name: 'dashboard' })}
                  className="mt-4 h-12 w-full rounded-full font-bold"
                >
                  Ir para meus cursos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ name: 'mentor', mentorId: item.mentor.id })}
                  className="w-full rounded-full"
                >
                  Ver perfil do mentor
                </Button>
              </>
            ) : isTrack ? (
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
          isBundle
            ? (() => {
                setExploreTab('bundles')
                navigate({ name: 'marketplace' })
              })()
            : isMembership
              ? navigate({ name: 'mentor', mentorId: item.mentor.id })
              : isTrack
                ? navigate({ name: 'track', trackId: item.id })
                : navigate({ name: 'course', courseId: item.id })
        }
        className="-ml-2 h-10 gap-1.5 rounded-full px-3 font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-50"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {isBundle ? 'Voltar aos pacotes' : isMembership ? 'Voltar ao perfil' : isTrack ? 'Voltar à trilha' : 'Voltar ao curso'}
      </Button>
      <h1 className="mt-1 text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 sm:text-2xl">
        Checkout
      </h1>

      {/* Sem login: pedir para entrar */}
      {!user && (
        <Card className="mt-5 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50">
              <LogIn aria-hidden className="h-7 w-7 text-emerald-700 dark:text-emerald-300" />
            </span>
            <p className="font-bold text-stone-900 dark:text-stone-50">Entre para concluir a compra</p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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

      {/* Já tem acesso: libera navegação */}
      {user && item.isEnrolled && (
        <Card className="mt-5 rounded-2xl border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/50">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <CheckCircle2 aria-hidden className="h-7 w-7 text-emerald-700 dark:text-emerald-300" />
            </span>
            <p className="font-bold text-stone-900 dark:text-stone-50">
              {isBundle
                ? 'Você já tem acesso a todos os cursos deste pacote'
                : isMembership
                  ? 'Você já tem esta assinatura ativa'
                  : isTrack
                    ? 'Você já tem acesso a esta trilha'
                    : 'Você já tem acesso a este curso'}
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
              {isBundle
                ? `Sua conta já inclui os ${item.bundleStats?.courses.length ?? 0} cursos do pacote “${item.title}” — bons estudos!`
                : isMembership
                  ? `Sua assinatura “${item.title}” já está ativa — todos os cursos de ${item.mentor.name} liberados.`
                  : `Sua matrícula em “${item.title}” já está ativa — bons estudos!`}
            </p>
            <Button
              onClick={() =>
                isBundle
                  ? navigate({ name: 'dashboard' })
                  : isMembership
                    ? navigate({ name: 'dashboard' })
                    : isTrack
                      ? navigate({ name: 'track', trackId: item.id })
                      : navigate({ name: 'course', courseId: item.id })
              }
              className="mt-1 h-11 rounded-full px-6 font-bold"
            >
              {isBundle
                ? 'Ir para meus cursos'
                : isMembership
                  ? 'Ir para meus cursos'
                  : isTrack
                    ? 'Acessar a trilha'
                    : 'Ir para o curso'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Item gratuito: matrícula direta (defensivo — trilhas/pacotes gratuitos normalmente
          são inscritos direto na tela correspondente, sem passar pelo checkout) */}
      {user && !item.isEnrolled && item.price === 0 && (
        <div className="mt-5 flex flex-col items-center gap-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/50 p-8 text-center">
          <p className="font-bold text-stone-900 dark:text-stone-50">
            {isBundle ? 'Este pacote é gratuito' : isTrack ? 'Esta trilha é gratuita' : 'Este curso é gratuito'}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
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
                alt={`Capa ${isBundle ? 'do pacote' : isTrack ? 'da trilha' : 'do curso'} ${item.title}`}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="flex h-28 w-full items-center justify-center"
                style={avatarGradient(item.title)}
              >
                {isBundle ? (
                  <Layers className="h-8 w-8 text-white/20" />
                ) : isMembership ? (
                  <CreditCard className="h-8 w-8 text-white/20" />
                ) : isTrack ? (
                  <Route className="h-8 w-8 text-white/20" />
                ) : (
                  <Library className="h-8 w-8 text-white/20" />
                )}
              </div>
            )}

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-1.5">
                {isBundle ? (
                  <>
                    <Badge className="rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      <Layers aria-hidden className="h-3 w-3" /> Pacote
                    </Badge>
                    {item.bundleStats && item.bundleStats.discountPercent > 0 && (
                      <Badge className="rounded-full bg-amber-400 text-stone-950 hover:bg-amber-400">
                        Economize {item.bundleStats.discountPercent}%
                      </Badge>
                    )}
                  </>
                ) : isMembership ? (
                  <>
                    <Badge className="rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      <CreditCard aria-hidden className="h-3 w-3" /> Assinatura
                    </Badge>
                    <Badge className="rounded-full bg-amber-400 text-stone-950 hover:bg-amber-400">
                      Tudo incluído por {formatBRL(item.price)}/mês
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge className="rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                      {item.category}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300">
                      {LEVEL_LABELS[item.level] ?? item.level}
                    </Badge>
                  </>
                )}
              </div>

              <h2 className="mt-2.5 text-lg font-extrabold leading-snug text-stone-900 dark:text-stone-50">
                {item.title}
              </h2>

              {isTrack && item.trackStats && (
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen aria-hidden className="h-4 w-4 text-stone-400 dark:text-stone-500" />
                    Trilha com {item.trackStats.courseCount}{' '}
                    {item.trackStats.courseCount === 1 ? 'curso' : 'cursos'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden className="h-4 w-4 text-stone-400 dark:text-stone-500" />e{' '}
                    {item.trackStats.mentorshipSessions}{' '}
                    {item.trackStats.mentorshipSessions === 1 ? 'mentoria' : 'mentorias'} 1:1
                  </span>
                </p>
              )}

              {isBundle && item.bundleStats && (
                <ul className="mt-2.5 space-y-1.5">
                  {item.bundleStats.courses.map((c) => (
                    <li key={c.id} className="flex min-w-0 items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-1.5 text-stone-600 dark:text-stone-400">
                        <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">{c.title}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-stone-400 dark:text-stone-500 line-through">
                        {c.price === 0 ? 'Gratuito' : formatBRL(c.price)}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-2 pt-1 text-xs font-semibold">
                    <span className="text-stone-500 dark:text-stone-400">
                      {item.bundleStats.courses.length} cursos · valor cheio
                    </span>
                    <span className="text-stone-500 dark:text-stone-400 line-through">
                      {formatBRL(item.bundleStats.coursesTotal)}
                    </span>
                  </li>
                </ul>
              )}

              {isMembership && item.membershipStats && (
                <ul className="mt-2.5 space-y-1.5">
                  <li className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
                    <BookOpen aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    Todos os {item.membershipStats.coursesCount} cursos publicados de {item.mentor.name}
                  </li>
                  <li className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
                    <Users aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    Sessão em grupo mensal · {item.membershipStats.sessionLabel}
                  </li>
                  <li className="flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
                    <ShieldCheck aria-hidden className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    Cursos novos inclusos enquanto a assinatura estiver ativa
                  </li>
                </ul>
              )}

              <div className="mt-3 flex items-center gap-3">
                <Avatar name={item.mentor.name} src={item.mentor.avatarUrl} size="sm" />
                <div>
                  <p className="text-sm font-bold text-stone-800 dark:text-stone-200">{item.mentor.name}</p>
                  {item.mentor.rating > 0 && (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Stars rating={item.mentor.rating} size={12} />
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        ({item.mentor.reviewCount}{' '}
                        {item.mentor.reviewCount === 1 ? 'avaliação' : 'avaliações'})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Total</span>
                {couponApplied || creditsApplied > 0 ? (
                  <span className="text-2xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
                    {formatBRL(finalAmount)}
                  </span>
                ) : (
                  <span className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50">
                    {currencyBRL(item.price)}
                  </span>
                )}
              </div>
              {couponApplied && (
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-300">Desconto ({couponApplied.code})</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    −{formatBRL(couponApplied.discount)}
                  </span>
                </div>
              )}
              {creditsApplied > 0 && (
                <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                  <span className="text-emerald-700 dark:text-emerald-300">Créditos de indicação</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    −{formatBRL(creditsApplied)}
                  </span>
                </div>
              )}

              {/* ---- CRÉDITOS DE INDICAÇÃO ---- */}
              {creditCents > 0 && item.price > 0 && (
                <label
                  htmlFor="use-credits"
                  className={cn(
                    'mt-3 flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                    useCredits
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/50'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 hover:border-emerald-200 dark:hover:border-emerald-900'
                  )}
                >
                  <input
                    id="use-credits"
                    type="checkbox"
                    checked={useCredits}
                    onChange={(e) => setUseCredits(e.target.checked)}
                    className="size-4 accent-emerald-700"
                  />
                  <CircleDollarSign
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-stone-900 dark:text-stone-50">
                      Usar meus créditos ({formatBRL(creditCents / 100)})
                    </span>
                    <span className="block text-xs text-stone-500 dark:text-stone-400">
                      Saldo de indicações — descontado na hora
                    </span>
                  </span>
                </label>
              )}

              {/* ---- CUPOM DE DESCONTO (apenas itens pagos) ---- */}
              {couponApplied ? (
                <div className="mt-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="rounded-md border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-stone-950/50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        {couponApplied.code}
                      </span>
                      <span className="truncate text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        {couponApplied.label}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      aria-label="Remover cupom"
                      onClick={removeCoupon}
                      className="h-11 w-11 shrink-0 rounded-xl text-stone-400 dark:text-stone-500 hover:bg-white dark:hover:bg-stone-950/50 hover:text-stone-700 dark:hover:text-stone-200"
                    >
                      <X aria-hidden className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm text-stone-400 dark:text-stone-500 line-through">
                      {formatBRL(item.price)}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">com desconto</span>
                    <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                      {formatBRL(couponApplied.finalPrice)}
                    </span>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void applyCoupon()
                  }}
                  className="mt-3"
                >
                  <Label htmlFor="checkout-coupon" className="sr-only">
                    Cupom de desconto
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Tag
                        aria-hidden
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500"
                      />
                      <Input
                        id="checkout-coupon"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Cupom de desconto"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        className="h-11 rounded-xl pl-9 font-mono uppercase"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={couponLoading}
                      className="h-11 shrink-0 rounded-xl px-5 font-bold"
                    >
                      {couponLoading ? (
                        <>
                          <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Verificando…
                        </>
                      ) : (
                        'Aplicar'
                      )}
                    </Button>
                  </div>
                  <p aria-live="polite" className="mt-1.5 min-h-4 text-xs text-rose-600 dark:text-rose-400">
                    {couponError}
                  </p>
                </form>
              )}

              <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">
                Pagamento processado pela plataforma · demonstração
              </p>
            </div>
          </Card>

          {/* ---- AVISO DEMO ---- */}
          <div
            role="note"
            className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300"
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
              className="text-sm font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400"
            >
              Forma de pagamento
            </h2>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethodValue)}
              aria-labelledby="lp-pagamento-title"
              className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <Label
                htmlFor="pay-pix"
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-colors',
                  paymentMethod === 'PIX'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 ring-1 ring-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                )}
              >
                <RadioGroupItem value="PIX" id="pay-pix" className="mt-0.5" />
                <QrCode aria-hidden className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-stone-900 dark:text-stone-50">PIX</span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400">Aprovação imediata</span>
                </span>
              </Label>

              <Label
                htmlFor="pay-card"
                className={cn(
                  'cursor-pointer rounded-2xl border p-4 transition-colors',
                  paymentMethod === 'CREDIT_CARD'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 ring-1 ring-emerald-500'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                )}
              >
                <RadioGroupItem value="CREDIT_CARD" id="pay-card" className="mt-0.5" />
                <CreditCard aria-hidden className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <span className="flex-1">
                  <span className="block text-sm font-bold text-stone-900 dark:text-stone-50">Cartão de crédito</span>
                  <span className="block text-xs text-stone-500 dark:text-stone-400">
                    {isGateway ? 'Checkout seguro Asaas' : 'Em até 12x — simulação'}
                  </span>
                </span>
              </Label>

              {isGateway && (
                <Label
                  htmlFor="pay-boleto"
                  className={cn(
                    'cursor-pointer rounded-2xl border p-4 transition-colors',
                    paymentMethod === 'BOLETO'
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/50 ring-1 ring-emerald-500'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                  )}
                >
                  <RadioGroupItem value="BOLETO" id="pay-boleto" className="mt-0.5" />
                  <Landmark aria-hidden className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" />
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-stone-900 dark:text-stone-50">Boleto</span>
                    <span className="block text-xs text-stone-500 dark:text-stone-400">Vence em 3 dias</span>
                  </span>
                </Label>
              )}
            </RadioGroup>

            {/* CPF/CNPJ: exigido pelo gateway (Asaas) para emitir a cobrança */}
            {isGateway && (
              <div className="mt-4">
                <Label htmlFor="checkout-cpf" className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  CPF ou CNPJ do pagador
                </Label>
                <Input
                  id="checkout-cpf"
                  inputMode="numeric"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  className="mt-1.5 h-10 rounded-xl"
                />
                <p className="mt-1.5 text-xs leading-relaxed text-stone-400 dark:text-stone-500">
                  Usado apenas para emitir a cobrança no Asaas ({gateway?.env === 'production' ? 'produção' : 'sandbox'}).
                </p>
              </div>
            )}

            {/* PIX: instruções conforme o modo */}
            {paymentMethod === 'PIX' && (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/60 p-6 text-center">
                <QrCode aria-hidden className="h-24 w-24 text-stone-300 dark:text-stone-600" strokeWidth={1.25} />
                <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                  {isGateway
                    ? 'Ao confirmar, geramos o QR Code real do PIX (com copia e cola) para pagar no app do banco.'
                    : 'O QR Code aparece aqui em produção — pagamentos reais via gateway (Stripe/Mercado Pago).'}
                </p>
              </div>
            )}

            {/* Cartão: com gateway, a fatura hospedada do Asaas coleta o cartão com segurança */}
            {paymentMethod === 'CREDIT_CARD' && (
              <div className="mt-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5">
                {isGateway ? (
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                    <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    Ao confirmar, você vai para a fatura segura do Asaas para digitar os dados do
                    cartão — eles nunca passam pela nossa plataforma (PCI do gateway).
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="cc-number" className="text-xs font-semibold text-stone-600 dark:text-stone-300">
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
                        <Label htmlFor="cc-name" className="text-xs font-semibold text-stone-600 dark:text-stone-300">
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
                        <Label htmlFor="cc-exp" className="text-xs font-semibold text-stone-600 dark:text-stone-300">
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
                        <Label htmlFor="cc-cvv" className="text-xs font-semibold text-stone-600 dark:text-stone-300">
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
                    <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                      <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Ambiente de demonstração — não insira dados reais.
                    </p>
                  </>
                )}
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
                <Lock aria-hidden className="h-4 w-4" /> Pagar {formatBRL(finalAmount)}
              </>
            )}
          </Button>

          {/* ---- SEGURANÇA ---- */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-stone-400 dark:text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck aria-hidden className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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
