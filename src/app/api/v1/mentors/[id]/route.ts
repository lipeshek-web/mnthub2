import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import { serializeMobileMentorCard } from '@/lib/api-v1-serialize'
import { absolutize } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/** GET /api/v1/mentors/[id] — perfil completo + avaliações recebidas */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const profile = await db.mentorProfile.findFirst({
      where: { id, isPublished: true },
      include: {
        user: { select: { name: true, avatarUrl: true, bio: true } },
        reviews: { select: { rating: true } },
      },
    })
    if (!profile) return v1Error('Mentor não encontrado.', 404)

    const reviews = await db.review.findMany({
      where: { mentorId: id },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })

    const origin = getOrigin(req)
    return v1Json({
      mentor: {
        ...serializeMobileMentorCard(profile, origin),
        // userId do usuário dono do perfil — usado pelo app para abrir conversa
        // (mensagens diretas são entre usuários, não entre perfis de mentor)
        userId: profile.userId,
        description: profile.description,
        languages: profile.languages.split(',').map((s) => s.trim()).filter(Boolean),
        instagram: profile.instagram,
        linkedin: profile.linkedin,
        website: profile.website,
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        author: r.author.name,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/v1/mentors/[id]', err)
    return v1Error('Erro ao carregar mentor.', 500)
  }
}
