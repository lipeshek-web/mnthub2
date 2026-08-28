import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/lessons/[lessonId]/note?userId= — anotações do usuário nesta aula */
export async function GET(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await ctx.params
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const note = await db.lessonNote.findUnique({
      where: { lessonId_userId: { lessonId, userId } },
    })
    return NextResponse.json({ body: note?.body ?? '', updatedAt: note?.updatedAt.toISOString() ?? null })
  } catch (err) {
    console.error('GET /api/lessons/[lessonId]/note', err)
    return NextResponse.json({ error: 'Erro ao carregar anotações.' }, { status: 500 })
  }
}

/** PUT /api/lessons/[lessonId]/note — salva (upsert) as anotações do usuário */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await ctx.params
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const text = String(body?.body ?? '').slice(0, 20000)
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true } })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    const note = await db.lessonNote.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      create: { lessonId, userId, body: text },
      update: { body: text },
    })

    return NextResponse.json({ body: note.body, updatedAt: note.updatedAt.toISOString() })
  } catch (err) {
    console.error('PUT /api/lessons/[lessonId]/note', err)
    return NextResponse.json({ error: 'Erro ao salvar anotações.' }, { status: 500 })
  }
}
