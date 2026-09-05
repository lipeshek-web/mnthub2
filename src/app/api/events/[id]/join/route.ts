import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'
import { loadEvent, serializeEvent } from '@/lib/events'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

type JoinResult =
  | { ok: true }
  | { ok: false; error: string; status: number; code?: string }

/**
 * POST /api/events/[id]/join — reserva o assento do usuário no evento
 * (409 EVENT_FULL quando a sala está cheia). DELETE — libera o assento.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  const { id } = await ctx.params

  let result: JoinResult
  try {
    result = await db.$transaction<JoinResult>(
      async (tx) => {
        const ev = await tx.event.findUnique({
          where: { id },
          include: { participants: true },
        })
        if (!ev) return { ok: false, error: 'Evento não encontrado.', status: 404 }
        if (ev.status === 'CANCELLED')
          return { ok: false, error: 'Este evento foi cancelado.', status: 410 }
        if (ev.hostId === session.id)
          return { ok: false, error: 'Você já é o anfitrião deste evento.', status: 400 }

        const seat = ev.participants.find((p) => p.userId === session.id)
        if (seat) return { ok: true }

        if (ev.participants.length >= ev.capacity) {
          return {
            ok: false,
            error: 'A sala está cheia — todas as vagas foram preenchidas.',
            status: 409,
            code: 'EVENT_FULL',
          }
        }
        await tx.eventParticipant.create({ data: { eventId: id, userId: session.id, role: 'GUEST' } })
        return { ok: true }
      },
      { timeout: 20_000, maxWait: 10_000 }
    )
  } catch (err) {
    console.error('POST /api/events/[id]/join', err)
    return NextResponse.json({ error: 'Erro ao participar do evento.' }, { status: 500 })
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const detail = await loadEvent(id)
  if (!detail) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })

  // avisa o anfitrião (fora da transação; falha silenciosa)
  if (detail.hostId !== session.id) {
    notify({
      userId: detail.hostId,
      kind: 'event_joined',
      title: 'Novo participante',
      body: `${session.name ?? 'Alguém'} entrou no seu evento “${detail.title}”.`,
      linkView: 'dashboard',
    }).catch(() => {})
  }
  return NextResponse.json({ event: serializeEvent(detail, session.id) })
}

/** DELETE /api/events/[id]/join — sai do evento (o anfitrião não pode sair) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  const { id } = await ctx.params
  const ev = await db.event.findUnique({ where: { id } })
  if (!ev) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
  if (ev.hostId === session.id) {
    return NextResponse.json(
      { error: 'O anfitrião não sai do próprio evento — cancele o evento se precisar.' },
      { status: 400 }
    )
  }
  await db.eventParticipant.deleteMany({ where: { eventId: id, userId: session.id } })
  const detail = await loadEvent(id)
  return NextResponse.json({ event: detail ? serializeEvent(detail, session.id) : null })
}
