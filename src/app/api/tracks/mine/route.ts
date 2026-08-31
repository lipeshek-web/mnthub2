import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { serializeTrack, trackBaseInclude, type TrackRow } from '@/lib/tracks-serialize'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/tracks/mine — trilhas em que o usuário da SESSÃO está inscrito, com progresso */
export async function GET(req: NextRequest) {
  try {
    // Sessão em vez de userId da query — histórico de matrículas de outro usuário
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')
    const userId = session.id

    const enrollments = await db.trackEnrollment.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
    })
    if (enrollments.length === 0) return NextResponse.json([])

    const trackIds = enrollments.map((e) => e.trackId)
    const tracks = (await db.track.findMany({
      where: { id: { in: trackIds } },
      include: trackBaseInclude(),
    })) as unknown as TrackRow[]

    // Progresso por curso do usuário
    const allCourseIds = tracks
      .flatMap((t) => t.items.filter((i) => i.type === 'COURSE' && i.course).map((i) => i.course!.id))
    const myCourseEnrollments = await db.enrollment.findMany({
      where: { studentId: userId, courseId: { in: allCourseIds } },
      select: { courseId: true, completedLessonIds: true },
    })
    const completedByCourse = new Map<string, number>()
    for (const ce of myCourseEnrollments) {
      try {
        const parsed = JSON.parse(ce.completedLessonIds || '[]')
        completedByCourse.set(ce.courseId, Array.isArray(parsed) ? parsed.length : 0)
      } catch {
        completedByCourse.set(ce.courseId, 0)
      }
    }

    const items = tracks.map((t) => {
      const base = serializeTrack(t)
      const courseItems = t.items.filter((i) => i.type === 'COURSE' && i.course)
      const totals = courseItems.map((i) => ({
        courseId: i.course!.id,
        completed: completedByCourse.get(i.course!.id) ?? 0,
        total: i.course!.lessons.length,
      }))
      const completedAll = totals.reduce((a, x) => a + x.completed, 0)
      const totalAll = totals.reduce((a, x) => a + x.total, 0)
      const percent = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0
      return {
        ...base,
        enrolledAt: enrollments.find((e) => e.trackId === t.id)?.createdAt.toISOString() ?? null,
        percent,
        perCourse: totals,
      }
    })

    items.sort((a, b) => (b.enrolledAt ?? '').localeCompare(a.enrolledAt ?? ''))
    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/tracks/mine', err)
    return NextResponse.json({ error: 'Erro ao carregar suas trilhas.' }, { status: 500 })
  }
}
