import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memberships/cancel — cancela a assinatura do usuário.
 * O acesso permanece até o fim do ciclo pago (renewsAt) — status CANCELLED.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '').trim()
    const membershipId = String(body?.membershipId ?? '').trim()
    if (!userId || !membershipId) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }

    const sub = await db.membershipSubscription.findUnique({
      where: { membershipId_userId: { membershipId, userId } },
      include: { membership: { select: { title: true, mentor: { select: { userId: true } } } } },
    })
    if (!sub) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }
    if (sub.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Esta assinatura já está cancelada.' }, { status: 409 })
    }

    await db.membershipSubscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    })

    // Avisa o mentor sobre o cancelamento (falha silenciosa)
    await notify({
      userId: sub.membership.mentor.userId,
      kind: 'membership_subscribed',
      title: `Assinatura cancelada`,
      body: `Um aluno cancelou o plano "${sub.membership.title}". O acesso segue até o fim do ciclo pago.`,
      linkView: 'onboarding',
      refId: sub.membershipId,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/memberships/cancel', err)
    return NextResponse.json({ error: 'Erro ao cancelar a assinatura.' }, { status: 500 })
  }
}
