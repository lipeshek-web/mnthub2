import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAsaasConfig, ensureAsaasCustomer, createAsaasPayment, getPixQrCode, type AsaasBillingType } from '@/lib/asaas'
import { resolveCoupon, fulfillOrder } from '@/lib/fulfillment'
import { resolveUser, unauthorized } from '@/lib/session'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// ==================== CHECKOUT ====================
// Com chave do Asaas configurada (painel admin): cria o pedido PENDING + a
// cobrança real no gateway (sandbox em testes) e devolve a fatura/PIX. A
// liberação do acesso acontece quando o pagamento cai (webhook, confirmação
// manual no sandbox ou ação do admin).
// Sem chave: modo demonstração — pedido é pago na hora (igual a antes), com
// registro Payment marcado como SIMULADO.

/** Valida CPF (11 dígitos) ou CNPJ (14) pelos dígitos verificadores */
function isValidCpfCnpj(raw: string): boolean {
  const v = raw.replace(/\D/g, '')
  if (v.length === 11) {
    if (/^(\d)\1{10}$/.test(v)) return false
    const calc = (len: number) => {
      let sum = 0
      for (let i = 0; i < len; i++) sum += Number(v[i]) * (len + 1 - i)
      const rest = (sum * 10) % 11
      return rest === 10 ? 0 : rest
    }
    return calc(9) === Number(v[9]) && calc(10) === Number(v[10])
  }
  if (v.length === 14) {
    if (/^(\d)\1{13}$/.test(v)) return false
    const calc = (len: number) => {
      let sum = 0
      let weight = len - 7
      for (let i = 0; i < len; i++) {
        sum += Number(v[i]) * weight--
        if (weight < 2) weight = 9
      }
      const rest = sum % 11
      return rest < 2 ? 0 : 11 - rest
    }
    return calc(12) === Number(v[12]) && calc(13) === Number(v[13])
  }
  return false
}

/**
 * Aplica créditos de indicação (R$) sobre o valor pós-cupom — apenas cálculo.
 * ANTI DOUBLE-SPEND: créditos já "reservados" por pedidos PENDING do usuário
 * não ficam disponíveis — antes, dois checkouts simultâneos consumiam o
 * mesmo saldo duas vezes (débito em fulfill campa no chão 0, segunda compra
 * saía grátis).
 */
async function previewCredits(
  userId: string,
  basePrice: number,
  couponDiscount: number,
  useCredits: boolean
): Promise<{ amount: number; creditsUsed: number }> {
  const afterCoupon = Math.max(0, Math.round((basePrice - couponDiscount) * 100) / 100)
  if (!useCredits || afterCoupon <= 0) return { amount: afterCoupon, creditsUsed: 0 }
  const [user, pending] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { creditCents: true } }),
    db.order.aggregate({
      where: { studentId: userId, status: 'PENDING' },
      _sum: { creditsUsed: true },
    }),
  ])
  const reservedCents = Math.round((pending._sum.creditsUsed ?? 0) * 100)
  const balanceCents = Math.max(0, (user?.creditCents ?? 0) - reservedCents)
  if (balanceCents <= 0) return { amount: afterCoupon, creditsUsed: 0 }
  const usable = balanceCents / 100
  const creditsUsed = Math.min(usable, afterCoupon)
  const amount = Math.max(0, Math.round((afterCoupon - creditsUsed) * 100) / 100)
  return { amount, creditsUsed }
}

export async function POST(req: NextRequest) {
  // Identidade da SESSÃO (checkout mexe com dinheiro — userId do corpo era
  // spoofável) + rate limit contra criação em massa de pedidos/cobranças
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  const gate = rateLimit(`checkout:${session.id}:${clientIp(req)}`, 12, 5 * 60_000)
  if (!gate.ok) return tooMany(gate.retryAfterSec)
  try {
    const body = await req.json().catch(() => ({}))
    const userId = session.id
    const courseId = String(body?.courseId ?? '')
    const trackId = String(body?.trackId ?? '')
    const bundleId = String(body?.bundleId ?? '')
    const membershipId = String(body?.membershipId ?? '')
    const bookingId = String(body?.bookingId ?? '')
    const useCredits = body?.useCredits === true
    const billingType: AsaasBillingType =
      body?.paymentMethod === 'CREDIT_CARD'
        ? 'CREDIT_CARD'
        : body?.paymentMethod === 'BOLETO'
          ? 'BOLETO'
          : 'PIX'
    const couponCode = String(body?.couponCode ?? '').trim()
    const rawCpf = String(body?.cpfCnpj ?? '').trim()

    const kindCount = [courseId, trackId, bundleId, membershipId, bookingId].filter(Boolean).length
    if (!userId || kindCount !== 1) {
      return NextResponse.json({ error: 'Dados incompletos para o checkout.' }, { status: 400 })
    }
    // bookingId é ÚNICO em Order (1 pedido por sessão): quando existe um pedido
    // antigo não-pago, ele é REUTILIZADO no lugar de criar um novo.
    let reuseOrderId: string | null = null

    const attr = (body?.attribution ?? {}) as Record<string, unknown>
    const s = (v: unknown, max = 190) => {
      const str = String(v ?? '').trim()
      return str ? str.slice(0, max) : null
    }
    const channel = s(attr.channel, 40) || 'direct'
    const landingPage = attr.landingPage === 'mentor_lp' ? 'mentor_lp' : 'platform'
    const attributionFields = {
      utmSource: s(attr.utmSource),
      utmMedium: s(attr.utmMedium),
      utmCampaign: s(attr.utmCampaign, 120),
      utmContent: s(attr.utmContent, 120),
      utmTerm: s(attr.utmTerm, 120),
      gclid: s(attr.gclid),
      fbclid: s(attr.fbclid),
      channel,
      landingPage,
    }

    const [user, asaas] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      getAsaasConfig(),
    ])
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    if (user.blocked) return NextResponse.json({ error: 'Conta bloqueada.' }, { status: 403 })

    const gatewayActive = asaas.apiKey.length > 0

    // Documento obrigatório quando o dinheiro passa pelo gateway
    if (gatewayActive && !isValidCpfCnpj(rawCpf)) {
      return NextResponse.json(
        { error: 'Informe um CPF/CNPJ válido para o pagamento (é exigido pelo gateway).' },
        { status: 400 }
      )
    }
    const userCpf: string = gatewayActive ? rawCpf.replace(/\D/g, '') : (user.cpfCnpj ?? '')

    // ---------- Resolução do item (comum aos 4 tipos) ----------
    interface ResolvedItem {
      kind: 'COURSE' | 'TRACK' | 'BUNDLE' | 'MEMBERSHIP' | 'BOOKING'
      id: string
      title: string
      price: number
      mentorId: string
      alreadyOwned: string | null
    }
    let item: ResolvedItem | null = null

    if (bookingId) {
      // Sessão 1:1 paga — só o próprio mentorado paga, sessão válida e sem pedido
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: { mentor: { include: { user: { select: { name: true } } } } },
      })
      if (!booking) {
        return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })
      }
      if (booking.menteeId !== userId) {
        return NextResponse.json({ error: 'Esta sessão não é sua.' }, { status: 403 })
      }
      if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
        return NextResponse.json(
          { error: 'Esta sessão não está mais aberta para pagamento.' },
          { status: 400 }
        )
      }
      if (booking.price <= 0) {
        return NextResponse.json({ error: 'Esta sessão não tem valor a pagar.' }, { status: 409 })
      }

      const existingOrder = await db.order.findUnique({
        where: { bookingId },
        select: { id: true, status: true, amount: true, paymentMethod: true, createdAt: true },
      })
      if (existingOrder && existingOrder.status === 'PAID') {
        return NextResponse.json({ error: 'Esta sessão já está paga.' }, { status: 409 })
      }
      if (existingOrder) {
        const pendingPayment = await db.payment.findFirst({
          where: { orderId: existingOrder.id, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        })
        if (pendingPayment && pendingPayment.gateway === 'ASAAS' && pendingPayment.gatewayPaymentId) {
          // RETOMADA: devolve a MESMA cobrança aberta (PIX segue válido) em vez
          // de travar com 409 — "Pagar agora" de novo reabre o QR/a fatura.
          let pix: { payload: string; encodedImage: string } | undefined
          if (pendingPayment.billingType === 'PIX') {
            try {
              const qr = await getPixQrCode(asaas, pendingPayment.gatewayPaymentId)
              pix = { payload: qr.payload, encodedImage: qr.encodedImage }
            } catch {
              // QR indisponível agora: a fatura continua utilizável
            }
          }
          return NextResponse.json({
            pending: true,
            order: {
              id: existingOrder.id,
              itemKind: 'BOOKING',
              itemTitle: `Sessão 1:1 — ${booking.topic}`,
              amount: pendingPayment.value,
              paymentMethod: pendingPayment.billingType,
              status: 'PENDING',
              createdAt: existingOrder.createdAt.toISOString(),
            },
            payment: {
              id: pendingPayment.id,
              gatewayPaymentId: pendingPayment.gatewayPaymentId,
              billingType: pendingPayment.billingType,
              status: pendingPayment.status,
              value: pendingPayment.value,
              invoiceUrl: pendingPayment.invoiceUrl,
              env: asaas.env,
              pix,
            },
          })
        }
        // Pedido antigo sem cobrança viva (simulada/cancelada): REUTILIZA o
        // registro (bookingId é único) e mata qualquer cobrança velha aberta.
        reuseOrderId = existingOrder.id
        await db.payment
          .updateMany({
            where: { orderId: existingOrder.id, status: 'PENDING' },
            data: { status: 'CANCELED', lastEvent: 'substituida_novo_checkout', lastEventAt: new Date() },
          })
          .catch(() => {})
      }

      item = {
        kind: 'BOOKING',
        id: booking.id,
        title: `Sessão 1:1 — ${booking.topic}`,
        price: booking.price,
        mentorId: booking.mentorId,
        alreadyOwned: null,
      }
    } else if (membershipId) {
      const membership = await db.mentorMembership.findUnique({ where: { id: membershipId } })
      if (!membership || !membership.isPublished) {
        return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
      }
      const existingSub = await db.membershipSubscription.findUnique({
        where: { membershipId_userId: { membershipId, userId } },
      })
      item = {
        kind: 'MEMBERSHIP',
        id: membership.id,
        title: membership.title,
        price: membership.price,
        mentorId: membership.mentorId,
        alreadyOwned: existingSub && existingSub.status === 'ACTIVE' ? 'Você já tem esta assinatura ativa.' : null,
      }
    } else if (bundleId) {
      const bundle = await db.bundle.findUnique({
        where: { id: bundleId },
        include: { items: { select: { courseId: true } } },
      })
      if (!bundle || !bundle.isPublished) {
        return NextResponse.json({ error: 'Pacote não encontrado.' }, { status: 404 })
      }
      const courseIds = bundle.items.map((i) => i.courseId)
      const existing = await db.enrollment.findMany({
        where: { studentId: userId, courseId: { in: courseIds } },
        select: { courseId: true },
      })
      item = {
        kind: 'BUNDLE',
        id: bundle.id,
        title: bundle.title,
        price: bundle.price,
        mentorId: bundle.mentorId,
        alreadyOwned:
          courseIds.length > 0 && existing.length >= courseIds.length
            ? 'Você já tem acesso a todos os cursos deste pacote.'
            : null,
      }
    } else if (trackId) {
      const track = await db.track.findUnique({ where: { id: trackId } })
      if (!track || !track.isPublished) {
        return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })
      }
      const existingTrackEnrollment = await db.trackEnrollment.findUnique({
        where: { trackId_studentId: { trackId, studentId: userId } },
      })
      item = {
        kind: 'TRACK',
        id: track.id,
        title: track.title,
        price: track.price,
        mentorId: track.mentorId,
        alreadyOwned: existingTrackEnrollment ? 'Você já tem acesso a esta trilha.' : null,
      }
    } else {
      const course = await db.course.findUnique({ where: { id: courseId } })
      if (!course || !course.isPublished) {
        return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
      }
      const existing = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId, studentId: userId } },
      })
      item = {
        kind: 'COURSE',
        id: course.id,
        title: course.title,
        price: course.price,
        mentorId: course.mentorId,
        alreadyOwned: existing ? 'Você já tem acesso a este curso.' : null,
      }
    }

    if (item.alreadyOwned) {
      return NextResponse.json({ error: item.alreadyOwned }, { status: 409 })
    }

    // ---------- Cupom + créditos (cálculo; consumo só quando pagar) ----------
    const { error: couponError, coupon, discount } = await resolveCoupon(couponCode, {
      userId,
      item: { kind: item.kind, id: item.id, mentorId: item.mentorId, price: item.price },
    })
    if (couponError) return NextResponse.json({ error: couponError }, { status: 400 })

    const credits = await previewCredits(userId, item.price, discount, useCredits)
    const finalAmount = credits.amount

    // ---------- Cria o pedido (PENDING; liberação via fulfillOrder) ----------
    // bookingId único: pedido antigo não-pago da mesma sessão é ATUALIZADO aqui.
    const order = reuseOrderId
      ? await db.order.update({
          where: { id: reuseOrderId },
          data: {
            amount: finalAmount,
            paymentMethod: billingType,
            status: 'PENDING',
            couponCode: coupon ? coupon.code : null,
            discount,
            creditsUsed: credits.creditsUsed,
          },
        })
      : await db.order.create({
          data: {
            courseId: item.kind === 'COURSE' ? item.id : null,
            trackId: item.kind === 'TRACK' ? item.id : null,
            bundleId: item.kind === 'BUNDLE' ? item.id : null,
            membershipId: item.kind === 'MEMBERSHIP' ? item.id : null,
            bookingId: item.kind === 'BOOKING' ? item.id : null,
            studentId: userId,
            mentorId: item.mentorId,
            amount: finalAmount,
            paymentMethod: billingType,
            status: 'PENDING',
            couponCode: coupon ? coupon.code : null,
            discount,
            creditsUsed: credits.creditsUsed,
            ...attributionFields,
          },
        })

    /**
     * Payment.orderId é ÚNICO (1 pagamento por pedido): quando o pedido foi
     * reaproveitado (bookingId único), a linha antiga é ATUALIZADA em vez de
     * criar outra — evita P2002 no checkout de retomada.
     */
    async function savePayment(data: {
      gateway: string
      billingType: AsaasBillingType
      status: string
      value: number
      gatewayPaymentId?: string | null
      invoiceUrl?: string | null
      externalReference: string
      lastEvent: string
    }) {
      const payload = { ...data, lastEventAt: new Date() }
      const rows = await db.payment.count({ where: { orderId: order.id } })
      if (rows > 0) {
        return db.payment.update({ where: { orderId: order.id }, data: payload })
      }
      return db.payment.create({ data: { orderId: order.id, userId, ...payload } })
    }

    // ---------- Sem gateway: modo demonstração (paga na hora) ----------
    // Valor zerado (cupom 100% + créditos): não cobra gateway — libera direto
    if (gatewayActive && finalAmount <= 0) {
      await savePayment({
        gateway: 'SIMULATED',
        billingType,
        status: 'PENDING',
        value: 0,
        externalReference: order.id,
        lastEvent: 'valor_zerado',
      })
      const result = await fulfillOrder(order.id)
      if (!result.ok) {
        return NextResponse.json({ error: 'Erro ao liberar o acesso.' }, { status: 500 })
      }
      return NextResponse.json({
        order: {
          id: order.id,
          itemKind: item.kind,
          itemTitle: item.title,
          amount: 0,
          paymentMethod: billingType,
          status: 'PAID',
          createdAt: order.createdAt.toISOString(),
        },
        alreadyEnrolled: false,
      })
    }

    if (!gatewayActive) {
      await savePayment({
        gateway: 'SIMULATED',
        billingType,
        status: 'PENDING',
        value: finalAmount,
        externalReference: order.id,
        lastEvent: 'checkout_simulado',
      })
      const result = await fulfillOrder(order.id)
      if (!result.ok) {
        return NextResponse.json({ error: 'Erro ao liberar o acesso.' }, { status: 500 })
      }
      return NextResponse.json({
        order: {
          id: order.id,
          itemKind: item.kind,
          itemTitle: item.title,
          amount: finalAmount,
          paymentMethod: billingType,
          status: 'PAID',
          createdAt: order.createdAt.toISOString(),
        },
        alreadyEnrolled: false,
      })
    }

    // ---------- Gateway real (Asaas, sandbox em testes) ----------
    try {
      const customerId = await ensureAsaasCustomer(asaas, user, userCpf)
      const origin = req.headers.get('origin') || req.nextUrl.origin
      const asaasPayment = await createAsaasPayment(asaas, {
        customerId,
        billingType,
        value: finalAmount,
        description: `Órbita — ${item.kind === 'COURSE' ? 'Curso' : item.kind === 'TRACK' ? 'Trilha' : item.kind === 'BUNDLE' ? 'Pacote' : item.kind === 'BOOKING' ? 'Sessão 1:1' : 'Assinatura'}: ${item.title}`.replace(/[\n\r]+/g, ' '),
        externalReference: order.id,
        callbackSuccessUrl: `${origin}/?checkout=obrigado`,
      })

      let pix: { payload: string; encodedImage: string } | undefined
      if (billingType === 'PIX') {
        try {
          const qr = await getPixQrCode(asaas, asaasPayment.id)
          pix = { payload: qr.payload, encodedImage: qr.encodedImage }
        } catch {
          // Fatura continua utilizável mesmo sem QR inline
        }
      }

      const payment = await savePayment({
        gateway: 'ASAAS',
        billingType,
        status: 'PENDING',
        value: finalAmount,
        gatewayPaymentId: asaasPayment.id,
        invoiceUrl: asaasPayment.invoiceUrl,
        externalReference: order.id,
        lastEvent: 'cobranca_criada',
      })

      return NextResponse.json({
        pending: true,
        order: {
          id: order.id,
          itemKind: item.kind,
          itemTitle: item.title,
          amount: finalAmount,
          paymentMethod: billingType,
          status: 'PENDING',
          createdAt: order.createdAt.toISOString(),
        },
        payment: {
          id: payment.id,
          gatewayPaymentId: asaasPayment.id,
          billingType,
          status: 'PENDING',
          value: finalAmount,
          invoiceUrl: asaasPayment.invoiceUrl,
          env: asaas.env,
          pix,
        },
      })
    } catch (asaasErr) {
      // Gateway falhou: cancela o pedido local e devolve a mensagem real
      await db.order.update({ where: { id: order.id }, data: { status: 'CANCELED' } }).catch(() => {})
      const message =
        asaasErr instanceof Error ? asaasErr.message : 'Falha ao criar a cobrança no Asaas.'
      console.error('POST /api/checkout (asaas)', asaasErr)
      return NextResponse.json(
        { error: `O gateway não conseguiu criar a cobrança: ${message}` },
        { status: 502 }
      )
    }
  } catch (err) {
    console.error('POST /api/checkout', err)
    return NextResponse.json({ error: 'Erro ao processar o checkout.' }, { status: 500 })
  }
}
