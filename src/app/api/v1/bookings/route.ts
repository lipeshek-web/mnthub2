import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileBooking, loadMobileBookings } from '@/lib/api-v1-serialize'
import { nowNaive, parseNaive } from '@/lib/helpers'
import { formatWhen, notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/bookings — sessões do aluno autenticado (mais recentes primeiro).
 * Sem parâmetros devolve o histórico completo (compatibilidade com o app),
 * com teto de 500 registros; `?page=&pageSize=` pagina (pageSize máx. 50).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const sp = req.nextUrl.searchParams
    const pageParam = sp.get('page')
    const sizeParam = sp.get('pageSize')

    let bookings
    let pagination: Record<string, unknown> | null = null
    if (pageParam || sizeParam) {
      const page = Math.max(1, Math.trunc(Number(pageParam) || 1))
      const pageSize = Math.min(50, Math.max(1, Math.trunc(Number(sizeParam) || 20)))
      const [rows, total] = await Promise.all([
        loadMobileBookings(user.id, { take: pageSize, skip: (page - 1) * pageSize }),
        db.booking.count({ where: { menteeId: user.id } }),
      ])
      bookings = rows
      pagination = { page, pageSize, total, hasMore: page * pageSize < total }
    } else {
      bookings = await loadMobileBookings(user.id, { take: 500 })
    }

    const body: Record<string, unknown> = { items: bookings.map((b) => serializeMobileBooking(b)) }
    if (pagination) Object.assign(body, pagination)
    return v1Json(body)
  } catch (err) {
    console.error('GET /api/v1/bookings', err)
    return v1Error('Erro ao listar sessões.', 500)
  }
}

/**
 * POST /api/v1/bookings — agenda uma sessão ({ mentorId, startsAt, durationMin, topic, notes? }).
 * A checagem de conflito e a criação rodam DENTRO de uma transação — dois
 * alunos competindo pelo mesmo horário não conseguem mais reservar os dois
 * (o segundo recebe 409 SLOT_TAKEN).
 */
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

    if (!mentorId) return v1Error('Mentor não informado.', 400, 'VALIDATION')
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) {
      return v1Error('Horário inválido.', 400, 'VALIDATION')
    }
    if (!topic) return v1Error('Descreva o tema da sessão.', 400, 'VALIDATION')

    const mentor = await db.mentorProfile.findFirst({
      where: { id: mentorId, isPublished: true },
      include: { user: true },
    })
    if (!mentor) return v1Error('Mentor não encontrado.', 404, 'MENTOR_NOT_FOUND')
    if (mentor.userId === user.id) {
      return v1Error('Você não pode agendar uma sessão com você mesmo 🙂', 400, 'SELF_BOOKING')
    }

    if (startsAt < nowNaive()) {
      return v1Error('Escolha um horário no futuro.', 400, 'PAST_SLOT')
    }

    // Disponibilidade semanal do mentor
    const when = parseNaive(startsAt)
    const weekday = when.getDay()
    const hour = when.getHours() + when.getMinutes() / 60
    const availability = await db.availability.findMany({ where: { mentorId, weekday } })
    const fits = availability.some((a) => hour >= a.startHour && hour + durationMin / 60 <= a.endHour)
    if (!fits) {
      return v1Error('Este horário saiu da agenda do mentor. Atualize e escolha outro.', 409, 'SLOT_UNAVAILABLE')
    }

    // Conflito + criação na MESMA transação (fecha a janela de corrida entre
    // a checagem e o INSERT; serializável evita leitura fantasma do vizinho)
    const start = when.getTime()
    const end = start + durationMin * 60_000

    const booking = await db.$transaction(
      async (tx) => {
        const others = await tx.booking.findMany({
          where: { mentorId, status: { in: ['PENDING', 'CONFIRMED'] } },
          select: { startsAt: true, durationMin: true },
        })
        const conflict = others.some((o) => {
          const os = parseNaive(o.startsAt).getTime()
          const oe = os + o.durationMin * 60_000
          return start < oe && os < end
        })
        if (conflict) return null

        return tx.booking.create({
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
      },
      { isolationLevel: 'Serializable', maxWait: 10_000, timeout: 20_000 }
    )

    if (!booking) {
      return v1Error('Ops! Alguém acabou de agendar este horário. Escolha outro.', 409, 'SLOT_TAKEN')
    }

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
