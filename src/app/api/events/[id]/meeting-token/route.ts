import type { NextRequest } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/events/[id]/meeting-token — credencial da sala MULTI-PARTICIPANTE.
 *
 * Sala = `ev-<eventId>`, capacidade assinada dentro do token (`c`) — é ela que
 * liga o modo malha no meeting-service. O PAPEL (HOST = anfitrião do evento) é
 * decidido AQUI no servidor; o cliente nunca se autodeclara anfitrião.
 * Só PARTICIPANTE confirmado pega token (o join reserva o assento).
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
  const { id } = await ctx.params

  const ev = await db.event.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, avatarUrl: true } },
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  })
  if (!ev) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
  if (ev.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Este evento foi cancelado.' }, { status: 410 })
  }
  const seat = ev.participants.find((p) => p.userId === session.id)
  if (!seat && ev.hostId !== session.id && session.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Participe do evento para entrar na sala.' },
      { status: 403 }
    )
  }

  const role = ev.hostId === session.id ? 'HOST' : 'GUEST'
  const name = seat && seat.role === 'HOST' ? ev.host.name || session.name : session.name || 'Participante'
  const expiresAt = Date.now() + TOKEN_TTL_MS

  const token = sign({
    r: `ev-${ev.id}`,
    u: session.id,
    n: name,
    ro: role,
    e: expiresAt,
    c: ev.capacity, // assinado → meeting-service abre a sala em modo malha
  })

  return NextResponse.json({
    token,
    room: `ev-${ev.id}`,
    role,
    capacity: ev.capacity,
    wsPort: MEETING_WS_PORT,
    expiresAt: new Date(expiresAt).toISOString(),
  })
}
