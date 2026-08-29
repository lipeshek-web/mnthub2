import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** PATCH /api/quizzes/[id] — mentor dono edita pergunta do quiz */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: { lesson: { include: { course: { include: { mentor: true } } } } },
    })
    if (!quiz) return NextResponse.json({ error: 'Pergunta não encontrada.' }, { status: 404 })
    if (quiz.lesson.course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Somente o mentor pode editar o quiz.' }, { status: 403 })
    }

    const data: { prompt?: string; options?: string; correctIndex?: number; explanation?: string } = {}

    if (body?.prompt !== undefined) {
      const prompt = String(body.prompt).trim()
      if (prompt.length < 5) {
        return NextResponse.json({ error: 'Escreva a pergunta (mín. 5 caracteres).' }, { status: 400 })
      }
      data.prompt = prompt.slice(0, 800)
    }
    if (body?.explanation !== undefined) {
      data.explanation = String(body.explanation).trim().slice(0, 800)
    }
    if (Array.isArray(body?.options)) {
      const options = body.options.map((o: unknown) => String(o ?? '').trim())
      if (
        options.length < 2 ||
        options.length > 6 ||
        options.some((o: string) => o.length === 0)
      ) {
        return NextResponse.json(
          { error: 'Informe de 2 a 6 alternativas, todas preenchidas.' },
          { status: 400 }
        )
      }
      data.options = JSON.stringify(options.map((o: string) => o.slice(0, 240)))
    }
    if (body?.correctIndex !== undefined) {
      const idx = Number(body.correctIndex)
      const total = data.options
        ? JSON.parse(data.options).length
        : JSON.parse(quiz.options || '[]').length
      if (!Number.isInteger(idx) || idx < 0 || idx >= total) {
        return NextResponse.json({ error: 'Alternativa correta inválida.' }, { status: 400 })
      }
      data.correctIndex = idx
    }

    await db.quiz.update({ where: { id }, data })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PATCH /api/quizzes/[id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar pergunta.' }, { status: 500 })
  }
}

/** DELETE /api/quizzes/[id]?userId= — mentor dono remove pergunta */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: { lesson: { include: { course: { include: { mentor: true } } } } },
    })
    if (!quiz) return NextResponse.json({ error: 'Pergunta não encontrada.' }, { status: 404 })
    if (quiz.lesson.course.mentor.userId !== userId) {
      return NextResponse.json({ error: 'Somente o mentor pode editar o quiz.' }, { status: 403 })
    }

    await db.quiz.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/quizzes/[id]', err)
    return NextResponse.json({ error: 'Erro ao remover pergunta.' }, { status: 500 })
  }
}
