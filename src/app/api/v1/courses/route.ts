import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUserId } from '@/lib/mobile-auth'
import { CACHE_NO_STORE, CACHE_PUBLIC_LIST, getOrigin, pageParams, v1Error, v1Json } from '@/lib/api-v1'
import {
  loadCourseListStats,
  mobileCourseListSelect,
  serializeMobileCourseCardFromStats,
} from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/courses — cursos publicados (?q=&category=&level=&page=) com flag
 * enrolled. Estatísticas (aulas, alunos, notas) vêm de agregados — o card fica
 * idêntico, mas a consulta deixa de carregar TODAS as aulas/avaliações/inscrições.
 *
 * Cache: sem token → resposta pública cacheável (30s); com token → no-store
 * (a flag `enrolled` é pessoal).
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = sp.get('q')?.trim()
    const category = sp.get('category')?.trim()
    const level = sp.get('level')?.trim()
    const { page, pageSize, skip, take } = pageParams(req)

    const where = {
      isPublished: true,
      ...(category ? { category } : {}),
      ...(level ? { level } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        select: mobileCourseListSelect(),
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.course.count({ where }),
    ])

    // Marca os cursos em que o aluno (se autenticado) já está inscrito
    const userId = getMobileUserId(req)
    let enrolledIds = new Set<string>()
    if (userId) {
      const rows = await db.enrollment.findMany({
        where: { studentId: userId, courseId: { in: courses.map((c) => c.id) } },
        select: { courseId: true },
      })
      enrolledIds = new Set(rows.map((r) => r.courseId))
    }

    const { courseStats, mentorStats } = await loadCourseListStats(
      courses.map((c) => c.id),
      courses.map((c) => c.mentor.id)
    )

    const origin = getOrigin(req)
    const cacheHeader = userId ? { 'Cache-Control': CACHE_NO_STORE } : { 'Cache-Control': CACHE_PUBLIC_LIST }
    return v1Json(
      {
        items: courses.map((c) =>
          serializeMobileCourseCardFromStats(
            c,
            origin,
            enrolledIds.has(c.id),
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
        page,
        pageSize,
        total,
        hasMore: skip + courses.length < total,
      },
      200,
      cacheHeader
    )
  } catch (err) {
    console.error('GET /api/v1/courses', err)
    return v1Error('Erro ao listar cursos.', 500)
  }
}
