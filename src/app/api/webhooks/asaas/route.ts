import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { getAsaasConfig, mapAsaasStatus } from '@/lib/asaas'
import { fulfillOrder } from '@/lib/fulfillment'
import { refundOrder } from '@/lib/refunds'

export const dynamic = 'force-dynamic'

/** Comparação em tempo constante (evita timing attack no token do webhook) */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

// ==================== WEBHOOK DO ASAAS ====================
// Recebe eventos de pagamento (PAYMENT_RECEIVED/CONFIRMED/OVERDUE/REFUNDED).
// Autenticação: header `asaas-access-token` deve bater com o authToken gerado
// quando o webhook foi criado (painel admin). Processamento idempotente.

interface AsaasWebhookPayload {
  event?: string
  payment?: {
    id?: string
    externalReference?: string | null
    status?: string
    value?: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const config = await getAsaasConfig()
    const received = req.headers.get('asaas-access-token') ?? ''

    if (!config.webhookToken || !safeEqual(received, config.webhookToken)) {
      // Sem token configurado ou token errado: rejeita (Asaas tenta de novo)
      return NextResponse.json({ error: 'Token do webhook inválido.' }, { status: 401 })
    }

    const payload = (await req.json().catch(() => ({}))) as AsaasWebhookPayload
    const event = String(payload?.event ?? '')
    const asaasId = String(payload?.payment?.id ?? '')
    const externalRef = payload?.payment?.externalReference ?? null

    if (!asaasId && !externalRef) {
      return NextResponse.json({ received: true, ignored: 'sem referência de cobrança' })
    }

    // Localiza a cobrança local (por id do gateway, com fallback p/ externalReference)
    const payment = (await db.payment.findUnique({ where: { gatewayPaymentId: asaasId } })) ??
      (externalRef
        ? await db.payment.findFirst({
            where: { OR: [{ gatewayPaymentId: asaasId }, { orderId: externalRef, gateway: 'ASAAS' }] },
          })
        : null)

    if (!payment) {
      // Cobrança desconhecida (ex.: criada direto no painel do Asaas)
      return NextResponse.json({ received: true, ignored: 'cobrança não encontrada na plataforma' })
    }

    const now = new Date()

    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED': {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: event === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : 'RECEIVED',
            lastEvent: event,
            lastEventAt: now,
          },
        })
        // Libera o acesso (idempotente — reenvios não duplicam matrícula)
        const result = await fulfillOrder(payment.orderId)
        return NextResponse.json({ received: true, fulfilled: result.ok, already: result.alreadyFulfilled })
      }
      case 'PAYMENT_OVERDUE': {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'OVERDUE', lastEvent: event, lastEventAt: now },
        })
        // Só cancela pedido ainda PENDING: um OVERDUE fora de ordem (atrasado)
        // nunca pode virar um pedido já PAGO em CANCELED
        await db.order.updateMany({
          where: { id: payment.orderId, status: 'PENDING' },
          data: { status: 'CANCELED' },
        })
        return NextResponse.json({ received: true })
      }
      case 'PAYMENT_REFUNDED': {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED', lastEvent: event, lastEventAt: now },
        })
        // Estorno completo: PAID → REFUNDED (claim atômico) + revogação do
        // acesso concedido (matrículas/assinatura/sessão) + devolução de créditos
        const result = await refundOrder(payment.orderId, { viaGateway: true })
        return NextResponse.json({ received: true, refunded: result.ok, reason: result.error ?? null })
      }
      default: {
        // PAYMENT_CREATED e outros: apenas registra o último evento
        await db.payment
          .update({
            where: { id: payment.id },
            data: {
              lastEvent: event,
              lastEventAt: now,
              status: mapAsaasStatus(payload?.payment?.status ?? ''),
            },
          })
          .catch(() => {})
        return NextResponse.json({ received: true })
      }
    }
  } catch (err) {
    console.error('POST /api/webhooks/asaas', err)
    // 500 faz o Asaas reenviar (retry) — adequado para erros transitórios
    return NextResponse.json({ error: 'Erro ao processar o webhook.' }, { status: 500 })
  }
}
