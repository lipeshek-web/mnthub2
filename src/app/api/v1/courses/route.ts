import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getMobileUserId } from '@/lib/mobile-auth'
import { getOrigin, pageParams, v1Error, v1Json } from '@/lib/api-v1'
import { mobileCourseInclude, serializeMobileCourseCard } from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/** GET /api/v1/courses — cursos publicados (?q=&category=&level=&page=) com flag enrolled */
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
      db.course.findMany({ where, include: mobileCourseInclude(), orderBy: { createdAt: 'desc' }, skip, take }),
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

    const origin = getOrigin(req)
    return v1Json({
      items: courses.map((c) => serializeMobileCourseCard(c, origin, enrolledIds.has(c.id))),
      page,
      pageSize,
      total,
      hasMore: skip + courses.length < total,
    })
  } catch (err) {
    console.error('GET /api/v1/courses', err)
    return v1Error('Erro ao listar cursos.', 500)
  }
}
