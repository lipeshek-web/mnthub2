import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrigin, pageParams, v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileMentorCard } from '@/lib/api-v1-serialize'

export const dynamic = 'force-dynamic'

/** GET /api/v1/mentors — mentores publicados (?q=&page=), ordenados por avaliação */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()
    const { page, pageSize, skip, take } = pageParams(req)

    const where = {
      isPublished: true,
      ...(q ? { OR: [{ headline: { contains: q } }, { user: { name: { contains: q } } }] } : {}),
    }

    const [profiles, total] = await Promise.all([
      db.mentorProfile.findMany({
        where,
        include: {
          user: { select: { name: true, avatarUrl: true } },
          reviews: { select: { rating: true } },
        },
        skip,
        take,
      }),
      db.mentorProfile.count({ where }),
    ])

    // Ordena por nota (desc) e número de avaliações — melhor reputação primeiro
    const sorted = [...profiles].sort((a, b) => {
      const ra = a.reviews.length ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0
      const rb = b.reviews.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0
      return rb - ra || b.reviews.length - a.reviews.length
    })

    const origin = getOrigin(req)
    return v1Json({
      items: sorted.map((p) => serializeMobileMentorCard(p, origin)),
      page,
      pageSize,
      total,
      hasMore: skip + profiles.length < total,
    })
  } catch (err) {
    console.error('GET /api/v1/mentors', err)
    return v1Error('Erro ao listar mentores.', 500)
  }
}
