import type { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/events/[id]/meeting-token — credencial da sala MULTI-PARTICIPANTE
 * para o WebView do app (public/room.html). Sala = `ev-<eventId>`, capacidade
 * assinada no token (`c`) — liga o modo malha no meeting-service. O PAPEL
 * (HOST = anfitrião) é decidido AQUI; só PARTICIPANTE confirmado pega token.
 */
const MEETING_WS_PORT = 3004
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000

function sign(payload: object): string {
  const secret = process.env.MEETING_SECRET || 'mentorhub-meeting-dev-secret'
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    if (ev.status === 'CANCELLED') return v1Error('Este evento foi cancelado.', 410)

    const seat = ev.participants.find((p) => p.userId === user.id)
    if (!seat && ev.hostId !== user.id) {
      return v1Error('Participe do evento para entrar na sala.', 403, 'NOT_PARTICIPANT')
    }

    const role = ev.hostId === user.id ? 'HOST' : 'GUEST'
    const name = seat?.role === 'HOST' ? ev.host.name || user.name : user.name || 'Participante'
    const expiresAt = Date.now() + TOKEN_TTL_MS

    const token = sign({
      r: `ev-${ev.id}`,
      u: user.id,
      n: name,
      ro: role,
      e: expiresAt,
      c: ev.capacity, // assinado → meeting-service abre a sala em modo malha
    })

    return v1Json({
      token,
      room: `ev-${ev.id}`,
      role,
      capacity: ev.capacity,
      wsPort: MEETING_WS_PORT,
      expiresAt: new Date(expiresAt).toISOString(),
    })
  } catch (err) {
    console.error('GET /api/v1/events/[id]/meeting-token', err)
    return v1Error('Erro ao abrir a sala.', 500)
  }
}
