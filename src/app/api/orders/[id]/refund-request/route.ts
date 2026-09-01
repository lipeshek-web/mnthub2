import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/orders/[id]/refund-request — o ALUNO solicita o reembolso de um
 * pedido pago. A decisão é do admin (PATCH /api/admin/orders/[id]/refund):
 * aprovar estorna + revoga o acesso; recusa mantém tudo como está.
 * Regras: só o próprio comprador · pedido PAID · sem solicitação em aberto
 * (após REJECTED não pode reabrir — abra um chamado com o suporte).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const reason = String(body?.reason ?? '').trim().slice(0, 500)
    if (reason.length < 10) {
      return NextResponse.json(
        { error: 'Conte brevemente o motivo do reembolso (mín. 10 caracteres).' },
        { status: 400 }
      )
    }

    const order = await db.order.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        mentor: { include: { user: { select: { id: true, name: true } } } },
        course: { select: { title: true } },
        track: { select: { title: true } },
        bundle: { select: { title: true } },
        membership: { select: { title: true } },
        booking: { select: { topic: true } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    if (order.studentId !== session.id) {
      return NextResponse.json({ error: 'Este pedido não pertence à sua conta.' }, { status: 403 })
    }
    if (order.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Só é possível solicitar reembolso de pedidos pagos.' },
        { status: 409 }
      )
    }
    if (order.refundStatus === 'REQUESTED') {
      return NextResponse.json(
        { error: 'Já existe uma solicitação de reembolso em análise para este pedido.' },
        { status: 409 }
      )
    }
    if (order.refundStatus === 'APPROVED' || order.refundStatus === 'REJECTED') {
      return NextResponse.json(
        { error: 'Esta solicitação já foi avaliada pela equipe.' },
        { status: 409 }
      )
    }

    await db.order.update({
      where: { id: order.id },
      data: { refundStatus: 'REQUESTED', refundReason: reason, refundRequestedAt: new Date() },
    })

    const itemTitle =
      order.course?.title ??
      order.track?.title ??
      order.bundle?.title ??
      order.membership?.title ??
      (order.booking ? `Sessão "${order.booking.topic}"` : 'Pedido')

    // Avisa o mentor (transparência) e registra o pedido para o painel admin
    await notify({
      userId: order.mentor.userId,
      kind: 'refund_requested',
      title: `Solicitação de reembolso — ${order.student.name}`,
      body: `Pedido de "${itemTitle}" · Motivo: ${reason.slice(0, 160)}`,
      linkView: 'dashboard',
      refId: order.id,
    })

    return NextResponse.json({ ok: true, refundStatus: 'REQUESTED' })
  } catch (err) {
    console.error('POST /api/orders/[id]/refund-request', err)
    return NextResponse.json({ error: 'Erro ao solicitar o reembolso.' }, { status: 500 })
  }
}
