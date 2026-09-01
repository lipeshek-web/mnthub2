import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileBooking, loadMobileBookings } from '@/lib/api-v1-serialize'
import { nowNaive, parseNaive } from '@/lib/helpers'
import { formatWhen, notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** GET /api/v1/bookings — sessões do aluno autenticado (mais recentes primeiro) */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const bookings = await loadMobileBookings(user.id)
    return v1Json({ items: bookings.map((b) => serializeMobileBooking(b)) })
  } catch (err) {
    console.error('GET /api/v1/bookings', err)
    return v1Error('Erro ao listar sessões.', 500)
  }
}

/** POST /api/v1/bookings — agenda uma sessão ({ mentorId, startsAt, durationMin, topic, notes? }) */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const body = await req.json().catch(() => null)
    const mentorId = String(body?.mentorId ?? '')
    const startsAt = String(body?.startsAt ?? '')
    const durationMin = Math.max(30, Math.min(180, Math.trunc(Number(body?.durationMin ?? 60))))
    const topic = String(body?.topic ?? '').trim()
    const notes = body?.notes ? String(body.notes).trim() : null

    if (!mentorId) return v1Error('Mentor não informado.', 400)
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) {
      return v1Error('Horário inválido.', 400)
    }
    if (!topic) return v1Error('Descreva o tema da sessão.', 400)

    const mentor = await db.mentorProfile.findFirst({
      where: { id: mentorId, isPublished: true },
      include: { user: true },
    })
    if (!mentor) return v1Error('Mentor não encontrado.', 404)
    if (mentor.userId === user.id) {
      return v1Error('Você não pode agendar uma sessão com você mesmo 🙂', 400)
    }

    if (startsAt < nowNaive()) {
      return v1Error('Escolha um horário no futuro.', 400)
    }

    // Disponibilidade semanal do mentor
    const when = parseNaive(startsAt)
    const weekday = when.getDay()
    const hour = when.getHours() + when.getMinutes() / 60
    const availability = await db.availability.findMany({ where: { mentorId, weekday } })
    const fits = availability.some((a) => hour >= a.startHour && hour + durationMin / 60 <= a.endHour)
    if (!fits) {
      return v1Error('Este horário saiu da agenda do mentor. Atualize e escolha outro.', 409)
    }

    // Conflito com outras reservas ativas
    const start = when.getTime()
    const end = start + durationMin * 60_000
    const others = await db.booking.findMany({
      where: { mentorId, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { startsAt: true, durationMin: true },
    })
    const conflict = others.some((o) => {
      const os = parseNaive(o.startsAt).getTime()
      const oe = os + o.durationMin * 60_000
      return start < oe && os < end
    })
    if (conflict) {
      return v1Error('Ops! Alguém acabou de agendar este horário. Escolha outro.', 409)
    }

    const booking = await db.booking.create({
      data: {
        mentorId,
        menteeId: user.id,
        startsAt,
        durationMin,
        topic,
        notes: notes || null,
        status: 'PENDING',
        meetingRoom: `mentorhub-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
        price: mentor.hourlyRate,
      },
    })

    await notify({
      userId: mentor.userId,
      kind: 'booking_new',
      title: `Nova solicitação de sessão de ${user.name}`,
      body: `Tema: ${topic} · ${formatWhen(startsAt)} (via app)`,
      linkView: 'dashboard',
      refId: booking.id,
    })

    return v1Json(
      { id: booking.id, status: booking.status, meetingRoom: booking.meetingRoom, price: booking.price },
      201
    )
  } catch (err) {
    console.error('POST /api/v1/bookings', err)
    return v1Error('Erro ao criar agendamento.', 500)
  }
}
