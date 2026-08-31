import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/lessons/[lessonId]/note — anotações do usuário autenticado nesta aula */
export async function GET(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { lessonId } = await ctx.params
    const userId = session.id
    const note = await db.lessonNote.findUnique({
      where: { lessonId_userId: { lessonId, userId } },
    })
    return NextResponse.json({ body: note?.body ?? '', updatedAt: note?.updatedAt.toISOString() ?? null })
  } catch (err) {
    console.error('GET /api/lessons/[lessonId]/note', err)
    return NextResponse.json({ error: 'Erro ao carregar anotações.' }, { status: 500 })
  }
}

/** PUT /api/lessons/[lessonId]/note — salva (upsert) as anotações do usuário autenticado */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ lessonId: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized('Sessão expirada. Entre novamente para salvar as anotações.')
  try {
    const { lessonId } = await ctx.params
    const body = await req.json()
    const userId = session.id
    const text = String(body?.body ?? '').slice(0, 20000)

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
