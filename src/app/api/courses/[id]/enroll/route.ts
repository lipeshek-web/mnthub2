import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { awardXp, XP_COURSE, XP_LESSON } from '@/lib/xp'
import { notify } from '@/lib/notify'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** POST /api/courses/[id]/enroll — inscreve o usuário autenticado no curso */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params
    const userId = session.id

    const course = await db.course.findUnique({
      where: { id },
      include: { mentor: { select: { userId: true } } },
    })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (!course.isPublished) {
      return NextResponse.json({ error: 'Este curso ainda não está publicado.' }, { status: 400 })
    }
    // Curso pago exige checkout: matrícula só chega por fulfillment (Order PAID).
    if (course.price > 0) {
      return NextResponse.json(
        { error: 'Este curso é pago — finalize o checkout para ter acesso.' },
        { status: 402 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const existing = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: userId } },
    })
    if (existing) return NextResponse.json({ ok: true, alreadyEnrolled: true })

    try {
      await db.enrollment.create({ data: { courseId: id, studentId: userId } })
    } catch (e) {
      // Corrida de duplo clique: já existe matrícula (P2002) — trata como OK
      const code = (e as { code?: string })?.code
      if (code !== 'P2002') throw e
      return NextResponse.json({ ok: true, alreadyEnrolled: true })
    }
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

/** PATCH /api/courses/[id]/enroll — alterna conclusão de uma aula do usuário autenticado */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const lessonId = String(body?.lessonId ?? '')
    if (!lessonId) {
      return NextResponse.json({ error: 'Aula não informada.' }, { status: 400 })
    }

    const lesson = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.courseId !== id) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    }

    // Transação: leitura + escrita do progresso atômicas (duplo toggle rápido
    // não perde atualizações) + idempotência de XP dentro do mesmo lock
    const result = await db.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({
        where: { courseId_studentId: { courseId: id, studentId: userId } },
      })
      if (!enrollment) {
        return { error: 'Você precisa estar inscrito no curso.', status: 403 as const }
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

      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { completedLessonIds: JSON.stringify(next) },
      })

      return { wasCompleted, next, enrollment }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { wasCompleted, next, enrollment } = result

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
