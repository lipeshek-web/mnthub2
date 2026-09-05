// Agregação da HOME do aluno — compartilhada entre /api/v1/dashboard (formato
// antigo, compatível) e /api/v1/home (bootstrap em UMA chamada: usuário +
// badges + dashboard + contadores de mensagens).
import { db } from '@/lib/db'
import {
  loadCourseListStats,
  loadMobileBookings,
  mobileCourseListSelect,
  serializeMobileBooking,
  serializeMobileCourseCardFromStats,
  serializeMobileLibraryCard,
} from '@/lib/api-v1-serialize'

export interface DashboardEnrolledCourse {
  id: string
  title: string
  coverUrl: string | null
  category: string
  completedLessons: number
  totalLessons: number
  progressPct: number
}

export interface DashboardPayload {
  enrolledCourses: DashboardEnrolledCourse[]
  upcomingBookings: ReturnType<typeof serializeMobileBooking>[]
  newBooks: ReturnType<typeof serializeMobileLibraryCard>[]
  recommendedCourses: ReturnType<typeof serializeMobileCourseCardFromStats>[]
  weeklyGoal: { targetLessons: number; doneLessons: number } | null
}

/** Monta a home do aluno: cursos em andamento, próximas sessões, livros e recomendações */
export async function buildDashboardPayload(userId: string, origin: string): Promise<DashboardPayload> {
  // Cursos em andamento com progresso calculado
  const enrollments = await db.enrollment.findMany({
    where: { studentId: userId },
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
  const upcoming = await loadMobileBookings(userId, { upcomingOnly: true, take: 5 })

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
    select: mobileCourseListSelect(),
    orderBy: { enrollments: { _count: 'desc' } },
    take: 6,
  })
  const { courseStats, mentorStats } = await loadCourseListStats(
    recommended.map((c) => c.id),
    recommended.map((c) => c.mentor.id)
  )

  // Meta semanal (alvo em aulas concluídas; progresso via XpEvent LESSON)
  const goal = await db.weeklyGoal.findUnique({ where: { userId } })
  let weeklyGoal: DashboardPayload['weeklyGoal'] = null
  if (goal) {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const doneLessons = await db.xpEvent.count({
      where: { userId, kind: 'LESSON', createdAt: { gte: monday } },
    })
    weeklyGoal = { targetLessons: goal.targetLessons, doneLessons }
  }

  return {
    enrolledCourses,
    upcomingBookings: upcoming.map((b) => serializeMobileBooking(b)),
    newBooks: newBooks.map((b) => serializeMobileLibraryCard(b, origin)),
    recommendedCourses: recommended.map((c) =>
      serializeMobileCourseCardFromStats(
        c,
        origin,
        false,
        courseStats.get(c.id) ?? {
          lessonCount: 0,
          totalDurationMin: 0,
          liveCount: 0,
          studentCount: 0,
          rating: 0,
          reviewCount: 0,
        },
        mentorStats.get(c.mentor.id) ?? { rating: 0, reviewCount: 0 }
      )
    ),
    weeklyGoal,
  }
}
