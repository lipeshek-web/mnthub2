import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/courses/[id]/duplicate — cria uma cópia do curso (rascunho, sem alunos).
 * body: { userId }
 * Clona temas, aulas (vídeo/texto/leitura/live, anexos e ordem) e os quizzes das aulas.
 * Matrículas e progresso NÃO são copiados.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const course = await db.course.findUnique({
      where: { id },
      include: {
        mentor: true,
        themes: { orderBy: { order: 'asc' } },
        lessons: { orderBy: { order: 'asc' }, include: { quizzes: { orderBy: { order: 'asc' } } } },
      },
    })
    if (!course) return NextResponse.json({ error: 'Curso não encontrado.' }, { status: 404 })
    if (course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Você não tem permissão neste curso.' }, { status: 403 })
    }

    // Título único: " (cópia)", " (cópia 2)", ...
    const existingTitles = await db.course.findMany({
      where: { mentorId: course.mentorId, title: { startsWith: course.title } },
      select: { title: true },
    })
    let copyTitle = `${course.title} (cópia)`
    let n = 2
    while (existingTitles.some((c) => c.title === copyTitle)) {
      copyTitle = `${course.title} (cópia ${n})`
      n++
    }

    const clone = await db.course.create({
      data: {
        mentorId: course.mentorId,
        title: copyTitle.slice(0, 160),
        description: course.description,
        category: course.category,
        level: course.level,
        price: course.price,
        coverUrl: course.coverUrl,
        isPublished: false, // sempre nasce como rascunho
        mentorshipCount: course.mentorshipCount,
      },
    })

    // Clona temas (guarda mapa old->new p/ religar as aulas)
    const themeMap = new Map<string, string>()
    for (const theme of course.themes) {
      const created = await db.courseTheme.create({
        data: {
          courseId: clone.id,
          title: theme.title,
          description: theme.description,
          order: theme.order,
        },
      })
      themeMap.set(theme.id, created.id)
    }

    // Clona aulas (+ quizzes)
    for (const lesson of course.lessons) {
      const created = await db.lesson.create({
        data: {
          courseId: clone.id,
          title: lesson.title,
          description: lesson.description,
          kind: lesson.kind,
          videoUrl: lesson.videoUrl,
          content: lesson.content,
          startsAt: lesson.startsAt,
          meetingUrl: lesson.meetingUrl,
          attachments: lesson.attachments,
          durationMin: lesson.durationMin,
          order: lesson.order,
          themeId: lesson.themeId ? themeMap.get(lesson.themeId) ?? null : null,
          libraryItemId: lesson.libraryItemId,
        },
      })
      for (const quiz of lesson.quizzes) {
        await db.quiz.create({
          data: {
            lessonId: created.id,
            prompt: quiz.prompt,
            options: quiz.options,
            correctIndex: quiz.correctIndex,
            explanation: quiz.explanation,
            order: quiz.order,
          },
        })
      }
    }

    return NextResponse.json({ id: clone.id, title: clone.title }, { status: 201 })
  } catch (err) {
    console.error('POST /api/courses/[id]/duplicate', err)
    return NextResponse.json({ error: 'Erro ao duplicar curso' }, { status: 500 })
  }
}
