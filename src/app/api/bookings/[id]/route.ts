import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { refundOrder } from '@/lib/refunds'
import { formatWhen, notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id] — sessão única do usuário autenticado (mentorado ou
 * mentor). Usada pelo checkout da sessão 1:1 para exibir o resumo.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        mentee: { select: { id: true, name: true } },
        review: { select: { id: true } },
      },
    })
    if (!booking) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })

    const isParticipant = booking.menteeId === session.id || booking.mentor.userId === session.id
    if (!isParticipant) {
      return NextResponse.json({ error: 'Sem permissão para ver esta sessão.' }, { status: 403 })
    }

    const paid = await db.order.findFirst({
      where: { bookingId: booking.id, status: 'PAID' },
      select: { id: true },
    })

    return NextResponse.json({
      booking: {
        id: booking.id,
        startsAt: booking.startsAt,
        durationMin: booking.durationMin,
        topic: booking.topic,
        notes: booking.notes,
        status: booking.status,
        meetingRoom: booking.meetingRoom,
        price: booking.price,
        createdAt: booking.createdAt.toISOString(),
        paymentStatus:
          booking.price <= 0 ? 'FREE' : paid ? 'PAID' : 'UNPAID',
        mentor: {
          id: booking.mentor.id,
          userId: booking.mentor.userId,
          name: booking.mentor.user.name,
          headline: booking.mentor.headline,
          avatarUrl: booking.mentor.user.avatarUrl,
        },
        mentee: { id: booking.mentee.id, name: booking.mentee.name },
        reviewed: Boolean(booking.review),
      },
    })
  } catch (err) {
    console.error('GET /api/bookings/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar a sessão' }, { status: 500 })
  }
}

/**
 * PATCH /api/bookings/[id]
 * body: { action: 'confirm' | 'cancel' | 'complete' } — a identidade vem da
 * SESSÃO (antes vinha do body e permitia confirmar/concluir/cancelar a sessão
 * de qualquer pessoa, já que o userId do mentor é público).
 * Regra de cobrança (Sprint 2): sessão com price > 0 só pode ser CONFIRMADA
 * depois de paga (pedido PAID vinculado). Cancelar sessão paga dispara o
 * reembolso automático do pedido (acesso/dinheiro voltam para o aluno).
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
      // Ciclo financeiro: sessão paga só é confirmada depois do pagamento
      if (booking.price > 0) {
        const paid = await db.order.findFirst({
          where: { bookingId: booking.id, status: 'PAID' },
          select: { id: true },
        })
        if (!paid) {
          return NextResponse.json(
            { error: 'Esta sessão ainda não foi paga pelo aluno. A confirmação libera quando o pagamento cair.' },
            { status: 402 }
          )
        }
      }
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

      // Sessão paga cancelada = reembolso automático (estorna o pedido, avisa
      // as partes). Falha silenciosa — o cancelamento em si já aconteceu.
      const paidOrder = await db.order.findFirst({
        where: { bookingId: booking.id, status: 'PAID' },
        select: { id: true },
      })
      if (paidOrder) {
        await refundOrder(paidOrder.id).catch((err) =>
          console.error('cancel de sessão paga: refund falhou', err)
        )
      }

      // Notifica a outra parte (quem cancelou já sabe)
      if (isMentor) {
        await notify({
          userId: booking.menteeId,
          kind: 'booking_cancelled',
          title: `Sessão cancelada por ${booking.mentor.user.name}`,
          body: `${booking.topic} · ${formatWhen(booking.startsAt)}${paidOrder ? ' · o pagamento será reembolsado' : ''}`,
          linkView: 'dashboard',
          refId: booking.id,
        })
      } else {
        await notify({
          userId: booking.mentor.userId,
          kind: 'booking_cancelled',
          title: `Sessão cancelada por ${booking.mentee.name}`,
          body: `${booking.topic} · ${formatWhen(booking.startsAt)}${paidOrder ? ' · o pagamento será reembolsado' : ''}`,
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
