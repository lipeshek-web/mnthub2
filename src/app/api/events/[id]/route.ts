import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'
import { loadEvent, serializeEvent } from '@/lib/events'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** GET /api/events/[id] — detalhe do evento (participantes, assentos, estado) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  const { id } = await ctx.params
  const ev = await loadEvent(id)
  if (!ev) return NextResponse.json({ error: 'Evento não encontrado.' }, { status: 404 })
  return NextResponse.json({ event: serializeEvent(ev, session?.id) }, { headers: { 'Cache-Control': 'no-store' } })
}

/** DELETE /api/events/[id] — cancela o evento (só o anfitrião) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
  if (ev.hostId !== session.id) {
    return NextResponse.json({ error: 'Apenas o anfitrião pode cancelar o evento.' }, { status: 403 })
  }
  if (ev.status === 'CANCELLED') {
    return NextResponse.json({ ok: true, event: serializeEvent(ev, session.id) })
  }
  const updated = await db.event.update({ where: { id }, data: { status: 'CANCELLED' } })
  void updated
  // avisa os participantes (menos o anfitrião)
  const others = ev.participants.filter((p) => p.userId !== session.id)
  await Promise.all(
    others.map((p) =>
      notify({
        userId: p.userId,
        kind: 'event_cancelled',
        title: 'Evento cancelado',
        body: `“${ev.title}” foi cancelado pelo anfitrião.`,
        linkView: 'dashboard',
      }).catch(() => {})
    )
  )
  return NextResponse.json({ ok: true, event: serializeEvent(ev, session.id) })
}
