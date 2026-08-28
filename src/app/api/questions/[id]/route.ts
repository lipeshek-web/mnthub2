import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** PATCH /api/questions/[id] — mentor dono responde a pergunta */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const answer = String(body?.answer ?? '').trim()

    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const question = await db.lessonQuestion.findUnique({
      where: { id },
      include: { course: { include: { mentor: true } } },
    })
    if (!question) return NextResponse.json({ error: 'Pergunta não encontrada.' }, { status: 404 })
    if (question.course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Apenas o mentor responde as perguntas.' }, { status: 403 })
    }

    const updated = await db.lessonQuestion.update({
      where: { id },
      data: {
        answer: answer ? answer.slice(0, 2000) : null,
        answeredAt: answer ? new Date() : null,
      },
    })

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

/** DELETE /api/questions/[id]?userId= — autor remove a própria pergunta (sem resposta) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()

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
