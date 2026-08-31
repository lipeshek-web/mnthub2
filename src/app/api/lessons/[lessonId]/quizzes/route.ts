import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

function parseOptions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/** GET /api/lessons/[lessonId]/quizzes — quizzes da aula (dono vê gabarito; aluno vê tentativas) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    // Identidade SEMPRE pela sessão — userId por query vazava o gabarito
    // (basta passar o mentor.userId, que é público, para virar "dono").
    const session = await resolveUser(req)
    if (!session) return unauthorized()
    const { lessonId } = await ctx.params
    const userId = session.id

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { mentor: true } } },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    const isOwner = Boolean(userId && lesson.course.mentor.userId === userId)
    let hasAccess = isOwner
    if (userId && !isOwner) {
      const enr = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId: lesson.courseId, studentId: userId } },
      })
      hasAccess = Boolean(enr)
    }
    if (!hasAccess) {
      return NextResponse.json({ error: 'Sem acesso a esta aula.' }, { status: 403 })
    }

    const quizzes = await db.quiz.findMany({
      where: { lessonId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        attempts: userId
          ? { where: { userId }, select: { selectedIndex: true, correct: true } }
          : undefined,
      },
    })

    return NextResponse.json(
      quizzes.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        options: parseOptions(q.options),
        // gabarito/explicação só para o dono — aluno recebe após responder (POST attempt)
        correctIndex: isOwner ? q.correctIndex : null,
        explanation: isOwner ? q.explanation : null,
        order: q.order,
        isMine: isOwner,
        myAttempt:
          q.attempts && q.attempts.length > 0
            ? { selectedIndex: q.attempts[0].selectedIndex, correct: q.attempts[0].correct }
            : null,
      }))
    )
  } catch (err) {
    console.error('GET /api/lessons/[lessonId]/quizzes', err)
    return NextResponse.json({ error: 'Erro ao carregar quiz.' }, { status: 500 })
  }
}

/** POST /api/lessons/[lessonId]/quizzes — mentor dono cria pergunta de quiz */
export async function POST(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    const session = await resolveUser(req)
    if (!session) return unauthorized()
    const { lessonId } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const prompt = String(body?.prompt ?? '').trim()
    const explanation = String(body?.explanation ?? '').trim()
    const options = Array.isArray(body?.options)
      ? body.options.map((o: unknown) => String(o ?? '').trim())
      : []
    const correctIndex = Number(body?.correctIndex)

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { include: { mentor: true } } },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    if (lesson.course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Somente o mentor pode editar o quiz.' }, { status: 403 })
    }

    if (prompt.length < 5) {
      return NextResponse.json({ error: 'Escreva a pergunta (mín. 5 caracteres).' }, { status: 400 })
    }
    if (options.length < 2 || options.length > 6 || options.some((o: string) => o.length === 0)) {
      return NextResponse.json(
        { error: 'Informe de 2 a 6 alternativas, todas preenchidas.' },
        { status: 400 }
      )
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      return NextResponse.json({ error: 'Marque qual alternativa é a correta.' }, { status: 400 })
    }

    const last = await db.quiz.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const quiz = await db.quiz.create({
      data: {
        lessonId,
        prompt: prompt.slice(0, 800),
        options: JSON.stringify(options.map((o: string) => o.slice(0, 240))),
        correctIndex,
        explanation: explanation.slice(0, 800),
        order: (last?.order ?? 0) + 1,
      },
    })

    return NextResponse.json({
      id: quiz.id,
      prompt: quiz.prompt,
      options: parseOptions(quiz.options),
      correctIndex: quiz.correctIndex,
      explanation: quiz.explanation,
      order: quiz.order,
      isMine: true,
      myAttempt: null,
    })
  } catch (err) {
    console.error('POST /api/lessons/[lessonId]/quizzes', err)
    return NextResponse.json({ error: 'Erro ao criar pergunta do quiz.' }, { status: 500 })
  }
}
