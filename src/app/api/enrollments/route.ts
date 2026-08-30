import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/enrollments?userId= — cursos em que o usuário está inscrito, com progresso */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const enrollments = await db.enrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          include: {
            mentor: {
              include: {
                user: { select: { id: true, name: true, avatarUrl: true } },
                reviews: { select: { rating: true } },
              },
            },
            lessons: { select: { durationMin: true } },
            enrollments: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items = enrollments.map((enr) => {
      const course = enr.course
      const rating =
        course.mentor.reviews.length > 0
          ? Math.round(
              (course.mentor.reviews.reduce((a, r) => a + r.rating, 0) / course.mentor.reviews.length) * 10
            ) / 10
          : 0

      let completed: string[] = []
      try {
        const parsed = JSON.parse(enr.completedLessonIds || '[]')
        if (Array.isArray(parsed)) completed = parsed.map(String)
      } catch {
        completed = []
      }

      return {
        courseId: course.id,
        enrolledAt: enr.createdAt.toISOString(),
        completedLessonIds: completed,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          price: course.price,
          isPublished: course.isPublished,
          coverUrl: course.coverUrl,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
          mentor: {
            id: course.mentor.id,
            userId: course.mentor.userId,
            name: course.mentor.user.name,
            headline: course.mentor.headline,
            rating,
            reviewCount: course.mentor.reviews.length,
            avatarUrl: course.mentor.user.avatarUrl,
          },
          lessonCount: course.lessons.length,
          totalDurationMin: course.lessons.reduce((a, l) => a + l.durationMin, 0),
          studentCount: course.enrollments.length,
        },
      }
    })

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/enrollments', err)
    return NextResponse.json({ error: 'Erro ao carregar matrículas' }, { status: 500 })
  }
}
