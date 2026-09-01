import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currencyBRL, nowNaive, parseNaive } from '@/lib/helpers'
import { formatWhen, notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/bookings — sessões do usuário autenticado (como mentorado e como mentor) */
export async function GET(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const userId = session.id
    const bookings = await db.booking.findMany({
      where: {
        OR: [{ menteeId: userId }, { mentor: { userId } }],
      },
      include: {
        mentor: { include: { user: true } },
        mentee: true,
        review: true,
      },
      orderBy: { startsAt: 'desc' },
    })

    // Estado de pagamento das sessões pagas (uma query única p/ todas)
    const paidBookings = new Set(
      (
        await db.order.findMany({
          where: {
            bookingId: { in: bookings.map((b) => b.id) },
            status: 'PAID',
          },
          select: { bookingId: true },
        })
      )
        .map((o) => o.bookingId)
        .filter((id): id is string => Boolean(id))
    )

    const items = bookings.map((b) => ({
      id: b.id,
      startsAt: b.startsAt,
      durationMin: b.durationMin,
      topic: b.topic,
      notes: b.notes,
      status: b.status,
      meetingRoom: b.meetingRoom,
      price: b.price,
      createdAt: b.createdAt.toISOString(),
      // FREE = sessão sem cobrança · PAID = pago · UNPAID = aguardando pagamento
      paymentStatus: b.price <= 0 ? ('FREE' as const) : paidBookings.has(b.id) ? ('PAID' as const) : ('UNPAID' as const),
      mentor: {
        id: b.mentor.id,
        userId: b.mentor.userId,
        name: b.mentor.user.name,
        headline: b.mentor.headline,
      },
      mentee: { id: b.mentee.id, name: b.mentee.name },
      reviewed: Boolean(b.review),
    }))

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/bookings', err)
    return NextResponse.json({ error: 'Erro ao listar sessões' }, { status: 500 })
  }
}

/**
 * POST /api/bookings — novo agendamento (status PENDING; se price > 0, o
 * mentorado paga no checkout ANTES de o mentor confirmar). Mentee = usuário
 * da SESSÃO.
 * Validações (agenda, conflito) + create rodam DENTRO de uma transação: no
 * SQLite o escritor é único, então duas requisições simultâneas para o mesmo
 * horário não passam mais pela checagem em paralelo (check-then-create era
 * race → double-booking). Corrida vira erro P2034/BUSY → 409 amigável.
 */
export async function POST(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const body = await req.json()
    const menteeId = session.id
    const mentorId = String(body?.mentorId ?? '')
    const startsAt = String(body?.startsAt ?? '')
    const durationMin = Math.max(30, Math.min(180, Number(body?.durationMin ?? 60)))
    const topic = String(body?.topic ?? '').trim().slice(0, 160)
    const notes = body?.notes ? String(body.notes).trim().slice(0, 600) : null

    if (!mentorId) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) {
      return NextResponse.json({ error: 'Horário inválido.' }, { status: 400 })
    }
    if (!topic) {
      return NextResponse.json({ error: 'Descreva o tema da sessão.' }, { status: 400 })
    }

    const mentee = await db.user.findUnique({ where: { id: menteeId } })
    if (!mentee) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const now = nowNaive()
    if (startsAt < now) {
      return NextResponse.json({ error: 'Escolha um horário no futuro.' }, { status: 400 })
    }

    const booking = await db
      .$transaction(async (tx) => {
        const mentor = await tx.mentorProfile.findUnique({
          where: { id: mentorId },
          include: { user: true },
        })
        if (!mentor || !mentor.isPublished) {
          return { error: 'Mentor não encontrado.', status: 404 as const }
        }
        if (mentor.userId === menteeId) {
          return { error: 'Você não pode agendar uma sessão com você mesmo 🙂', status: 400 as const }
        }

        // valida disponibilidade do mentor
        const weekday = parseNaive(startsAt).getDay()
        const hour = parseNaive(startsAt).getHours() + parseNaive(startsAt).getMinutes() / 60
        const availability = await tx.availability.findMany({ where: { mentorId, weekday } })
        const fits = availability.some((a) => hour >= a.startHour && hour + durationMin / 60 <= a.endHour)
        if (!fits) {
          return { error: 'Este horário saiu da agenda do mentor. Atualize a página.', status: 409 as const }
        }

        // valida conflito de horários (só sessões na janela relevante — perf)
        const start = parseNaive(startsAt).getTime()
        const end = start + durationMin * 60 * 1000
        // janela ±1 dia em torno do horário solicitado (strings naive ordenam bem)
        const dayBefore = new Date(start - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
        const dayAfter = new Date(end + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
        const others = await tx.booking.findMany({
          where: {
            mentorId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startsAt: { gte: dayBefore, lte: dayAfter },
          },
          select: { startsAt: true, durationMin: true },
        })
        const conflict = others.some((o) => {
          const os = parseNaive(o.startsAt).getTime()
          const oe = os + o.durationMin * 60 * 1000
          return start < oe && os < end
        })
        if (conflict) {
          return { error: 'Ops! Alguém acabou de agendar este horário. Escolha outro.', status: 409 as const }
        }

        const created = await tx.booking.create({
          data: {
            mentorId,
            menteeId,
            startsAt,
            durationMin,
            topic,
            notes: notes || null,
            status: 'PENDING',
            meetingRoom: `mentorhub-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
            price: mentor.hourlyRate,
          },
        })
        return { booking: created, mentorUserId: mentor.userId }
      })
      .catch((txErr) => {
        // Corrida de escrita no SQLite (transação simultânea): trata como conflito
        const code = (txErr as { code?: string })?.code ?? 'unknown'
        console.warn('POST /api/bookings: corrida de transação', code)
        return { error: 'Ops! Alguém acabou de agendar este horário. Escolha outro.', status: 409 as const }
      })

    if ('error' in booking) {
      return NextResponse.json({ error: booking.error }, { status: booking.status })
    }

    // Notifica o mentor sobre a nova solicitação (se price > 0, falta pagar)
    await notify({
      userId: booking.mentorUserId,
      kind: 'booking_new',
      title: `Nova solicitação de sessão de ${mentee.name}`,
      body:
        booking.booking.price > 0
          ? `Tema: ${topic} · ${formatWhen(startsAt)} · ${currencyBRL(booking.booking.price)} — aguardando o aluno pagar pela plataforma`
          : `Tema: ${topic} · ${formatWhen(startsAt)}`,
      linkView: 'dashboard',
      refId: booking.booking.id,
    })

    return NextResponse.json(
      { id: booking.booking.id, status: booking.booking.status, meetingRoom: booking.booking.meetingRoom, price: booking.booking.price },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/bookings', err)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }
}
