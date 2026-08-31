import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/memberships/cancel — cancela a assinatura do usuário da SESSÃO.
 * O acesso permanece até o fim do ciclo pago (renewsAt) — status CANCELLED.
 */
export async function POST(req: NextRequest) {
  try {
    // Sessão em vez de userId do body — sem isso qualquer um cancela a
    // assinatura de outro aluno (IDOR).
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para cancelar.')
    const body = await req.json().catch(() => ({}))
    const userId = session.id
    const membershipId = String(body?.membershipId ?? '').trim()
    if (!membershipId) {
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
