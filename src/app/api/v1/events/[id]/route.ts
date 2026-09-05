import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { loadEvent, serializeEvent } from '@/lib/events'

export const dynamic = 'force-dynamic'

/** GET /api/v1/events/[id] — detalhe do evento (participantes, assentos, estado) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params
    const ev = await loadEvent(id)
    if (!ev) return v1Error('Evento não encontrado.', 404)
    return v1Json({ event: serializeEvent(ev, user.id) })
  } catch (err) {
    console.error('GET /api/v1/events/[id]', err)
    return v1Error('Erro ao abrir o evento.', 500)
  }
}

/** DELETE /api/v1/events/[id] — cancela o evento (só o anfitrião) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params
    const ev = await db.event.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      },
    })
    if (!ev) return v1Error('Evento não encontrado.', 404)
    if (ev.hostId !== user.id) {
      return v1Error('Apenas o anfitrião pode cancelar o evento.', 403, 'NOT_HOST')
    }
    if (ev.status !== 'CANCELLED') {
      await db.event.update({ where: { id }, data: { status: 'CANCELLED' } })
    }
    const detail = await loadEvent(id)
    return v1Json({ ok: true, event: detail ? serializeEvent(detail, user.id) : null })
  } catch (err) {
    console.error('DELETE /api/v1/events/[id]', err)
    return v1Error('Erro ao cancelar o evento.', 500)
  }
}
