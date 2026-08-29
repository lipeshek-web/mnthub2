import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** POST /api/contents — publica item no mural de conteúdos do mentor */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim()
    const tags: string[] = Array.isArray(body?.tags) ? body.tags.map(String).filter(Boolean) : []
    const type = String(body?.type ?? 'ARTICLE')
    const level = String(body?.level ?? 'INTERMEDIARIO')
    const durationMin = Math.max(5, Math.min(600, Number(body?.durationMin ?? 30)))

    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })
    if (!title || title.length < 5) {
      return NextResponse.json({ error: 'Informe um título com pelo menos 5 caracteres.' }, { status: 400 })
    }
    if (!description || description.length < 20) {
      return NextResponse.json({ error: 'Escreva uma descrição com pelo menos 20 caracteres.' }, { status: 400 })
    }
    if (!['ARTICLE', 'VIDEO', 'WORKSHOP', 'TRAIL'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de conteúdo inválido.' }, { status: 400 })
    }
    if (!['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].includes(level)) {
      return NextResponse.json({ error: 'Nível inválido.' }, { status: 400 })
    }

    const profile = await db.mentorProfile.findUnique({ where: { userId } })
    if (!profile)
      return NextResponse.json({ error: 'Crie seu perfil de mentor primeiro.' }, { status: 400 })

    const content = await db.contentPost.create({
      data: {
        mentorId: profile.id,
        title,
        description,
        tags: JSON.stringify(tags),
        type,
        level,
        durationMin,
      },
    })

    return NextResponse.json({ id: content.id, ok: true }, { status: 201 })
  } catch (err) {
    console.error('POST /api/contents', err)
    return NextResponse.json({ error: 'Erro ao publicar conteúdo' }, { status: 500 })
  }
}
