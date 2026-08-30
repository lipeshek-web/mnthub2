import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import {
  mobileCourseInclude,
  serializeMobileCourseCard,
  serializeMobileBooking,
  loadMobileBookings,
  serializeMobileLibraryCard,
} from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/** GET /api/v1/dashboard — agregação da home do aluno no app */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const origin = getOrigin(req)

    // Cursos em andamento com progresso calculado
    const enrollments = await db.enrollment.findMany({
      where: { studentId: user.id },
      include: {
        course: { select: { id: true, title: true, coverUrl: true, category: true, _count: { select: { lessons: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
    const enrolledCourses = enrollments
      .map((e) => {
        let completed = 0
        try {
          const parsed = JSON.parse(e.completedLessonIds || '[]')
          if (Array.isArray(parsed)) completed = parsed.length
        } catch {
          completed = 0
        }
        const total = e.course._count.lessons
        return {
          id: e.course.id,
          title: e.course.title,
          coverUrl: e.course.coverUrl ? `${origin}${e.course.coverUrl}` : null,
          category: e.course.category,
          completedLessons: completed,
          totalLessons: total,
          progressPct: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
        }
      })
      .filter((c) => c.totalLessons > 0)

    const enrolledIds = enrollments.map((e) => e.courseId)

    // Próximas sessões (PENDING/CONFIRMED, futuras)
    const upcoming = await loadMobileBookings(user.id, { upcomingOnly: true, take: 5 })

    // Novos livros da biblioteca
    const newBooks = await db.libraryItem.findMany({
      where: { isPublished: true, kind: 'BOOK' },
      include: { mentor: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    })

    // Recomendações: cursos publicados em que o aluno ainda não está inscrito
    const recommended = await db.course.findMany({
      where: { isPublished: true, ...(enrolledIds.length ? { id: { notIn: enrolledIds } } : {}) },
      include: mobileCourseInclude(),
      orderBy: { enrollments: { _count: 'desc' } },
      take: 6,
    })

    // Meta semanal (alvo em aulas concluídas; progresso via XpEvent LESSON)
    const goal = await db.weeklyGoal.findUnique({ where: { userId: user.id } })
    let weeklyGoal: { targetLessons: number; doneLessons: number } | null = null
    if (goal) {
      const now = new Date()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      const doneLessons = await db.xpEvent.count({
        where: { userId: user.id, kind: 'LESSON', createdAt: { gte: monday } },
      })
      weeklyGoal = { targetLessons: goal.targetLessons, doneLessons }
    }

    return v1Json({
      user: {
        xp: user.xp,
        studyStreak: user.activeStreak,
        longestStreak: user.longestStreak,
      },
      enrolledCourses,
      upcomingBookings: upcoming.map((b) => serializeMobileBooking(b)),
      newBooks: newBooks.map((b) => serializeMobileLibraryCard(b, origin)),
      recommendedCourses: recommended.map((c) => serializeMobileCourseCard(c, origin, false)),
      weeklyGoal,
    })
  } catch (err) {
    console.error('GET /api/v1/dashboard', err)
    return v1Error('Erro ao carregar o painel.', 500)
  }
}
