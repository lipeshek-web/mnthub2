import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { awardXp, XP_QUIZ } from '@/lib/xp'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/quizzes/[id]/attempt — aluno responde a pergunta do quiz.
 * Correção no servidor (gabarito nunca vai ao cliente antes de responder).
 * Retorna gabarito + explicação + XP concedido (só na 1ª resposta correta).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId do body — tentativa forjada creditava XP a
    // qualquer aluno e permitia responder no lugar de outro.
    const session = await resolveUser(req)
    if (!session) return unauthorized()
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const selectedIndex = Number(body?.selectedIndex)

    if (!Number.isInteger(selectedIndex) || selectedIndex < 0) {
      return NextResponse.json({ error: 'Selecione uma alternativa.' }, { status: 400 })
    }

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: { lesson: { include: { course: { include: { mentor: true } } } } },
    })
    if (!quiz) return NextResponse.json({ error: 'Pergunta não encontrada.' }, { status: 404 })
    if (quiz.lesson.course.mentor.userId === userId) {
      return NextResponse.json({ error: 'O mentor não responde o próprio quiz.' }, { status: 403 })
    }

    const enr = await db.enrollment.findUnique({
      where: { courseId_studentId: { courseId: quiz.lesson.courseId, studentId: userId } },
    })
    if (!enr) {
      return NextResponse.json({ error: 'Inscreva-se no curso para responder o quiz.' }, { status: 403 })
    }

    let optionCount = 0
    try {
      const parsed = JSON.parse(quiz.options || '[]')
      optionCount = Array.isArray(parsed) ? parsed.length : 0
    } catch {
      optionCount = 0
    }
    if (optionCount > 0 && selectedIndex >= optionCount) {
      return NextResponse.json({ error: 'Alternativa inválida.' }, { status: 400 })
    }

    const correct = selectedIndex === quiz.correctIndex

    await db.quizAttempt.upsert({
      where: { quizId_userId: { quizId: id, userId } },
      create: { quizId: id, userId, selectedIndex, correct },
      update: { selectedIndex, correct },
    })

    // XP apenas quando acerta — o ledger garante uma única concessão por quiz
    const xpAwarded = correct ? await awardXp(userId, 'QUIZ', id, XP_QUIZ) : 0

    return NextResponse.json({
      correct,
      correctIndex: quiz.correctIndex,
      explanation: quiz.explanation,
      xpAwarded,
    })
  } catch (err) {
    console.error('POST /api/quizzes/[id]/attempt', err)
    return NextResponse.json({ error: 'Erro ao registrar resposta.' }, { status: 500 })
  }
}
