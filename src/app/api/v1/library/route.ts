import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrigin, pageParams, v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileLibraryCard } from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/** GET /api/v1/library — livros e artigos publicados (?kind=&q=&category=&page=) */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const kind = sp.get('kind')
    const q = sp.get('q')?.trim()
    const category = sp.get('category')?.trim()
    const { page, pageSize, skip, take } = pageParams(req)

    const where = {
      isPublished: true,
      ...(kind === 'BOOK' || kind === 'ARTICLE' ? { kind } : {}),
      ...(category ? { category } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
    }

    const [items, total] = await Promise.all([
      db.libraryItem.findMany({
        where,
        include: {
          mentor: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.libraryItem.count({ where }),
    ])

    const origin = getOrigin(req)
    return v1Json({
      items: items.map((item) => serializeMobileLibraryCard(item, origin)),
      page,
      pageSize,
      total,
      hasMore: skip + items.length < total,
    })
  } catch (err) {
    console.error('GET /api/v1/library', err)
    return v1Error('Erro ao listar a biblioteca.', 500)
  }
}
