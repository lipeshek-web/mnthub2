import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { awardXp, XP_LESSON, XP_COURSE } from '@/lib/xp'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** POST /api/v1/courses/[id]/enroll — inscreve o aluno (gratuito; pago → 402) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params

    const course = await db.course.findFirst({
      where: { id, isPublished: true },
      include: { mentor: { select: { userId: true } } },
    })
    if (!course) return v1Error('Curso não encontrado.', 404)

    const existing = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: user.id } },
    })
    if (existing) return v1Json({ ok: true, alreadyEnrolled: true })

    // No mobile não há checkout: cursos pagos são comprados pelo site
    if (course.price > 0) {
      return v1Json(
        { error: 'Este curso é pago. A compra é feita pelo site do MentorHub.', price: course.price },
        402
      )
    }

    await db.enrollment.create({ data: { courseId: id, studentId: user.id } })
    await notify({
      userId: course.mentor.userId,
      kind: 'enrollment_new',
      title: `Novo aluno em "${course.title}" 🎉`,
      body: `${user.name} acabou de se inscrever no seu curso (via app).`,
      linkView: 'onboarding',
      refId: course.id,
    })
    return v1Json({ ok: true, alreadyEnrolled: false })
  } catch (err) {
    console.error('POST /api/v1/courses/[id]/enroll', err)
    return v1Error('Erro ao realizar inscrição.', 500)
  }
}

/** PATCH /api/v1/courses/[id]/enroll — alterna conclusão de aula ({ lessonId }) + XP */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params

    const body = await req.json().catch(() => null)
    const lessonId = String(body?.lessonId ?? '')
    if (!lessonId) return v1Error('Aula não informada.', 400)

    const enrollment = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: id, studentId: user.id } },
    })
    if (!enrollment) return v1Error('Você precisa estar inscrito no curso.', 403)

    const lesson = await db.lesson.findUnique({ where: { id: lessonId } })
    if (!lesson || lesson.courseId !== id) return v1Error('Aula não encontrada.', 404)

    let completed: string[] = []
    try {
      const parsed = JSON.parse(enrollment.completedLessonIds || '[]')
      if (Array.isArray(parsed)) completed = parsed.map(String)
    } catch {
      completed = []
    }

    const wasCompleted = completed.includes(lessonId)
    const next = wasCompleted ? completed.filter((x) => x !== lessonId) : [...completed, lessonId]

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: { completedLessonIds: JSON.stringify(next) },
    })

    // Mesma gamificação do site: XP por aula (ledger anti-farm) + bônus ao fechar 100%
    let xpAwarded = 0
    let courseCompleted = false
    if (!wasCompleted) {
      xpAwarded = await awardXp(user.id, 'LESSON', lessonId, XP_LESSON)
      const totalLessons = await db.lesson.count({ where: { courseId: id } })
      if (totalLessons > 0 && next.length >= totalLessons) {
        courseCompleted = true
        const enrData: { completedAt: Date; bonusAwarded?: boolean } = { completedAt: new Date() }
        if (!enrollment.bonusAwarded) {
          const bonus = await awardXp(user.id, 'COURSE', id, XP_COURSE)
          if (bonus > 0) {
            enrData.bonusAwarded = true
            xpAwarded += bonus
          }
        }
        await db.enrollment.update({ where: { id: enrollment.id }, data: enrData })
      }
    }

    return v1Json({ completedLessonIds: next, xpAwarded, courseCompleted })
  } catch (err) {
    console.error('PATCH /api/v1/courses/[id]/enroll', err)
    return v1Error('Erro ao atualizar progresso.', 500)
  }
}
