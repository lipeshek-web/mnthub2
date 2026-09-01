import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mentor/questions?status=pending|answered|all
 * Caixa de entrada das dúvidas das aulas: TODAS as perguntas dos cursos do
 * mentor em um só lugar (sem precisar abrir aula por aula), com contexto de
 * curso/aula e contadores. Identidade via SESSÃO — nunca via query.
 */
export async function GET(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()

  try {
    const mentor = await db.mentorProfile.findUnique({ where: { userId: session.id } })

    // Sem perfil de mentor: nada a listar (resposta vazia em vez de 403 —
    // a aba some para quem não é mentor).
    if (!mentor) {
      return NextResponse.json({ counts: { total: 0, pending: 0, answered: 0 }, items: [] })
    }

    const status = (new URL(req.url).searchParams.get('status') ?? 'all').toLowerCase()
    const ownedCourses = { course: { mentorId: mentor.id } }
    const statusFilter =
      status === 'pending' ? { answer: null as string | null } : status === 'answered' ? { answer: { not: null } } : {}

    const where = { ...ownedCourses, ...statusFilter }

    const [total, pending, answered, items] = await Promise.all([
      db.lessonQuestion.count({ where: ownedCourses }),
      db.lessonQuestion.count({ where: { ...ownedCourses, answer: null } }),
      db.lessonQuestion.count({ where: { ...ownedCourses, answer: { not: null } } }),
      db.lessonQuestion.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          course: { select: { id: true, title: true } },
          lesson: { select: { id: true, title: true } },
        },
        // Pendentes primeiro (NULLs antes em ASC no SQLite), mais recentes no topo
        orderBy: [{ answer: 'asc' }, { createdAt: 'desc' }],
        take: 300,
      }),
    ])

    return NextResponse.json({
      counts: { total, pending, answered },
      items: items.map((q) => ({
        id: q.id,
        body: q.body,
        answer: q.answer,
        answeredAt: q.answeredAt ? q.answeredAt.toISOString() : null,
        createdAt: q.createdAt.toISOString(),
        author: { id: q.user.id, name: q.user.name, avatarUrl: q.user.avatarUrl },
        course: { id: q.course.id, title: q.course.title },
        lesson: { id: q.lesson.id, title: q.lesson.title },
      })),
    })
  } catch (err) {
    console.error('GET /api/mentor/questions', err)
    return NextResponse.json({ error: 'Erro ao carregar as perguntas.' }, { status: 500 })
  }
}
