import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** PATCH /api/questions/[id] — mentor dono responde a pergunta */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId do body — responder pergunta como outro mentor (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para responder.')
    const { id } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const answer = String(body?.answer ?? '').trim()

    const question = await db.lessonQuestion.findUnique({
      where: { id },
      include: { course: { include: { mentor: { include: { user: { select: { name: true } } } } } } },
    })
    if (!question) return NextResponse.json({ error: 'Pergunta não encontrada.' }, { status: 404 })
    if (question.course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Apenas o mentor responde as perguntas.' }, { status: 403 })
    }

    const isFirstAnswer = !question.answer && Boolean(answer)
    const updated = await db.lessonQuestion.update({
      where: { id },
      data: {
        answer: answer ? answer.slice(0, 2000) : null,
        answeredAt: answer ? new Date() : null,
      },
    })

    // Fecha o ciclo: o aluno fica sabendo no sino que a dúvida foi respondida.
    if (isFirstAnswer) {
      await notify({
        userId: question.userId,
        kind: 'question_answered',
        title: `${question.course.mentor.user.name} respondeu sua pergunta`,
        body: `Curso "${question.course.title}" — ${answer!.slice(0, 140)}`,
        linkView: 'course',
        refId: question.courseId,
      })
    }

    return NextResponse.json({
      id: updated.id,
      body: updated.body,
      answer: updated.answer,
      answeredAt: updated.answeredAt ? updated.answeredAt.toISOString() : null,
      createdAt: updated.createdAt.toISOString(),
    })
  } catch (err) {
    console.error('PATCH /api/questions/[id]', err)
    return NextResponse.json({ error: 'Erro ao responder pergunta.' }, { status: 500 })
  }
}

/** DELETE /api/questions/[id] — autor remove a própria pergunta (sem resposta) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    // Sessão em vez de userId da query — remover pergunta de outro autor (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')
    const { id } = await ctx.params
    const userId = session.id

    const question = await db.lessonQuestion.findUnique({ where: { id } })
    if (!question) return NextResponse.json({ error: 'Pergunta não encontrada.' }, { status: 404 })
    if (question.userId !== userId) {
      return NextResponse.json({ error: 'Sem permissão para remover.' }, { status: 403 })
    }
    if (question.answer) {
      return NextResponse.json({ error: 'Perguntas respondidas não podem ser removidas.' }, { status: 400 })
    }

    await db.lessonQuestion.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/questions/[id]', err)
    return NextResponse.json({ error: 'Erro ao remover pergunta.' }, { status: 500 })
  }
}
