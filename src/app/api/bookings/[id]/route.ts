import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/bookings/[id]
 * body: { userId, action: 'confirm' | 'cancel' | 'complete' }
 */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const action = String(body?.action ?? '')

    if (!userId || !['confirm', 'cancel', 'complete'].includes(action)) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { id },
      include: { mentor: true },
    })
    if (!booking) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })

    const isMentor = booking.mentor.userId === userId
    const isMentee = booking.menteeId === userId

    if (action === 'confirm') {
      if (!isMentor) return NextResponse.json({ error: 'Apenas o mentor pode confirmar.' }, { status: 403 })
      if (booking.status !== 'PENDING')
        return NextResponse.json({ error: 'Esta sessão não pode mais ser confirmada.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'CONFIRMED' } })
    }

    if (action === 'cancel') {
      if (!isMentor && !isMentee)
        return NextResponse.json({ error: 'Sem permissão para cancelar.' }, { status: 403 })
      if (!['PENDING', 'CONFIRMED'].includes(booking.status))
        return NextResponse.json({ error: 'Esta sessão não pode mais ser cancelada.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'CANCELLED' } })
    }

    if (action === 'complete') {
      if (!isMentor) return NextResponse.json({ error: 'Apenas o mentor pode concluir a sessão.' }, { status: 403 })
      if (booking.status !== 'CONFIRMED')
        return NextResponse.json({ error: 'Apenas sessões confirmadas podem ser concluídas.' }, { status: 400 })
      await db.booking.update({ where: { id }, data: { status: 'COMPLETED' } })
    }

    const updated = await db.booking.findUnique({ where: { id }, select: { id: true, status: true } })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/bookings/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}
