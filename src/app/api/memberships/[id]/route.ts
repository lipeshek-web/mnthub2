import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'
import { membershipBaseInclude, serializeMembership } from '@/lib/membership-serialize'
import { expireDueSubscriptions } from '@/lib/membership-access'

export const dynamic = 'force-dynamic'

/** GET /api/memberships/[id] — plano único (checkout, perfil público).
 *  Identidade pela sessão — userId da query deixava ver o status/renewsAt de terceiros. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await resolveUser(req)
    const userId = session?.id || ''
    // Encerra assinaturas vencidas antes de reportar o estado do usuário
    await expireDueSubscriptions()
    const membership = await db.mentorMembership.findUnique({
      where: { id },
      include: {
        ...membershipBaseInclude(),
        subscriptions: {
          where: userId ? { userId } : { status: 'ACTIVE' },
          select: { userId: true, status: true, renewsAt: true },
          take: 1,
        },
      },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }
    const coursesCount = await db.course.count({
      where: { mentorId: membership.mentorId, isPublished: true },
    })
    const mine = userId ? membership.subscriptions[0] : undefined
    return NextResponse.json({
      membership: serializeMembership(membership, {
        coursesCount,
        subscriberCount: membership._count.subscriptions,
        myStatus: mine ? (mine.status as 'ACTIVE' | 'CANCELLED') : null,
        renewsAt: mine ? mine.renewsAt.toISOString() : null,
      }),
    })
  } catch (err) {
    console.error('GET /api/memberships/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar a assinatura.' }, { status: 500 })
  }
}

/** DELETE /api/memberships/[id] — remove o plano do próprio mentor (sessão; cascade nos vínculos) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await resolveUser(req)
    if (!session) {
      return unauthorized()
    }
    const userId = session.id
    const profile = await db.mentorProfile.findUnique({ where: { userId } })
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 403 })
    }
    const existing = await db.mentorMembership.findUnique({ where: { id } })
    if (!existing || existing.mentorId !== profile.id) {
      return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
    }
    await db.mentorMembership.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/memberships/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir a assinatura.' }, { status: 500 })
  }
}
