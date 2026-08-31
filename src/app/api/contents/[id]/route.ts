import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** DELETE /api/contents/[id] — remove conteúdo do mural (apenas o autor, via SESSÃO) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()
  try {
    const { id } = await ctx.params

    const content = await db.contentPost.findUnique({ where: { id }, include: { mentor: true } })
    if (!content) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 })
    if (content.mentor.userId !== session.id)
      return NextResponse.json({ error: 'Sem permissão para excluir.' }, { status: 403 })

    await db.contentPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/contents/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir conteúdo' }, { status: 500 })
  }
}
