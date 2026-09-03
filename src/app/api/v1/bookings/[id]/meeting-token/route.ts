import type { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/bookings/[id]/meeting-token — credencial da sala de vídeo (app mobile).
 *
 * Mesmo contrato da rota web (/api/bookings/[id]/meeting-token), autenticado
 * pelo JWT do app (Authorization: Bearer). O PAPEL (HOST = mentor) é decidido
 * AQUI no servidor a partir do booking e vai assinado (HMAC) dentro do token —
 * o cliente nunca se autodeclara anfitrião.
 *
 * O token é curto (12h) e contém sala, usuário, nome e papel. A sala em si é
 * atendida pelo meeting-service (:3004, sinalização socket.io) e a página que
 * roda dentro do WebView do app é a /live.html (estática, sem sessão web).
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

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true, name: true } } } },
        mentee: { select: { id: true, name: true } },
      },
    })
    if (!booking) return v1Error('Sessão não encontrada.', 404)

    const isMentor = booking.mentor.userId === user.id
    const isMentee = booking.menteeId === user.id
    if (!isMentor && !isMentee && user.role !== 'ADMIN') {
      return v1Error('Sem acesso a esta sala.', 403)
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return v1Error('Esta sessão não tem mais sala ativa.', 403)
    }

    const displayName = isMentor ? booking.mentor.user.name : booking.mentee.name
    const role = isMentor ? 'HOST' : 'GUEST'
    const expiresAt = Date.now() + TOKEN_TTL_MS

    const token = sign({
      r: booking.id,
      u: user.id,
      n: displayName,
      ro: role,
      e: expiresAt,
    })

    return v1Json({
      token,
      room: booking.id,
      role,
      wsPort: MEETING_WS_PORT,
      expiresAt: new Date(expiresAt).toISOString(),
    })
  } catch (err) {
    console.error('GET /api/v1/bookings/[id]/meeting-token', err)
    return v1Error('Erro ao abrir a sala.', 500)
  }
}
