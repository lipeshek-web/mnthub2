import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileLibraryDetail } from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/** GET /api/v1/library/[id] — detalhe do livro/artigo (acesso aberto aos publicados) */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const item = await db.libraryItem.findFirst({
      where: { id, isPublished: true },
      include: {
        mentor: {
          select: { id: true, headline: true, user: { select: { name: true, avatarUrl: true } } },
        },
      },
    })
    if (!item) return v1Error('Conteúdo não encontrado.', 404)

    return v1Json({ item: serializeMobileLibraryDetail(item, getOrigin(req)) })
  } catch (err) {
    console.error('GET /api/v1/library/[id]', err)
    return v1Error('Erro ao carregar conteúdo.', 500)
  }
}
