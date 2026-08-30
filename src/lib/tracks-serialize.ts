// Serialização de Trilhas compartilhada entre as rotas /api/tracks e /api/tracks/[id]
import { db } from '@/lib/db'

export function trackBaseInclude() {
  return {
    mentor: {
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
      },
    },
    items: {
      orderBy: { order: 'asc' as const },
      include: {
        course: {
          include: {
            lessons: { select: { durationMin: true, kind: true } },
            enrollments: { select: { id: true } },
          },
        },
      },
    },
    enrollments: { select: { id: true } },
  }
}

export type TrackRow = {
  id: string
  title: string
  description: string
  category: string
  level: string
  price: number
  coverUrl: string | null
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  mentor: {
    id: string
    userId: string
    headline: string
    user: { id: string; name: string; avatarUrl: string | null }
    reviews: { rating: number }[]
  }
  items: {
    id: string
    type: string
    title: string | null
    description: string
    sessionCount: number
    course: {
      id: string
      title: string
      coverUrl: string | null
      mentorshipCount: number
      lessons: { durationMin: number; kind: string }[]
      enrollments: { id: string }[]
    } | null
  }[]
  enrollments: { id: string }[]
}

export function serializeTrack(t: TrackRow) {
  const rating =
    t.mentor.reviews.length > 0
      ? Math.round(
          (t.mentor.reviews.reduce((a, r) => a + r.rating, 0) / t.mentor.reviews.length) * 10
        ) / 10
      : 0

  const courseItems = t.items.filter((i) => i.type === 'COURSE' && i.course)
  const mentorshipSessions = t.items
    .filter((i) => i.type === 'MENTORSHIP')
    .reduce((a, i) => a + i.sessionCount, 0)
  const totalDurationMin = courseItems.reduce(
    (a, i) => a + (i.course?.lessons.reduce((s, l) => s + l.durationMin, 0) ?? 0),
    0
  )
  const lessonCount = courseItems.reduce((a, i) => a + (i.course?.lessons.length ?? 0), 0)
  const liveCount = courseItems.reduce(
    (a, i) => a + (i.course?.lessons.filter((l) => l.kind === 'LIVE').length ?? 0),
    0
  )

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    level: t.level,
    price: t.price,
    coverUrl: t.coverUrl,
    isPublished: t.isPublished,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    mentor: {
      id: t.mentor.id,
      userId: t.mentor.userId,
      name: t.mentor.user.name,
      headline: t.mentor.headline,
      rating,
      reviewCount: t.mentor.reviews.length,
      avatarUrl: t.mentor.user.avatarUrl,
    },
    courseCount: courseItems.length,
    mentorshipSessions,
    lessonCount,
    liveCount,
    totalDurationMin,
    studentCount: t.enrollments.length,
    items: t.items.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.type === 'COURSE' ? (i.course?.title ?? i.title ?? '') : (i.title ?? 'Mentoria'),
      sessionCount: i.sessionCount,
      courseId: i.course?.id ?? null,
    })),
  }
}

/** Valida e normaliza os itens da trilha (cursos do próprio mentor + blocos de mentoria) */
export async function parseTrackItems(
  rawItems: unknown,
  mentorId: string
): Promise<{
  error?: string
  items: { type: 'COURSE' | 'MENTORSHIP'; courseId: string | null; title: string | null; description: string; sessionCount: number }[]
}> {
  const items: { type: 'COURSE' | 'MENTORSHIP'; courseId: string | null; title: string | null; description: string; sessionCount: number }[] = []
  if (!Array.isArray(rawItems)) return { items }

  for (const raw of rawItems) {
    const type = raw?.type === 'MENTORSHIP' ? 'MENTORSHIP' : 'COURSE'
    if (type === 'COURSE') {
      const courseId = String(raw?.courseId ?? '')
      const course = await db.course.findFirst({ where: { id: courseId, mentorId } })
      if (!course) {
        return { error: 'Um dos cursos selecionados não existe ou não é seu.', items: [] }
      }
      items.push({ type, courseId, title: null, description: String(raw?.description ?? '').slice(0, 500), sessionCount: 1 })
    } else {
      const mTitle = String(raw?.title ?? '').trim()
      if (mTitle.length < 3) {
        return { error: 'Dê um título ao bloco de mentoria.', items: [] }
      }
      items.push({
        type,
        courseId: null,
        title: mTitle,
        description: String(raw?.description ?? '').slice(0, 500),
        sessionCount: Math.max(1, Math.min(20, Math.round(Number(raw?.sessionCount ?? 1) || 1))),
      })
    }
  }
  return { items }
}
