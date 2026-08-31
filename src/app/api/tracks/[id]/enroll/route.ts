import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** POST /api/tracks/[id]/enroll — inscreve na trilha gratuita (cursos liberados junto) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId do body — matricular outro aluno na trilha (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para se inscrever.')
    const { id } = await ctx.params
    await req.json().catch(() => ({}))
    const userId = session.id

    const track = await db.track.findUnique({
      where: { id },
      include: { items: { where: { type: 'COURSE' }, select: { courseId: true } } },
    })
    if (!track || !track.isPublished) {
      return NextResponse.json({ error: 'Trilha não encontrada.' }, { status: 404 })
    }

    const existing = await db.trackEnrollment.findUnique({
      where: { trackId_studentId: { trackId: id, studentId: userId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Você já tem acesso a esta trilha.' }, { status: 409 })
    }
    if (track.price > 0) {
      return NextResponse.json(
        { error: 'Esta trilha é paga — finalize o checkout para ter acesso.' },
        { status: 402 }
      )
    }

    // Matrícula na trilha + em todos os cursos dela
    await db.$transaction([
      db.trackEnrollment.create({ data: { trackId: id, studentId: userId } }),
      ...track.items
        .filter((i): i is { courseId: string } => Boolean(i.courseId))
        .map((i) =>
          db.enrollment.upsert({
            where: { courseId_studentId: { courseId: i.courseId, studentId: userId } },
            create: { courseId: i.courseId, studentId: userId, completedLessonIds: '[]' },
            update: {},
          })
        ),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/tracks/[id]/enroll', err)
    return NextResponse.json({ error: 'Erro ao se inscrever na trilha.' }, { status: 500 })
  }
}
