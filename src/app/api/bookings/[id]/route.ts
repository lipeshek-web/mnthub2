import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatWhen, notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'
import { brandedEmail, sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id] — detalhe da sessão (checkout da sessão 1:1).
 * Somente mentor ou mentorado da sessão — identidade pela SESSÃO.
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
        orders: { select: { status: true } },
      },
    })
    // mentor.userId é necessário para a sala saber quem é o anfitrião (mentor)
    if (!booking) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })

    const allowed =
      booking.mentor.userId === session.id || booking.menteeId === session.id || session.role === 'ADMIN'
    if (!allowed) return NextResponse.json({ error: 'Sem acesso a esta sessão.' }, { status: 403 })

    return NextResponse.json({
      id: booking.id,
      topic: booking.topic,
      startsAt: booking.startsAt,
      durationMin: booking.durationMin,
      status: booking.status,
      price: booking.price,
      payStatus: booking.orders.some((o) => o.status === 'PAID')
        ? 'PAID'
        : booking.orders.some((o) => o.status === 'PENDING')
          ? 'PENDING'
          : 'UNPAID',
      notes: booking.notes,
      meetingRoom: booking.meetingRoom,
      mentor: {
        id: booking.mentor.id,
        userId: booking.mentor.userId,
        name: booking.mentor.user.name,
        avatarUrl: booking.mentor.user.avatarUrl,
      },
      mentee: booking.mentee,
    })
  } catch (err) {
    console.error('GET /api/bookings/[id]', err)
    return NextResponse.json({ error: 'Erro ao carregar a sessão.' }, { status: 500 })
  }
}

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
      await sendEmail({
        to: booking.mentee.email,
        kind: 'booking_confirmed',
        subject: `Sessão confirmada com ${booking.mentor.user.name} — MentorHub`,
        html: brandedEmail({
          title: 'Sua sessão foi confirmada!',
          lines: [
            `<strong>${booking.mentor.user.name}</strong> confirmou a sessão "${booking.topic}".`,
            `Quando: <strong>${formatWhen(booking.startsAt)}</strong>.`,
            'Prepare suas perguntas com antecedência e teste câmera e microfone.',
          ],
          cta: { label: 'Ver minhas sessões', url: `${req.nextUrl.origin}/` },
        }),
      })
    }

    if (action === 'cancel') {
      if (!isMentor && !isMentee)
        return NextResponse.json({ error: 'Sem permissão para cancelar.' }, { status: 403 })
      if (!['PENDING', 'CONFIRMED'].includes(booking.status))
        return NextResponse.json({ error: 'Esta sessão não pode mais ser cancelada.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
      const cancelEmail = (to: string, name: string) =>
        sendEmail({
          to,
          kind: 'booking_cancelled',
          subject: `Sessão cancelada — MentorHub`,
          html: brandedEmail({
            title: 'Uma sessão foi cancelada',
            lines: [
              `A sessão "${booking.topic}" (${formatWhen(booking.startsAt)}) foi cancelada por <strong>${name}</strong>.`,
              'Você pode combinar uma nova data pelo perfil do mentor.',
            ],
          }),
        })
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
        await cancelEmail(booking.mentee.email, booking.mentor.user.name)
      } else {
        await notify({
          userId: booking.mentor.userId,
          kind: 'booking_cancelled',
          title: `Sessão cancelada por ${booking.mentee.name}`,
          body: `${booking.topic} · ${formatWhen(booking.startsAt)}`,
          linkView: 'dashboard',
          refId: booking.id,
        })
        await cancelEmail(booking.mentor.user.email, booking.mentee.name)
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
      await sendEmail({
        to: booking.mentee.email,
        kind: 'booking_completed',
        subject: 'Como foi sua sessão? — MentorHub',
        html: brandedEmail({
          title: 'Sessão concluída ⭐',
          lines: [
            `A sessão "${booking.topic}" com <strong>${booking.mentor.user.name}</strong> foi concluída.`,
            'Sua avaliação ajuda outros alunos a encontrarem os melhores mentores.',
          ],
          cta: { label: 'Avaliar a sessão', url: `${req.nextUrl.origin}/` },
        }),
      })
    }

    const updated = await db.booking.findUnique({ where: { id }, select: { id: true, status: true } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/bookings/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}
