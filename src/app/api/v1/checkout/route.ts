import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  getAsaasConfig,
  ensureAsaasCustomer,
  createAsaasPayment,
  getPixQrCode,
  type AsaasBillingType,
} from '@/lib/asaas'
import { resolveCoupon, fulfillOrder } from '@/lib/fulfillment'
import { requireMobileUser } from '@/lib/mobile-auth'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'
import { v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

// ==================== CHECKOUT (API MOBILE v1) ====================
// Espelho do POST /api/checkout (site) autenticado por JWT Bearer: cria o
// pedido PENDING + a cobrança real no gateway (PIX com QR/copía-e-cola,
// cartão ou boleto com fatura) e devolve os dados para o app exibir e
// acompanhar (status em GET /api/v1/payments/status).
// Sem chave do gateway: modo demonstração — pedido é pago na hora
// (Payment SIMULADO), igual ao site.

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
 * não ficam disponíveis (mesma regra do checkout web).
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

/** POST /api/v1/checkout — body: { courseId, paymentMethod?, couponCode?, useCredits?, cpfCnpj? } */
export async function POST(req: NextRequest) {
  const user = await requireMobileUser(req)
  if (!user) return v1Error('Sessão expirada. Faça login novamente.', 401)
  const gate = rateLimit(`checkout:${user.id}:${clientIp(req)}`, 12, 5 * 60_000)
  if (!gate.ok) return v1Error('Muitas tentativas. Aguarde alguns minutos.', 429)

  try {
    const body = await req.json().catch(() => ({}))
    const userId = user.id
    const courseId = String(body?.courseId ?? '')
    const useCredits = body?.useCredits === true
    const billingType: AsaasBillingType =
      body?.paymentMethod === 'CREDIT_CARD'
        ? 'CREDIT_CARD'
        : body?.paymentMethod === 'BOLETO'
          ? 'BOLETO'
          : 'PIX'
    const couponCode = String(body?.couponCode ?? '').trim()
    const rawCpf = String(body?.cpfCnpj ?? '').trim()

    if (!courseId) return v1Error('Dados incompletos para o checkout.', 400)

    const [fullUser, asaas] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      getAsaasConfig(),
    ])
    if (!fullUser) return v1Error('Usuário não encontrado.', 404)
    if (fullUser.blocked) return v1Error('Conta bloqueada.', 403)

    const gatewayActive = asaas.apiKey.length > 0

    // Documento obrigatório quando o dinheiro passa pelo gateway
    if (gatewayActive && !isValidCpfCnpj(rawCpf)) {
      return v1Error('Informe um CPF/CNPJ válido para o pagamento (é exigido pelo gateway).', 400)
    }
    const userCpf: string = gatewayActive ? rawCpf.replace(/\D/g, '') : (fullUser.cpfCnpj ?? '')

    // ---------- Curso ----------
    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course || !course.isPublished) return v1Error('Curso não encontrado.', 404)

    const existing = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: userId } },
    })
    if (existing) return v1Error('Você já tem acesso a este curso.', 409)

    // ---------- Cupom + créditos (cálculo; consumo só quando pagar) ----------
    const { error: couponError, coupon, discount } = await resolveCoupon(couponCode, {
      userId,
      item: { kind: 'COURSE', id: course.id, mentorId: course.mentorId, price: course.price },
    })
    if (couponError) return v1Error(couponError, 400)

    const credits = await previewCredits(userId, course.price, discount, useCredits)
    const finalAmount = credits.amount

    // ---------- Cria o pedido (PENDING; liberação via fulfillOrder) ----------
    const order = await db.order.create({
      data: {
        courseId: course.id,
        studentId: userId,
        mentorId: course.mentorId,
        amount: finalAmount,
        paymentMethod: billingType,
        status: 'PENDING',
        couponCode: coupon ? coupon.code : null,
        discount,
        creditsUsed: credits.creditsUsed,
        channel: 'app',
        landingPage: 'platform',
      },
    })

    // ---------- Valor zerado (cupom 100% + créditos): não cobra gateway ----------
    if (finalAmount <= 0) {
      await db.payment.create({
        data: {
          orderId: order.id,
          userId,
          gateway: 'SIMULATED',
          billingType,
          status: 'PENDING',
          value: 0,
          externalReference: order.id,
          lastEvent: 'valor_zerado',
          lastEventAt: new Date(),
        },
      })
      const result = await fulfillOrder(order.id)
      if (!result.ok) return v1Error('Erro ao liberar o acesso.', 500)
      return v1Json({
        order: {
          id: order.id,
          itemKind: 'COURSE',
          itemTitle: course.title,
          amount: 0,
          paymentMethod: billingType,
          status: 'PAID',
          createdAt: order.createdAt.toISOString(),
        },
      })
    }

    // ---------- Sem gateway: modo demonstração (paga na hora) ----------
    if (!gatewayActive) {
      await db.payment.create({
        data: {
          orderId: order.id,
          userId,
          gateway: 'SIMULATED',
          billingType,
          status: 'PENDING',
          value: finalAmount,
          externalReference: order.id,
          lastEvent: 'checkout_simulado',
          lastEventAt: new Date(),
        },
      })
      const result = await fulfillOrder(order.id)
      if (!result.ok) return v1Error('Erro ao liberar o acesso.', 500)
      return v1Json({
        order: {
          id: order.id,
          itemKind: 'COURSE',
          itemTitle: course.title,
          amount: finalAmount,
          paymentMethod: billingType,
          status: 'PAID',
          createdAt: order.createdAt.toISOString(),
        },
      })
    }

    // ---------- Gateway real (Asaas) ----------
    try {
      const customerId = await ensureAsaasCustomer(asaas, fullUser, userCpf)
      const asaasPayment = await createAsaasPayment(asaas, {
        customerId,
        billingType,
        value: finalAmount,
        description: `MentorHub — Curso: ${course.title}`.replace(/[\n\r]+/g, ' '),
        externalReference: order.id,
        callbackSuccessUrl: `https://mentorhub.space-z.ai/?checkout=obrigado`,
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

      const payment = await db.payment.create({
        data: {
          orderId: order.id,
          userId,
          gateway: 'ASAAS',
          gatewayPaymentId: asaasPayment.id,
          billingType,
          status: 'PENDING',
          value: finalAmount,
          invoiceUrl: asaasPayment.invoiceUrl,
          externalReference: order.id,
          lastEvent: 'cobranca_criada',
          lastEventAt: new Date(),
        },
      })

      return v1Json({
        pending: true,
        order: {
          id: order.id,
          itemKind: 'COURSE',
          itemTitle: course.title,
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
      console.error('POST /api/v1/checkout (asaas)', asaasErr)
      return v1Error(`O gateway não conseguiu criar a cobrança: ${message}`, 502)
    }
  } catch (err) {
    console.error('POST /api/v1/checkout', err)
    return v1Error('Erro ao processar o checkout.', 500)
  }
}
