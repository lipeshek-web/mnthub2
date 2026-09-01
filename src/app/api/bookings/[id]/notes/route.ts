import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/bookings/[id]/notes — minhas anotações privadas desta sessão.
 * PUT — cria/atualiza (upsert) com autosave. Identidade SEMPRE pela sessão;
 * só mentor ou mentorado da sessão têm acesso (mesma regra do PATCH).
 */

const MAX_LEN = 10_000

async function loadParticipantBooking(req: NextRequest, id: string) {
  const session = await resolveUser(req)
  if (!session) return { error: unauthorized() }
  const booking = await db.booking.findUnique({
    where: { id },
    select: {
      id: true,
      mentor: { select: { userId: true } },
      menteeId: true,
    },
  })
  if (!booking) return { error: NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 }) }
  const isParticipant = booking.mentor.userId === session.id || booking.menteeId === session.id
  if (!isParticipant) {
    return { error: NextResponse.json({ error: 'Sem acesso a esta sessão.' }, { status: 403 }) }
  }
  return { session, booking }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const loaded = await loadParticipantBooking(req, id)
    if ('error' in loaded) return loaded.error

    const note = await db.meetingNote.findUnique({
      where: { bookingId_authorId: { bookingId: id, authorId: loaded.session.id } },
      select: { body: true, updatedAt: true },
    })
    return NextResponse.json({ body: note?.body ?? '', updatedAt: note?.updatedAt ?? null })
  } catch (err) {
    console.error('GET /api/bookings/[id]/notes', err)
    return NextResponse.json({ error: 'Erro ao carregar anotações.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const loaded = await loadParticipantBooking(req, id)
    if ('error' in loaded) return loaded.error

    const body = await req.json()
    const text = String(body?.body ?? '').slice(0, MAX_LEN)

    const note = await db.meetingNote.upsert({
      where: { bookingId_authorId: { bookingId: id, authorId: loaded.session.id } },
      create: { bookingId: id, authorId: loaded.session.id, body: text },
      update: { body: text },
      select: { body: true, updatedAt: true },
    })
    return NextResponse.json({ body: note.body, updatedAt: note.updatedAt })
  } catch (err) {
    console.error('PUT /api/bookings/[id]/notes', err)
    return NextResponse.json({ error: 'Erro ao salvar anotações.' }, { status: 500 })
  }
}
