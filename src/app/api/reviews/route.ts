import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'
import { rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** POST /api/reviews — mentorado avalia uma sessão concluída (autor = usuário da SESSÃO) */
export async function POST(req: NextRequest) {
  try {
    // Sessão em vez de userId do body — avaliação forjada em nome de outro aluno
    const session = await resolveUser(req)
    if (!session) return unauthorized()
    const gate = rateLimit(`review:${session.id}`, 10, 10 * 60_000)
    if (!gate.ok) return tooMany(gate.retryAfterSec)

    const body = await req.json()
    const bookingId = String(body?.bookingId ?? '')
    const userId = session.id
    const rating = Number(body?.rating ?? 0)
    const comment = String(body?.comment ?? '').trim()

    if (!bookingId) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Escolha uma nota de 1 a 5 estrelas.' }, { status: 400 })
    }
    if (comment.length < 10) {
      return NextResponse.json({ error: 'Escreva um comentário com pelo menos 10 caracteres.' }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { mentor: { include: { user: true } } },
    })
    if (!booking) return NextResponse.json({ error: 'Sessão não encontrada.' }, { status: 404 })
    if (booking.menteeId !== userId)
      return NextResponse.json({ error: 'Apenas o mentorado pode avaliar a sessão.' }, { status: 403 })
    if (booking.status !== 'COMPLETED')
      return NextResponse.json({ error: 'Você poderá avaliar quando a sessão for concluída.' }, { status: 400 })

    const existing = await db.review.findUnique({ where: { bookingId } })
    if (existing)
      return NextResponse.json({ error: 'Esta sessão já foi avaliada.' }, { status: 409 })

    const review = await db.review.create({
      data: { bookingId, mentorId: booking.mentorId, authorId: userId, rating, comment },
    })

    // Notifica o mentor sobre a nova avaliação da sessão
    await notify({
      userId: booking.mentor.userId,
      kind: 'review_new',
      title: `Nova avaliação de ${rating} estrela${rating === 1 ? '' : 's'} ⭐`,
      body: `${booking.topic} — "${comment.slice(0, 120)}"`,
      linkView: 'dashboard',
      refId: review.id,
    })

    return NextResponse.json({ id: review.id, ok: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reviews', err)
    return NextResponse.json({ error: 'Erro ao enviar avaliação' }, { status: 500 })
  }
}
