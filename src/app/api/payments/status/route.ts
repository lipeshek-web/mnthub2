import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAsaasConfig, getAsaasPayment, mapAsaasStatus } from '@/lib/asaas'
import { fulfillOrder } from '@/lib/fulfillment'

export const dynamic = 'force-dynamic'

// GET /api/payments/status?userId=&paymentId=
// Consulta o estado de uma cobrança do próprio usuário. Quando a cobrança é
// do Asaas, sincroniza com o gateway — se já caiu lá, libera o acesso aqui
// (cobre o caso do webhook não alcançável em ambiente local).
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')?.trim() ?? ''
    const paymentId = req.nextUrl.searchParams.get('paymentId')?.trim() ?? ''
    if (!userId || !paymentId) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, status: true } } },
    })
    if (!payment || payment.userId !== userId) {
      return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 })
    }

    const paidStatuses = ['RECEIVED', 'CONFIRMED']
    const isPaid = paidStatuses.includes(payment.status) || payment.order.status === 'PAID'
    if (isPaid) {
      return NextResponse.json({
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
            data: { status: localStatus, lastEvent: `sync:${remote.status}`, lastEventAt: new Date() },
          })
          if (localStatus === 'RECEIVED' || localStatus === 'CONFIRMED') {
            await fulfillOrder(payment.orderId)
            return NextResponse.json({ status: 'PAID', orderStatus: 'PAID', billingType: payment.billingType, invoiceUrl: payment.invoiceUrl })
          }
          if (localStatus === 'OVERDUE' || localStatus === 'CANCELED') {
            await db.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELED' } }).catch(() => {})
            return NextResponse.json({ status: localStatus, orderStatus: 'CANCELED', billingType: payment.billingType, invoiceUrl: payment.invoiceUrl })
          }
        } catch {
          // Falha ao consultar o gateway: mantém pendente local
        }
      }
    }

    return NextResponse.json({
      status: payment.status,
      orderStatus: payment.order.status,
      billingType: payment.billingType,
      invoiceUrl: payment.invoiceUrl,
    })
  } catch (err) {
    console.error('GET /api/payments/status', err)
    return NextResponse.json({ error: 'Erro ao consultar o pagamento.' }, { status: 500 })
  }
}
