import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { formatWhen, notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** PATCH /api/v1/bookings/[id] — { action: "cancel" }: aluno cancela a própria sessão */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params

    const body = await req.json().catch(() => null)
    if (String(body?.action ?? '') !== 'cancel') {
      return v1Error('Ação inválida.', 400)
    }

    const booking = await db.booking.findFirst({
      where: { id },
      include: { mentor: { select: { userId: true } } },
    })
    if (!booking) return v1Error('Sessão não encontrada.', 404)
    if (booking.menteeId !== user.id) {
      return v1Error('Você só pode cancelar as suas próprias sessões.', 403)
    }
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return v1Error('Esta sessão não pode mais ser cancelada.', 400)
    }

    await db.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
    await notify({
      userId: booking.mentor.userId,
      kind: 'booking_cancelled',
      title: `${user.name} cancelou uma sessão`,
      body: `Tema: ${booking.topic} · ${formatWhen(booking.startsAt)}`,
      linkView: 'dashboard',
      refId: booking.id,
    })

    return v1Json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/v1/bookings/[id]', err)
    return v1Error('Erro ao cancelar sessão.', 500)
  }
}
