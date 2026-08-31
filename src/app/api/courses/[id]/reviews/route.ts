import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/courses/[id]/reviews — avaliações do curso (públicas) + resumo.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const reviews = await db.courseReview.findMany({
      where: { courseId: id },
      include: { student: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const count = reviews.length
    const avg = count > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / count : 0
    const distribution = [5, 4, 3, 2, 1].map(
      (star) => reviews.filter((r) => r.rating === star).length
    )

    return NextResponse.json({
      rating: Math.round(avg * 10) / 10,
      count,
      distribution,
      items: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        student: {
          id: r.student.id,
          name: r.student.name,
          avatarUrl: r.student.avatarUrl,
        },
      })),
    })
  } catch (err) {
    console.error('GET /api/courses/[id]/reviews', err)
    return NextResponse.json({ error: 'Erro ao carregar avaliações' }, { status: 500 })
  }
}

/**
 * POST /api/courses/[id]/reviews — cria/atualiza a avaliação do aluno no curso.
 * body: { userId, rating 1..5, comment }
 * Exige inscrição no curso. Notifica o mentor.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId do body — avaliação forjada em nome de outro aluno (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Entre com sua conta para avaliar o curso.')
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const rating = Number(body?.rating ?? 0)
    const comment = String(body?.comment ?? '').trim()
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Escolha uma nota de 1 a 5 estrelas.' }, { status: 400 })
    }
    if (comment.length > 800) {
      return NextResponse.json({ error: 'Comentário muito longo (máx. 800 caracteres).' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id },
      include: { mentor: { include: { user: true } } },
    })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })

    const enrollment = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: userId } },
    })
    if (!enrollment) {
      return NextResponse.json(
        { error: 'Você precisa estar inscrito no curso para avaliá-lo.' },
        { status: 403 }
      )
    }

    const existing = await db.courseReview.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: userId } },
    })

    const review = await db.courseReview.upsert({
      where: { courseId_studentId: { courseId: id, studentId: userId } },
      create: { courseId: id, studentId: userId, rating, comment },
      update: { rating, comment },
    })

    if (!existing) {
      await notify({
        userId: course.mentor.userId,
        kind: 'course_review_new',
        title: `Nova avaliação no curso "${course.title}"`,
        body: `Um aluno avaliou com ${rating} estrela${rating === 1 ? '' : 's'}.`,
        linkView: 'course',
        refId: course.id,
      })
    }

    return NextResponse.json({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      updated: Boolean(existing),
    })
  } catch (err) {
    console.error('POST /api/courses/[id]/reviews', err)
    return NextResponse.json({ error: 'Erro ao salvar avaliação' }, { status: 500 })
  }
}
