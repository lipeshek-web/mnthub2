import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { loadEvent, serializeEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/events/[id]/join — participa do evento (assento reservado) ou
 * sai, conforme `action`: "join" (default) | "leave". 409 EVENT_FULL quando
 * a sala está cheia.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const action = body?.action === 'leave' ? 'leave' : 'join'

    if (action === 'leave') {
      const ev = await db.event.findUnique({ where: { id } })
      if (!ev) return v1Error('Evento não encontrado.', 404)
      if (ev.hostId === user.id) {
        return v1Error('O anfitrião não sai do próprio evento — cancele o evento se precisar.', 400, 'HOST')
      }
      await db.eventParticipant.deleteMany({ where: { eventId: id, userId: user.id } })
      const detail = await loadEvent(id)
      return v1Json({ event: detail ? serializeEvent(detail, user.id) : null })
    }

    // join — transação serializável para não passar da capacidade
    const result = await db.$transaction(
      async (tx) => {
        const ev = await tx.event.findUnique({ where: { id }, include: { participants: true } })
        if (!ev) return { ok: false as const, status: 404, error: 'Evento não encontrado.' }
        if (ev.status === 'CANCELLED') return { ok: false as const, status: 410, error: 'Este evento foi cancelado.' }
        if (ev.hostId === user.id) return { ok: false as const, status: 400, error: 'Você já é o anfitrião deste evento.' }
        const seat = ev.participants.find((p) => p.userId === user.id)
        if (seat) return { ok: true as const }
        if (ev.participants.length >= ev.capacity) {
          return { ok: false as const, status: 409, error: 'A sala está cheia — todas as vagas foram preenchidas.', code: 'EVENT_FULL' }
        }
        await tx.eventParticipant.create({ data: { eventId: id, userId: user.id, role: 'GUEST' } })
        return { ok: true as const }
      },
      { timeout: 20_000, maxWait: 10_000 }
    )

    if (!result.ok) {
      return v1Error(result.error, result.status, 'code' in result ? result.code : undefined)
    }

    const detail = await loadEvent(id)
    if (!detail) return v1Error('Evento não encontrado.', 404)
    return v1Json({ event: serializeEvent(detail, user.id) })
  } catch (err) {
    console.error('POST /api/v1/events/[id]/join', err)
    return v1Error('Erro ao participar do evento.', 500)
  }
}
