import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id]/meeting-token — credencial da sala de vídeo própria
 * (Órbita Live, sinalização no meeting-service :3004).
 *
 * - Somente mentor ou mentorado da sessão (ADMIN também, p/ suporte) — identidade pela SESSÃO.
 * - Sessões CANCELLED/COMPLETED não têm sala ativa.
 * - O PAPEL (HOST = mentor/anfitrião) é decidido AQUI no servidor a partir do
 *   booking e vai assinado (HMAC) dentro do token — o cliente nunca se autodeclara
 *   anfitrião (o antigo "eu sou o anfitrião" do Jitsi desaparece de vez).
 * - Token de curta duração (12h) contendo sala, usuário, nome e papel.
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
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        mentor: { include: { user: { select: { id: true, name: true } } } },
        mentee: { select: { id: true, name: true } },
      },
    })
    if (!booking) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })

    const isMentor = booking.mentor.userId === session.id
    const isMentee = booking.menteeId === session.id
    if (!isMentor && !isMentee && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sem acesso a esta sala.' }, { status: 403 })
    }
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Esta sessão não tem mais sala ativa.' }, { status: 403 })
    }

    const displayName = isMentor ? booking.mentor.user.name : booking.mentee.name
    const role = isMentor ? 'HOST' : 'GUEST'
    const expiresAt = Date.now() + TOKEN_TTL_MS

    const token = sign({
      r: booking.id,
      u: session.id,
      n: displayName,
      ro: role,
      e: expiresAt,
    })

    return NextResponse.json({
      token,
      room: booking.id,
      role,
      wsPort: MEETING_WS_PORT,
      expiresAt: new Date(expiresAt).toISOString(),
    })
  } catch (err) {
    console.error('GET /api/bookings/[id]/meeting-token', err)
    return NextResponse.json({ error: 'Erro ao abrir a sala.' }, { status: 500 })
  }
}
