import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'
import {
  getAsaasConfig,
  getAsaasPayment,
  confirmAsaasPaymentInCash,
  mapAsaasStatus,
} from '@/lib/asaas'
import { fulfillOrder } from '@/lib/fulfillment'

export const dynamic = 'force-dynamic'

// ==================== COBRANÇAS (ADMIN) ====================
// GET: lista com filtros · POST: ações (confirm no Asaas / sincronizar / cancelar)

const PAID_STATUSES = ['RECEIVED', 'CONFIRMED']

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  try {
    const status = req.nextUrl.searchParams.get('status')?.trim() ?? ''
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1)
    const take = 20

    const where: Record<string, unknown> = {}
    if (status && status !== 'ALL') where.status = status
    if (q) {
      where.OR = [
        { gatewayPaymentId: { contains: q } },
        { user: { is: { OR: [{ name: { contains: q } }, { email: { contains: q } }] } } },
      ]
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
        include: {
          user: { select: { name: true, email: true } },
          order: {
            select: {
              id: true,
              status: true,
              amount: true,
              course: { select: { title: true } },
              track: { select: { title: true } },
              bundle: { select: { title: true } },
              membership: { select: { title: true } },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        gateway: p.gateway,
        gatewayPaymentId: p.gatewayPaymentId,
        billingType: p.billingType,
        status: p.status,
        orderStatus: p.order.status,
        value: p.value,
        invoiceUrl: p.invoiceUrl,
        lastEvent: p.lastEvent,
        createdAt: p.createdAt.toISOString(),
        confirmedAt: p.confirmedAt?.toISOString() ?? null,
        userName: p.user.name,
        userEmail: p.user.email,
        itemTitle:
          p.order.course?.title ??
          p.order.track?.title ??
          p.order.bundle?.title ??
          p.order.membership?.title ??
          'Pedido',
        orderId: p.order.id,
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / take)),
    })
  } catch (err) {
    console.error('GET /api/admin/payments', err)
    return NextResponse.json({ error: 'Erro ao listar cobranças.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const paymentId = String(body?.paymentId ?? '')
    const action = String(body?.action ?? '')

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { order: { select: { id: true, status: true } } },
    })
    if (!payment) return NextResponse.json({ error: 'Cobrança não encontrada.' }, { status: 404 })

    // ---------- Confirmação manual no Asaas (receiveInCash) ----------
    if (action === 'confirm_asaas') {
      if (payment.gateway !== 'ASAAS' || !payment.gatewayPaymentId) {
        return NextResponse.json({ error: 'Cobrança não é do gateway Asaas.' }, { status: 400 })
      }
      if (PAID_STATUSES.includes(payment.status)) {
        return NextResponse.json({ error: 'Cobrança já está paga.' }, { status: 409 })
      }
      const config = await getAsaasConfig()
      if (!config.apiKey) {
        return NextResponse.json({ error: 'Gateway não configurado.' }, { status: 400 })
      }
      try {
        // No sandbox isso simula o pagamento; em produção é a conciliação manual
        await confirmAsaasPaymentInCash(config, payment.gatewayPaymentId, payment.value)
        const result = await fulfillOrder(payment.orderId)
        await audit(actor, 'payment.confirm_asaas', { paymentId, orderId: payment.orderId, env: config.env })
        return NextResponse.json({ ok: true, fulfilled: result.ok })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao confirmar no Asaas.'
        return NextResponse.json({ error: message }, { status: 502 })
      }
    }

    // ---------- Sincronizar status com o Asaas ----------
    if (action === 'sync') {
      if (payment.gateway !== 'ASAAS' || !payment.gatewayPaymentId) {
        return NextResponse.json({ error: 'Cobrança não é do gateway Asaas.' }, { status: 400 })
      }
      const config = await getAsaasConfig()
      if (!config.apiKey) {
        return NextResponse.json({ error: 'Gateway não configurado.' }, { status: 400 })
      }
      try {
        const remote = await getAsaasPayment(config, payment.gatewayPaymentId)
        const local = mapAsaasStatus(remote.status)
        await db.payment.update({
          where: { id: payment.id },
          data: { status: local, lastEvent: `sync:${remote.status}`, lastEventAt: new Date() },
        })
        if (local === 'RECEIVED' || local === 'CONFIRMED') {
          const result = await fulfillOrder(payment.orderId)
          await audit(actor, 'payment.sync_paid', { paymentId, remote: remote.status })
          return NextResponse.json({ ok: true, status: local, fulfilled: result.ok })
        }
        await audit(actor, 'payment.sync', { paymentId, remote: remote.status })
        return NextResponse.json({ ok: true, status: local })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao consultar o Asaas.'
        return NextResponse.json({ error: message }, { status: 502 })
      }
    }

    // ---------- Cancelar cobrança pendente local ----------
    if (action === 'cancel') {
      if (PAID_STATUSES.includes(payment.status)) {
        return NextResponse.json({ error: 'Cobrança paga não pode ser cancelada aqui.' }, { status: 400 })
      }
      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: { status: 'CANCELED', lastEvent: 'admin_cancel', lastEventAt: new Date() },
        }),
        db.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELED' } }),
      ])
      await audit(actor, 'payment.cancel', { paymentId, orderId: payment.orderId })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/admin/payments', err)
    return NextResponse.json({ error: 'Erro na operação.' }, { status: 500 })
  }
}
