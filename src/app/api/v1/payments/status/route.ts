import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAsaasConfig, getAsaasPayment, mapAsaasStatus } from '@/lib/asaas'
import { fulfillOrder } from '@/lib/fulfillment'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

// GET /api/v1/payments/status?paymentId= — estado de uma cobrança do aluno
// autenticado (JWT Bearer). Igual ao /api/payments/status do site: quando a
// cobrança é do Asaas, sincroniza com o gateway — se já caiu lá, libera o
// acesso aqui (cobre o caso do webhook não alcançável).
export async function GET(req: NextRequest) {
  const user = await requireMobileUser(req)
  if (!user) return v1Error('Sessão expirada. Faça login novamente.', 401)

  try {
    const paymentId = req.nextUrl.searchParams.get('paymentId')?.trim() ?? ''
    if (!paymentId) return v1Error('Dados incompletos.', 400)

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, status: true } } },
    })
    if (!payment || payment.userId !== user.id) {
      return v1Error('Cobrança não encontrada.', 404)
    }

    const paidStatuses = ['RECEIVED', 'CONFIRMED']
    const isPaid = paidStatuses.includes(payment.status) || payment.order.status === 'PAID'
    if (isPaid) {
      return v1Json({
        status: 'PAID',
        orderStatus: 'PAID',
        billingType: payment.billingType,
        invoiceUrl: payment.invoiceUrl,
      })
    }

    // Pendente: com gateway ativo, pergunta ao Asaas como está a cobrança
    if (payment.gateway === 'ASAAS' && payment.gatewayPaymentId) {
      const config = await getAsaasConfig()
      if (config.apiKey) {
        try {
          const remote = await getAsaasPayment(config, payment.gatewayPaymentId)
          const localStatus = mapAsaasStatus(remote.status)
          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: localStatus,
              lastEvent: `sync:${remote.status}`,
              lastEventAt: new Date(),
            },
          })
          if (localStatus === 'RECEIVED' || localStatus === 'CONFIRMED') {
            await fulfillOrder(payment.orderId)
            return v1Json({
              status: 'PAID',
              orderStatus: 'PAID',
              billingType: payment.billingType,
              invoiceUrl: payment.invoiceUrl,
            })
          }
          if (localStatus === 'OVERDUE' || localStatus === 'CANCELED') {
            await db.order
              .update({ where: { id: payment.orderId }, data: { status: 'CANCELED' } })
              .catch(() => {})
            return v1Json({
              status: localStatus,
              orderStatus: 'CANCELED',
              billingType: payment.billingType,
              invoiceUrl: payment.invoiceUrl,
            })
          }
        } catch {
          // Falha ao consultar o gateway: mantém pendente local
        }
      }
    }

    return v1Json({
      status: payment.status,
      orderStatus: payment.order.status,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
    })
  } catch (err) {
    console.error('GET /api/v1/payments/status', err)
    return v1Error('Erro ao consultar o pagamento.', 500)
  }
}
