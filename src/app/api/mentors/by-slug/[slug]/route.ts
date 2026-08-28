import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mentors/by-slug/[slug] — dados públicos da LP do mentor
 * (usada para tráfego pago: /?mentor=slug&utm_source=...).
 * Inclui cursos publicados, mural, avaliações e IDs de rastreamento
 * do mentor (públicos — GA4/Meta Pixel injetados apenas nesta LP).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params
    const clean = decodeURIComponent(slug || '').trim().toLowerCase()
    if (!clean) return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })

    const profile = await db.mentorProfile.findUnique({
      where: { slug: clean },
      include: {
        user: true,
        contents: { orderBy: { createdAt: 'desc' }, take: 6 },
        reviews: { include: { author: true }, orderBy: { createdAt: 'desc' }, take: 8 },
        bookings: { where: { status: 'COMPLETED' }, select: { id: true } },
      },
    })

    if (!profile || !profile.isPublished) {
      return NextResponse.json({ error: 'Página não encontrada.' }, { status: 404 })
    }

    const courses = await db.course.findMany({
      where: { mentorId: profile.id, isPublished: true },
      include: {
        mentor: { include: { user: { select: { name: true } }, reviews: { select: { rating: true } } } },
        lessons: { select: { durationMin: true } },
        enrollments: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const rating =
      profile.reviews.length > 0
        ? Math.round((profile.reviews.reduce((a, r) => a + r.rating, 0) / profile.reviews.length) * 10) / 10
        : 0

    const serializedCourses = courses.map((c) => {
      const courseRating =
        c.mentor.reviews.length > 0
          ? Math.round((c.mentor.reviews.reduce((a, r) => a + r.rating, 0) / c.mentor.reviews.length) * 10) / 10
          : 0
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        level: c.level,
        price: c.price,
        isPublished: c.isPublished,
        coverUrl: c.coverUrl,
        mentor: {
          id: c.mentor.id,
          userId: c.mentor.userId,
          name: c.mentor.user.name,
          headline: c.mentor.headline,
          rating: courseRating,
          reviewCount: c.mentor.reviews.length,
          avatarUrl: profile.user.avatarUrl,
        },
        lessonCount: c.lessons.length,
        totalDurationMin: c.lessons.reduce((a, l) => a + l.durationMin, 0),
        studentCount: c.enrollments.length,
        createdAt: c.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      mentor: {
        id: profile.id,
        userId: profile.userId,
        slug: profile.slug!,
        name: profile.user.name,
        headline: profile.headline,
        description: profile.description,
        bio: profile.user.bio,
        categories: JSON.parse(profile.categories || '[]'),
        hourlyRate: profile.hourlyRate,
        experienceYears: profile.experienceYears,
        languages: profile.languages,
        rating,
        reviewCount: profile.reviews.length,
        totalSessions: profile.bookings.length,
        socials: {
          instagram: profile.instagram,
          linkedin: profile.linkedin,
          github: profile.github,
          website: profile.website,
        },
        avatarUrl: profile.user.avatarUrl,
        coverUrl: profile.coverUrl,
        tracking: {
          gaMeasurementId: profile.gaMeasurementId,
          metaPixelId: profile.metaPixelId,
        },
      },
      courses: serializedCourses,
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
      reviews: profile.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        authorId: r.authorId,
        authorName: r.author.name,
      })),
      studentCount: courses.reduce((acc, c) => acc + c.enrollments.length, 0),
    })
  } catch (err) {
    console.error('GET /api/mentors/by-slug/[slug]', err)
    return NextResponse.json({ error: 'Erro ao carregar página do mentor.' }, { status: 500 })
  }
}
