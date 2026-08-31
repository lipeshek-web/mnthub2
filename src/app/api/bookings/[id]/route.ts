import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatWhen, notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/bookings/[id]
 * body: { action: 'confirm' | 'cancel' | 'complete' } — a identidade vem da
 * SESSÃO (antes vinha do body e permitia confirmar/concluir/cancelar a sessão
 * de qualquer pessoa, já que o userId do mentor é público).
 * Cada ação notifica a outra parte envolvida.
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const action = String(body?.action ?? '')

    const booking = await db.booking.findUnique({
      where: { id },
      include: { mentor: { include: { user: true } }, mentee: true },
    })
    if (!booking) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })

    const isMentor = booking.mentor.userId === userId
    const isMentee = booking.menteeId === userId

    if (action === 'confirm') {
      if (!isMentor) return NextResponse.json({ error: 'Apenas o mentor pode confirmar.' }, { status: 403 })
      if (booking.status !== 'PENDING')
        return NextResponse.json({ error: 'Esta sessão não pode mais ser confirmada.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'CONFIRMED' } })
      await notify({
        userId: booking.menteeId,
        kind: 'booking_confirmed',
        title: `Sessão confirmada com ${booking.mentor.user.name}!`,
        body: `${booking.topic} · ${formatWhen(booking.startsAt)}`,
        linkView: 'dashboard',
        refId: booking.id,
      })
    }

    if (action === 'cancel') {
      if (!isMentor && !isMentee)
        return NextResponse.json({ error: 'Sem permissão para cancelar.' }, { status: 403 })
      if (!['PENDING', 'CONFIRMED'].includes(booking.status))
        return NextResponse.json({ error: 'Esta sessão não pode mais ser cancelada.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
      // Notifica a outra parte (quem cancelou já sabe)
      if (isMentor) {
        await notify({
          userId: booking.menteeId,
          kind: 'booking_cancelled',
          title: `Sessão cancelada por ${booking.mentor.user.name}`,
          body: `${booking.topic} · ${formatWhen(booking.startsAt)}`,
          linkView: 'dashboard',
          refId: booking.id,
        })
      } else {
        await notify({
          userId: booking.mentor.userId,
          kind: 'booking_cancelled',
          title: `Sessão cancelada por ${booking.mentee.name}`,
          body: `${booking.topic} · ${formatWhen(booking.startsAt)}`,
          linkView: 'dashboard',
          refId: booking.id,
        })
      }
    }

    if (action === 'complete') {
      if (!isMentor) return NextResponse.json({ error: 'Apenas o mentor pode concluir a sessão.' }, { status: 403 })
      if (booking.status !== 'CONFIRMED')
        return NextResponse.json({ error: 'Apenas sessões confirmadas podem ser concluídas.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'COMPLETED' } })
      await notify({
        userId: booking.menteeId,
        kind: 'booking_completed',
        title: 'Sessão concluída — deixe sua avaliação!',
        body: `Como foi a sessão de ${booking.topic} com ${booking.mentor.user.name}?`,
        linkView: 'dashboard',
        refId: booking.id,
      })
    }

    const updated = await db.booking.findUnique({ where: { id }, select: { id: true, status: true } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/bookings/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}
