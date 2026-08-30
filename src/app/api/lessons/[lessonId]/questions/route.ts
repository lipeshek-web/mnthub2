import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/lessons/[lessonId]/questions?userId= — Q&A da aula (inscrito ou dono) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { mentor: true } } },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    const isOwner = Boolean(userId && lesson.course.mentor.userId === userId)
    let enrolled = false
    if (userId && !isOwner) {
      const enr = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId: lesson.courseId, studentId: userId } },
      })
      enrolled = Boolean(enr)
    }
    if (!isOwner && !enrolled) {
      return NextResponse.json({ error: 'Sem acesso a esta aula.' }, { status: 403 })
    }

    const questions = await db.lessonQuestion.findMany({
      where: { lessonId },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      questions.map((q) => ({
        id: q.id,
        body: q.body,
        answer: q.answer,
        answeredAt: q.answeredAt ? q.answeredAt.toISOString() : null,
        createdAt: q.createdAt.toISOString(),
        author: { id: q.user.id, name: q.user.name, avatarUrl: q.user.avatarUrl },
        isMine: q.userId === userId,
      }))
    )
  } catch (err) {
    console.error('GET /api/lessons/[lessonId]/questions', err)
    return NextResponse.json({ error: 'Erro ao carregar perguntas.' }, { status: 500 })
  }
}

/** POST /api/lessons/[lessonId]/questions — aluno inscrito pergunta */
export async function POST(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const text = String(body?.body ?? '').trim()

    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })
    if (text.length < 5) {
      return NextResponse.json({ error: 'Escreva sua pergunta (mín. 5 caracteres).' }, { status: 400 })
    }

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { mentor: true } } },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    // Mentor dono não pergunta; aluno precisa estar inscrito
    if (lesson.course.mentor.userId === userId) {
      return NextResponse.json({ error: 'O mentor responde pelas perguntas da aula.' }, { status: 403 })
    }
    const enr = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: lesson.courseId, studentId: userId } },
    })
    if (!enr) {
      return NextResponse.json({ error: 'Inscreva-se no curso para perguntar.' }, { status: 403 })
    }

    const question = await db.lessonQuestion.create({
      data: { lessonId, courseId: lesson.courseId, userId, body: text.slice(0, 1200) },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    })

    return NextResponse.json({
      id: question.id,
      body: question.body,
      answer: null,
      answeredAt: null,
      createdAt: question.createdAt.toISOString(),
      author: { id: question.user.id, name: question.user.name, avatarUrl: question.user.avatarUrl },
      isMine: true,
    })
  } catch (err) {
    console.error('POST /api/lessons/[lessonId]/questions', err)
    return NextResponse.json({ error: 'Erro ao enviar pergunta.' }, { status: 500 })
  }
}
