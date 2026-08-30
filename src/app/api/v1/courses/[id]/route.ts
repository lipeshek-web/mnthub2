import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import { mobileCourseInclude, serializeMobileCourseCard, serializeMobileLesson } from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/** GET /api/v1/courses/[id] — detalhe com temas, aulas e progresso do aluno */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const { id } = await ctx.params

    const course = await db.course.findFirst({
      where: { id, isPublished: true },
      include: {
        ...mobileCourseInclude(),
        themes: { orderBy: { order: 'asc' } },
      },
    })
    if (!course) return v1Error('Curso não encontrado.', 404)

    const [lessons, enrollment] = await Promise.all([
      db.lesson.findMany({
        where: { courseId: id },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      db.enrollment.findUnique({
        where: { courseId_studentId: { courseId: id, studentId: user.id } },
        select: { completedLessonIds: true, completedAt: true },
      }),
    ])

    const enrolled = Boolean(enrollment)
    let completedLessonIds: string[] = []
    if (enrollment) {
      try {
        const parsed = JSON.parse(enrollment.completedLessonIds || '[]')
        if (Array.isArray(parsed)) completedLessonIds = parsed.map(String)
      } catch {
        completedLessonIds = []
      }
    }

    const origin = getOrigin(req)
    const serialize = (l: (typeof lessons)[number]) =>
      serializeMobileLesson(l, !enrolled) // não inscrito → aulas travadas (sem conteúdo)

    // Aulas agrupadas por tema (na ordem do tema) + soltas no array de topo
    const lessonsByTheme = new Map<string, typeof lessons>()
    const loose: typeof lessons = []
    for (const lesson of lessons) {
      if (lesson.themeId) {
        const list = lessonsByTheme.get(lesson.themeId) ?? []
        list.push(lesson)
        lessonsByTheme.set(lesson.themeId, list)
      } else {
        loose.push(lesson)
      }
    }

    return v1Json({
      course: serializeMobileCourseCard(course, origin, enrolled),
      themes: course.themes.map((theme) => ({
        id: theme.id,
        title: theme.title,
        description: theme.description,
        order: theme.order,
        lessons: (lessonsByTheme.get(theme.id) ?? []).map(serialize),
      })),
      lessons: loose.map(serialize),
      enrollment: enrolled ? { completedLessonIds, completedAt: enrollment!.completedAt?.toISOString() ?? null } : null,
    })
  } catch (err) {
    console.error('GET /api/v1/courses/[id]', err)
    return v1Error('Erro ao carregar curso.', 500)
  }
}
