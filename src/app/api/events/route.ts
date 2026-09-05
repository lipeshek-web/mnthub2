import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'
import { rateLimit, tooMany } from '@/lib/rate-limit'
import { addMinutesNaive, eventWindowState, loadEvent, serializeEvent, sortEvents, validateEventInput } from '@/lib/events'
import { nowNaive } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

/**
 * Eventos & Reuniões multi-participante (o diferencial da plataforma):
 * qualquer membro cria um evento (círculo de estudos, plantão de dúvidas,
 * defesa simulada de TCC...) e a sala de vídeo roda DENTRO do Órbita —
 * WebRTC em malha pelo meeting-service, sem YouTube/Meet externo.
 */

/** GET /api/events?scope=upcoming|mine|hosting — lista com estado ao vivo */
export async function GET(req: NextRequest) {
  const session = await resolveUser(req)
  const scope = req.nextUrl.searchParams.get('scope') ?? 'upcoming'
  const now = nowNaive()

  const where =
    scope === 'mine'
      ? session
        ? { participants: { some: { userId: session.id } } }
        : undefined
      : scope === 'hosting'
        ? session
          ? { hostId: session.id }
          : undefined
        : { status: 'SCHEDULED' as const, startsAt: { gte: addMinutesNaive(now, -26 * 60) } }

  const items = await db.event.findMany({
    where,
    include: {
      host: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: { startsAt: 'asc' },
    take: 100,
  })

  // inclui eventos que já começaram (ao vivo) e corta os encerrados
  const visible = items.filter((ev) => scope === 'upcoming' ? !eventWindowState(ev.startsAt, ev.durationMin).ended : true)
  const body = sortEvents(visible).map((ev) => serializeEvent(ev, session?.id))
  return NextResponse.json(
    { items: body, total: body.length },
    { headers: session ? { 'Cache-Control': 'no-store' } : { 'Cache-Control': 'public, max-age=15, stale-while-revalidate=60' } }
  )
}

/** POST /api/events — cria um evento (criador vira anfitrião automaticamente) */
export async function POST(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  const gate = rateLimit(`event-create:${session.id}`, 6, 60 * 60_000)
  if (!gate.ok) return tooMany(gate.retryAfterSec)
  try {
    const input = await req.json()
    const parsed = validateEventInput(input)
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const ev = await db.event.create({
      data: {
        ...parsed,
        hostId: session.id,
        participants: { create: { userId: session.id, role: 'HOST' } },
      },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        participants: {
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })
    return NextResponse.json({ event: serializeEvent(ev, session.id) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/events', err)
    return NextResponse.json({ error: 'Erro ao criar o evento.' }, { status: 500 })
  }
}
