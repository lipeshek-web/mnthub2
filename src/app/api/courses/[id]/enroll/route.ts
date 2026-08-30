import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { awardXp, XP_COURSE, XP_LESSON } from '@/lib/xp'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** POST /api/courses/[id]/enroll — inscreve o usuário no curso */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const course = await db.course.findUnique({
      where: { id },
      include: { mentor: { select: { userId: true } } },
    })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (!course.isPublished) {
      return NextResponse.json({ error: 'Este curso ainda não está publicado.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const existing = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: userId } },
    })
    if (existing) return NextResponse.json({ ok: true, alreadyEnrolled: true })

    await db.enrollment.create({ data: { courseId: id, studentId: userId } })
    // Notifica o mentor sobre o novo aluno
    await notify({
      userId: course.mentor.userId,
      kind: 'enrollment_new',
      title: `Novo aluno em "${course.title}" 🎉`,
      body: `${user.name} acabou de se inscrever no seu curso.`,
      linkView: 'onboarding',
      refId: course.id,
    })
    return NextResponse.json({ ok: true, alreadyEnrolled: false })
  } catch (err) {
    console.error('POST /api/courses/[id]/enroll', err)
    return NextResponse.json({ error: 'Erro ao realizar inscrição' }, { status: 500 })
  }
}

/** PATCH /api/courses/[id]/enroll — alterna conclusão de uma aula do usuário */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const lessonId = String(body?.lessonId ?? '')
    if (!userId || !lessonId) {
      return NextResponse.json({ error: 'Usuário ou aula não informados.' }, { status: 400 })
    }

    const enrollment = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: userId } },
    })
    if (!enrollment) {
      return NextResponse.json({ error: 'Você precisa estar inscrito no curso.' }, { status: 403 })
    }

    const lesson = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.courseId !== id) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    }

    let completed: string[] = []
    try {
      const parsed = JSON.parse(enrollment.completedLessonIds || '[]')
      if (Array.isArray(parsed)) completed = parsed.map(String)
    } catch {
      completed = []
    }

    const wasCompleted = completed.includes(lessonId)
    const next = wasCompleted
      ? completed.filter((x) => x !== lessonId)
      : [...completed, lessonId]

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { completedLessonIds: JSON.stringify(next) },
    })

    // Gamificação: XP por aula concluída (ledger anti-farm) + bônus ao fechar 100%
    let xpAwarded = 0
    let courseCompleted = false
    if (!wasCompleted) {
      xpAwarded = await awardXp(userId, 'LESSON', lessonId, XP_LESSON)
      const totalLessons = await db.lesson.count({ where: { courseId: id } })
      if (totalLessons > 0 && next.length >= totalLessons) {
        courseCompleted = true
        const enrData: { completedAt: Date; bonusAwarded?: boolean } = { completedAt: new Date() }
        if (!enrollment.bonusAwarded) {
          const bonus = await awardXp(userId, 'COURSE', id, XP_COURSE)
          if (bonus > 0) {
            enrData.bonusAwarded = true
            xpAwarded += bonus
          }
        }
        await db.enrollment.update({ where: { id: enrollment.id }, data: enrData })
      }
    }

    return NextResponse.json({ completedLessonIds: next, xpAwarded, courseCompleted })
  } catch (err) {
    console.error('PATCH /api/courses/[id]/enroll', err)
    return NextResponse.json({ error: 'Erro ao atualizar progresso' }, { status: 500 })
  }
}
