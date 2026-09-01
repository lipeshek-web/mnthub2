import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'
import { refundOrder } from '@/lib/refunds'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/orders/[id]/refund — decisão do ADMIN sobre uma solicitação
 * de reembolso (ou estorno direto de qualquer pedido pago).
 * body: { action: 'approve' | 'reject', note? }
 * - approve: estorna o pedido (PAID → REFUNDED via refundOrder idempotente),
 *   revoga o acesso concedido e devolve créditos de indicação usados.
 * - reject: apenas registra a recusa (mantém o acesso e o dinheiro).
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action ?? '')

    const order = await db.order.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        course: { select: { title: true } },
        track: { select: { title: true } },
        bundle: { select: { title: true } },
        membership: { select: { title: true } },
        booking: { select: { topic: true } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })

    const itemTitle =
      order.course?.title ??
      order.track?.title ??
      order.bundle?.title ??
      order.membership?.title ??
      (order.booking ? `Sessão "${order.booking.topic}"` : 'Pedido')

    if (action === 'approve') {
      if (order.status !== 'PAID') {
        return NextResponse.json(
          { error: `Pedido não está pago (status atual: ${order.status}).` },
          { status: 409 }
        )
      }
      const result = await refundOrder(order.id)
      if (!result.ok) {
        return NextResponse.json(
          { error: `Não foi possível estornar: ${result.error ?? 'erro desconhecido'}.` },
          { status: 409 }
        )
      }
      await db.order.update({ where: { id: order.id }, data: { refundStatus: 'APPROVED' } })
      await audit(actor, 'order.refund.approve', { orderId: order.id, amount: order.amount, itemTitle })
      return NextResponse.json({ ok: true, status: 'REFUNDED' })
    }

    if (action === 'reject') {
      if (order.refundStatus !== 'REQUESTED') {
        return NextResponse.json(
          { error: 'Não há solicitação de reembolso em análise para este pedido.' },
          { status: 409 }
        )
      }
      await db.order.update({ where: { id: order.id }, data: { refundStatus: 'REJECTED' } })
      await audit(actor, 'order.refund.reject', { orderId: order.id, itemTitle })
      await notify({
        userId: order.studentId,
        kind: 'refund_rejected',
        title: 'Solicitação de reembolso recusada',
        body: `Após análise, o pedido de "${itemTitle}" não foi reembolsado. Seu acesso permanece ativo.`,
        linkView: 'dashboard',
        refId: order.id,
      })
      return NextResponse.json({ ok: true, status: 'REJECTED' })
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    console.error('PATCH /api/admin/orders/[id]/refund', err)
    return NextResponse.json({ error: 'Erro ao processar o reembolso.' }, { status: 500 })
  }
}
