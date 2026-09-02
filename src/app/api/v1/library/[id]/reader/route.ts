import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { absolutize, getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import { LIBRARY_PAGES_MANIFEST } from '@/lib/library-pages-manifest'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/library/[id]/reader — manifesto do LEITOR DE PDF NATIVO do app.
 *
 * O app mobile nunca abre browser/WebView para livros: exibe as páginas como
 * imagens em um pager próprio. Este endpoint devolve quantas páginas o livro
 * tem e as URLs absolutas de cada página (PNGs estáticos servidos de
 * /library-pages/<id>/p<N>.png — public/, sem CORS necessário para <Image>).
 *
 * Livros sem páginas renderizadas (uploads futuros) respondem 404 com mensagem
 * amigável — o app mostra "Abrir PDF original" no próprio leitor enquanto as
 * páginas não existem.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const origin = getOrigin(req)

    const item = await db.libraryItem.findFirst({
      where: { id, isPublished: true },
      select: { id: true, title: true, kind: true, pdfUrl: true },
    })
    if (!item) return v1Error('Conteúdo não encontrado.', 404)

    const entry = LIBRARY_PAGES_MANIFEST[item.id]
    if (!entry || entry.totalPages < 1) {
      return v1Error(
        item.pdfUrl
          ? 'Este livro ainda não tem páginas prontas para o leitor nativo — use “Abrir PDF original”.'
          : 'Este conteúdo não tem arquivo de leitura.',
        404
      )
    }

    const pages = Array.from({ length: entry.totalPages }, (_, i) => ({
      n: i + 1,
      url: absolutize(`/library-pages/${item.id}/p${i + 1}.png`, origin),
    }))

    return v1Json({
      reader: {
        itemId: item.id,
        title: item.title,
        totalPages: entry.totalPages,
        pages,
      },
    })
  } catch (err) {
    console.error('GET /api/v1/library/[id]/reader', err)
    return v1Error('Erro ao preparar o leitor.', 500)
  }
}
