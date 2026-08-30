import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** DELETE /api/contents/[id]?userId= — remove conteúdo do mural (apenas o autor) */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const userId = req.nextUrl.searchParams.get('userId') || ''
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const content = await db.contentPost.findUnique({ where: { id }, include: { mentor: true } })
    if (!content) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 })
    if (content.mentor.userId !== userId)
      return NextResponse.json({ error: 'Sem permissão para excluir.' }, { status: 403 })

    await db.contentPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/contents/[id]', err)
    return NextResponse.json({ error: 'Erro ao excluir conteúdo' }, { status: 500 })
  }
}
