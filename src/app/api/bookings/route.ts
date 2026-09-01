import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nowNaive, parseNaive } from '@/lib/helpers'
import { formatWhen, notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Sentinela p/ rollback da transação de agendamento (conflito de horário) */
class BookingConflictError extends Error {}

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
        orders: { select: { status: true } },
      },
      orderBy: { startsAt: 'desc' },
    })

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
      // estado do pagamento da sessão 1:1 (botão "Pagar" no painel)
      payStatus: b.orders.some((o) => o.status === 'PAID')
        ? 'PAID'
        : b.orders.some((o) => o.status === 'PENDING')
          ? 'PENDING'
          : 'UNPAID',
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

/** POST /api/bookings — novo agendamento (status PENDING, confirmado pelo mentor). Mentee = usuário da SESSÃO. */
export async function POST(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  // Evita flood de agendamentos/notificações por conta
  const gate = rateLimit(`booking:${session.id}`, 10, 5 * 60_000)
  if (!gate.ok) return tooMany(gate.retryAfterSec)
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

    const mentor = await db.mentorProfile.findUnique({
      where: { id: mentorId },
      include: { user: true },
    })
    if (!mentor || !mentor.isPublished) {
      return NextResponse.json({ error: 'Mentor não encontrado.' }, { status: 404 })
    }
    if (mentor.userId === menteeId) {
      return NextResponse.json({ error: 'Você não pode agendar uma sessão com você mesmo 🙂' }, { status: 400 })
    }

    const mentee = await db.user.findUnique({ where: { id: menteeId } })
    if (!mentee) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const now = nowNaive()
    if (startsAt < now) {
      return NextResponse.json({ error: 'Escolha um horário no futuro.' }, { status: 400 })
    }

    // valida disponibilidade do mentor
    const weekday = parseNaive(startsAt).getDay()
    const hour = parseNaive(startsAt).getHours() + parseNaive(startsAt).getMinutes() / 60
    const availability = await db.availability.findMany({ where: { mentorId, weekday } })
    const fits = availability.some((a) => hour >= a.startHour && hour + durationMin / 60 <= a.endHour)
    if (!fits) {
      return NextResponse.json({ error: 'Este horário saiu da agenda do mentor. Atualize a página.' }, { status: 409 })
    }

    // valida conflito de horários + cria ATOMICAMENTE (anti double-booking):
    // o INSERT primeiro (pega o write lock do SQLite), depois a checagem vê as
    // linhas já commitadas das transações concorrentes — se conflitar, throw
    // faz rollback. Antes (check-then-create) dois cliques simultâneos
    // passavam na checagem juntos e ambos criavam a sessão.
    const start = parseNaive(startsAt).getTime()
    const end = start + durationMin * 60 * 1000
    // janela ±1 dia em torno do horário solicitado (strings naive ordenam bem)
    const dayBefore = new Date(start - 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    const dayAfter = new Date(end + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)

    let booking
    try {
      booking = await db.$transaction(async (tx) => {
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
        const others = await tx.booking.findMany({
          where: {
            mentorId,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startsAt: { gte: dayBefore, lte: dayAfter },
            id: { not: created.id },
          },
          select: { startsAt: true, durationMin: true },
        })
        const conflict = others.some((o) => {
          const os = parseNaive(o.startsAt).getTime()
          const oe = os + o.durationMin * 60 * 1000
          return start < oe && os < end
        })
        if (conflict) {
          throw new BookingConflictError()
        }
        return created
      })
    } catch (e) {
      // Conflito real (rollback) OU falha da transação sob concorrência
      // (timeout/write-conflict do SQLite) — em ambos o agendamento NÃO foi
      // criado e o horário segue disputado: 409 pede novo horário ao usuário.
      const code = (e as { code?: string })?.code
      if (e instanceof BookingConflictError || code === 'P2034' || code === 'P2028') {
        return NextResponse.json(
          { error: 'Ops! Alguém acabou de agendar este horário. Escolha outro.' },
          { status: 409 }
        )
      }
      // Timeout de socket da transação concorrente (sem code estável)
      if (e instanceof Error && /timeout|locked/i.test(e.message)) {
        return NextResponse.json(
          { error: 'Ops! Alguém acabou de agendar este horário. Escolha outro.' },
          { status: 409 }
        )
      }
      throw e
    }

    // Notifica o mentor sobre a nova solicitação
    await notify({
      userId: mentor.userId,
      kind: 'booking_new',
      title: `Nova solicitação de sessão de ${mentee.name}`,
      body: `Tema: ${topic} · ${formatWhen(startsAt)}`,
      linkView: 'dashboard',
      refId: booking.id,
    })

    return NextResponse.json(
      { id: booking.id, status: booking.status, meetingRoom: booking.meetingRoom, price: booking.price },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/bookings', err)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }
}
