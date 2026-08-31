import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/mentors/me — perfil de mentor do usuário autenticado (ou null).
 *  Identidade da SESSÃO: sem token válido responde { profile: null } (antes o
 *  userId na query expunha rascunhos e métricas de qualquer mentor). */
export async function GET(req: NextRequest) {
  try {
    const session = await resolveUser(req)
    if (!session) return NextResponse.json({ profile: null })
    const userId = session.id

    const profile = await db.mentorProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        contents: { orderBy: { createdAt: 'desc' } },
        availabilities: { orderBy: [{ weekday: 'asc' }, { startHour: 'asc' }] },
        reviews: { include: { author: true }, orderBy: { createdAt: 'desc' } },
      },
    })

    if (!profile) return NextResponse.json({ profile: null })

    return NextResponse.json({
      profile: {
        id: profile.id,
        userId: profile.userId,
        name: profile.user.name,
        bio: profile.user.bio,
        headline: profile.headline,
        description: profile.description,
        categories: JSON.parse(profile.categories || '[]'),
        hourlyRate: profile.hourlyRate,
        experienceYears: profile.experienceYears,
        languages: profile.languages,
        socials: {
          instagram: profile.instagram,
          linkedin: profile.linkedin,
          github: profile.github,
          website: profile.website,
        },
        contents: profile.contents.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          tags: JSON.parse(c.tags || '[]'),
          type: c.type,
          level: c.level,
          durationMin: c.durationMin,
          createdAt: c.createdAt.toISOString(),
        })),
        availabilities: profile.availabilities.map((a) => ({
          id: a.id,
          weekday: a.weekday,
          startHour: a.startHour,
          endHour: a.endHour,
        })),
        reviews: profile.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          authorId: r.authorId,
          authorName: r.author.name,
        })),
        rating: profile.reviews.length
          ? Math.round((profile.reviews.reduce((a, r) => a + r.rating, 0) / profile.reviews.length) * 10) / 10
          : 0,
        reviewCount: profile.reviews.length,
        totalSessions: 0,
        bookedSlots: [],
        avatarUrl: profile.user.avatarUrl,
        coverUrl: profile.coverUrl,
        fontHeading: profile.fontHeading,
        fontBody: profile.fontBody,
        slug: profile.slug,
        tracking: {
          gaMeasurementId: profile.gaMeasurementId,
          metaPixelId: profile.metaPixelId,
        },
      },
    })
  } catch (err) {
    console.error('GET /api/mentors/me', err)
    return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 })
  }
}
