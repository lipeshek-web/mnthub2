import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrigin, pageParams, v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileMentorCard } from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/mentors — mentores publicados (?q=&page=), ordenados por
 * REPUTAÇÃO GLOBAL (nota média desc, nº de avaliações desc, experiência desc,
 * nome asc). A ordenação usa agregados de TODOS os perfis que casam com o
 * filtro — nunca só da página atual (o app pagina e a ordem tem de ser
 * estável entre páginas).
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    const { page, pageSize, skip, take } = pageParams(req)

    const where = {
      isPublished: true,
      ...(q ? { OR: [{ headline: { contains: q } }, { user: { name: { contains: q } } }] } : {}),
    }

    // 1) Todos os perfis que casam com o filtro — só o essencial p/ ordenar
    const candidates = await db.mentorProfile.findMany({
      where,
      select: { id: true, experienceYears: true, user: { select: { name: true } } },
    })

    // 2) Agregados de avaliação desses perfis (1 query, índice por mentor)
    const ids = candidates.map((c) => c.id)
    const aggs = ids.length
      ? await db.review.groupBy({
          by: ['mentorId'],
          where: { mentorId: { in: ids } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : []
    const stats = new Map(aggs.map((a) => [a.mentorId, { avg: a._avg.rating ?? 0, count: a._count._all }]))

    // 3) Ordem global estável: nota desc, avaliações desc, experiência desc, nome asc
    const sortedIds = [...candidates]
      .sort((a, b) => {
        const sa = stats.get(a.id) ?? { avg: 0, count: 0 }
        const sb = stats.get(b.id) ?? { avg: 0, count: 0 }
        if (sb.avg !== sa.avg) return sb.avg - sa.avg
        if (sb.count !== sa.count) return sb.count - sa.count
        if (b.experienceYears !== a.experienceYears) return b.experienceYears - a.experienceYears
        return a.user.name.localeCompare(b.user.name, 'pt-BR')
      })
      .slice(skip, skip + take)
      .map((c) => c.id)

    const total = candidates.length

    if (sortedIds.length === 0) {
      const origin = getOrigin(req)
      return v1Json({ items: [], page, pageSize, total, hasMore: false }, 200, {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      })
    }

    // 4) Cards completos apenas da página (mantém a carga leve)
    const [profiles, origin] = await Promise.all([
      db.mentorProfile.findMany({
        where: { id: { in: sortedIds } },
        include: {
          user: { select: { name: true, avatarUrl: true } },
          reviews: { select: { rating: true } },
        },
      }),
      Promise.resolve(getOrigin(req)),
    ])
    const byId = new Map(profiles.map((p) => [p.id, p]))

    return v1Json(
      {
        items: sortedIds.map((id) => byId.get(id)).filter(Boolean).map((p) => serializeMobileMentorCard(p!, origin)),
        page,
        pageSize,
        total,
        hasMore: skip + sortedIds.length < total,
      },
      200,
      { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' }
    )
  } catch (err) {
    console.error('GET /api/v1/mentors', err)
    return v1Error('Erro ao listar mentores.', 500)
  }
}
