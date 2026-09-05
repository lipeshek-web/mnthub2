import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { addMinutesNaive, eventWindowState, loadEvent, serializeEvent, sortEvents, validateEventInput } from '@/lib/events'
import { rateLimit } from '@/lib/rate-limit'
import { nowNaive } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/v1/events?scope=upcoming|mine|hosting — eventos com estado ao vivo.
 * POST /api/v1/events — cria um evento (criador vira anfitrião). Qualquer
 * membro pode criar: círculo de estudos, plantão de dúvidas, defesa simulada…
 * A sala multi-participante roda dentro da plataforma (WebRTC mesh), sem
 * YouTube/Meet externo.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const scope = req.nextUrl.searchParams.get('scope') ?? 'upcoming'
    const now = nowNaive()

    const where =
      scope === 'mine'
        ? { participants: { some: { userId: user.id } } }
        : scope === 'hosting'
          ? { hostId: user.id }
          : { status: 'SCHEDULED', startsAt: { gte: addMinutesNaive(now, -26 * 60) } }

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
      take: 60,
    })

    // inclui eventos que já começaram (ao vivo) e corta os encerrados
    const visible = items.filter((ev) => scope === 'upcoming' ? !eventWindowState(ev.startsAt, ev.durationMin).ended : true)
    const body = sortEvents(visible).map((ev) => serializeEvent(ev, user.id))
    return v1Json({ items: body, total: body.length })
  } catch (err) {
    console.error('GET /api/v1/events', err)
    return v1Error('Erro ao listar eventos.', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const gate = rateLimit(`event-create:${user.id}`, 6, 60 * 60_000)
    if (!gate.ok) return v1Error('Muitos eventos criados em sequência. Tente mais tarde.', 429)

    const input = await req.json().catch(() => ({}))
    const parsed = validateEventInput(input)
    if ('error' in parsed) return v1Error(parsed.error, 400, 'VALIDATION')

    const ev = await db.event.create({
      data: {
        ...parsed,
        hostId: user.id,
        participants: { create: { userId: user.id, role: 'HOST' } },
      },
    })
    const detail = await loadEvent(ev.id)
    if (!detail) return v1Error('Erro ao criar o evento.', 500)
    return v1Json({ event: serializeEvent(detail, user.id) }, 201)
  } catch (err) {
    console.error('POST /api/v1/events', err)
    return v1Error('Erro ao criar o evento.', 500)
  }
}
