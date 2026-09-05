// Serializadores da API v1 (mobile) — formatos de saída estáveis documentados
// em docs/api-v1.md. Todas as URLs saem absolutas (origin do request).
import { db } from '@/lib/db'
import { absolutize, avgRating, avgRatingFromAgg, parseJsonArray } from '@/lib/api-v1'

type Origin = string

/* ------------------------- Biblioteca (livros/artigos) ------------------------- */

export function serializeMobileLibraryCard(
  item: {
    id: string
    kind: string
    title: string
    description: string
    category: string
    level: string
    coverUrl: string | null
    readingMin: number
    createdAt: Date
    mentor: { id: string; user: { name: string; avatarUrl: string | null } }
  },
  origin: Origin
) {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.description,
    category: item.category,
    level: item.level,
    coverUrl: absolutize(item.coverUrl, origin),
    readingMin: item.readingMin,
    createdAt: item.createdAt.toISOString(),
    mentor: {
      id: item.mentor.id,
      name: item.mentor.user.name,
      avatarUrl: absolutize(item.mentor.user.avatarUrl, origin),
    },
  }
}

export function serializeMobileLibraryDetail(
  item: {
    id: string
    kind: string
    title: string
    description: string
    category: string
    level: string
    coverUrl: string | null
    pdfUrl: string | null
    content: string | null
    readingMin: number
    createdAt: Date
    updatedAt: Date
    mentor: { id: string; headline: string; user: { name: string; avatarUrl: string | null } }
  },
  origin: Origin
) {
  return {
    ...serializeMobileLibraryCard(item, origin),
    pdfUrl: absolutize(item.pdfUrl, origin),
    content: item.content,
    updatedAt: item.updatedAt.toISOString(),
    mentor: {
      id: item.mentor.id,
      name: item.mentor.user.name,
      headline: item.mentor.headline,
      avatarUrl: absolutize(item.mentor.user.avatarUrl, origin),
    },
  }
}

/* --------------------------------- Cursos --------------------------------- */

/** Include padrão para montar o card de curso (mesma base do site) */
export function mobileCourseInclude() {
  return {
    mentor: {
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        reviews: { select: { rating: true } },
      },
    },
    reviews: { select: { rating: true } },
    lessons: { select: { durationMin: true, kind: true } },
    enrollments: { select: { id: true } },
  }
}

/* -------- Cursos: caminho LEVE para listas (agregados em vez de linhas) -------- */

export interface CourseSlimSelect {
  id: string
  title: string
  description: string | null
  category: string
  level: string
  price: number
  coverUrl: string | null
  mentorshipCount: number
  createdAt: Date
  updatedAt: Date
  mentor: {
    id: string
    userId: string
    headline: string
    user: { id: string; name: string; avatarUrl: string | null }
  }
}

/** Select enxuto para listas de curso — sem reviews/lessons/enrollments (vão como agregados) */
export function mobileCourseListSelect() {
  return {
    id: true,
    title: true,
    description: true,
    category: true,
    level: true,
    price: true,
    coverUrl: true,
    mentorshipCount: true,
    createdAt: true,
    updatedAt: true,
    mentor: {
      select: {
        id: true,
        userId: true,
        headline: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    },
  } as const
}

export interface CourseAggStats {
  lessonCount: number
  totalDurationMin: number
  liveCount: number
  studentCount: number
  rating: number
  reviewCount: number
}

export interface MentorAggStats {
  rating: number
  reviewCount: number
}

/**
 * Carrega TODAS as estatísticas exibidas nos cards de curso em 5 groupBy
 * (aulas, aulas ao vivo, inscrições, avaliações do curso e do mentor) — em vez
 * de carregar cada linha de lesson/review/enrollment só para contar. Corta o
 * payload e a memória das listas sem mudar o JSON de saída.
 */
export async function loadCourseListStats(
  courseIds: string[],
  mentorProfileIds: string[]
): Promise<{ courseStats: Map<string, CourseAggStats>; mentorStats: Map<string, MentorAggStats> }> {
  const emptyCourse = { lessonCount: 0, totalDurationMin: 0, liveCount: 0, studentCount: 0, rating: 0, reviewCount: 0 }

  if (courseIds.length === 0) {
    return { courseStats: new Map(), mentorStats: new Map() }
  }

  const [lessons, liveLessons, enrollments, courseReviews, mentorReviews] = await Promise.all([
    db.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { _all: true },
      _sum: { durationMin: true },
    }),
    db.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds }, kind: 'LIVE' },
      _count: { _all: true },
    }),
    db.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { _all: true },
    }),
    db.courseReview.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    mentorProfileIds.length
      ? db.review.groupBy({
          by: ['mentorId'],
          where: { mentorId: { in: mentorProfileIds } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : Promise.resolve([] as { mentorId: string; _avg: { rating: number | null }; _count: { _all: number } }[]),
  ])

  const courseStats = new Map<string, CourseAggStats>(courseIds.map((id) => [id, { ...emptyCourse }]))
  for (const row of lessons) {
    const s = courseStats.get(row.courseId)
    if (s) {
      s.lessonCount = row._count._all
      s.totalDurationMin = row._sum.durationMin ?? 0
    }
  }
  for (const row of liveLessons) {
    const s = courseStats.get(row.courseId)
    if (s) s.liveCount = row._count._all
  }
  for (const row of enrollments) {
    const s = courseStats.get(row.courseId)
    if (s) s.studentCount = row._count._all
  }
  for (const row of courseReviews) {
    const s = courseStats.get(row.courseId)
    if (s) {
      s.rating = avgRatingFromAgg(row._avg.rating)
      s.reviewCount = row._count._all
    }
  }

  const mentorStats = new Map<string, MentorAggStats>(
    mentorReviews.map((row) => [
      row.mentorId,
      { rating: avgRatingFromAgg(row._avg.rating), reviewCount: row._count._all },
    ])
  )

  return { courseStats, mentorStats }
}

/**
 * Card de curso a partir do select enxuto + agregados. O JSON de saída é
 * IDÊNTICO ao de serializeMobileCourseCard (contrato do app).
 */
export function serializeMobileCourseCardFromStats(
  course: CourseSlimSelect,
  origin: Origin,
  enrolled: boolean,
  courseStats: CourseAggStats,
  mentorStats: MentorAggStats
) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    price: course.price,
    coverUrl: absolutize(course.coverUrl, origin),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    mentor: {
      id: course.mentor.id,
      name: course.mentor.user.name,
      headline: course.mentor.headline,
      rating: mentorStats.rating,
      reviewCount: mentorStats.reviewCount,
      avatarUrl: absolutize(course.mentor.user.avatarUrl, origin),
    },
    lessonCount: courseStats.lessonCount,
    totalDurationMin: courseStats.totalDurationMin,
    liveCount: courseStats.liveCount,
    mentorshipCount: course.mentorshipCount,
    studentCount: courseStats.studentCount,
    rating: courseStats.rating,
    reviewCount: courseStats.reviewCount,
    enrolled,
  }
}

export function serializeMobileCourseCard(
  course: {
    id: string
    title: string
    description: string
    category: string
    level: string
    price: number
    coverUrl: string | null
    mentorshipCount: number
    createdAt: Date
    updatedAt: Date
    mentor: {
      id: string
      userId: string
      headline: string
      user: { id: string; name: string; avatarUrl: string | null }
      reviews: { rating: number }[]
    }
    reviews: { rating: number }[]
    lessons: { durationMin: number; kind: string }[]
    enrollments: { id: string }[]
  },
  origin: Origin,
  enrolled: boolean
) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    price: course.price,
    coverUrl: absolutize(course.coverUrl, origin),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    mentor: {
      id: course.mentor.id,
      name: course.mentor.user.name,
      headline: course.mentor.headline,
      rating: avgRating(course.mentor.reviews),
      reviewCount: course.mentor.reviews.length,
      avatarUrl: absolutize(course.mentor.user.avatarUrl, origin),
    },
    lessonCount: course.lessons.length,
    totalDurationMin: course.lessons.reduce((acc, l) => acc + l.durationMin, 0),
    liveCount: course.lessons.filter((l) => l.kind === 'LIVE').length,
    mentorshipCount: course.mentorshipCount,
    studentCount: course.enrollments.length,
    rating: avgRating(course.reviews),
    reviewCount: course.reviews.length,
    enrolled,
  }
}

/** Aula da API mobile — campos de conteúdo zerados quando locked (não inscrito) */
export function serializeMobileLesson(
  lesson: {
    id: string
    title: string
    description: string
    kind: string
    videoUrl: string | null
    content: string | null
    startsAt: string | null
    meetingUrl: string | null
    attachments: string
    durationMin: number
    order: number
    libraryItemId: string | null
  },
  locked: boolean
) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    kind: lesson.kind,
    durationMin: lesson.durationMin,
    order: lesson.order,
    videoUrl: locked ? null : lesson.videoUrl,
    content: locked ? null : lesson.content,
    startsAt: lesson.startsAt,
    meetingUrl: locked ? null : lesson.meetingUrl,
    attachments: locked
      ? []
      : parseJsonArray(lesson.attachments).map((raw) => {
          try {
            const parsed = JSON.parse(raw) as { name?: unknown; url?: unknown }
            return {
              name: String(parsed?.name ?? 'Anexo'),
              url: String(parsed?.url ?? ''),
            }
          } catch {
            return { name: raw, url: '' }
          }
        }),
    libraryItemId: lesson.libraryItemId,
    locked,
  }
}

/* -------------------------------- Mentorias -------------------------------- */

/** Card de mentor usado na lista e no detalhe */
export function serializeMobileMentorCard(
  profile: {
    id: string
    headline: string
    hourlyRate: number
    experienceYears: number
    categories: string
    user: { name: string; avatarUrl: string | null }
    reviews: { rating: number }[]
  },
  origin: Origin
) {
  return {
    id: profile.id,
    name: profile.user.name,
    headline: profile.headline,
    avatarUrl: absolutize(profile.user.avatarUrl, origin),
    hourlyRate: profile.hourlyRate,
    categories: parseJsonArray(profile.categories),
    rating: avgRating(profile.reviews),
    reviewCount: profile.reviews.length,
    experienceYears: profile.experienceYears,
  }
}

/* ------------------------------ Agendamentos ------------------------------ */

export function serializeMobileBooking(booking: {
  id: string
  startsAt: string
  durationMin: number
  topic: string
  notes: string | null
  status: string
  meetingRoom: string
  price: number
  createdAt: Date
  mentor: { id: string; userId: string; user: { name: string; avatarUrl: string | null } }
  review: { id: string } | null
  orders?: { status: string }[]
}) {
  return {
    id: booking.id,
    startsAt: booking.startsAt,
    durationMin: booking.durationMin,
    topic: booking.topic,
    notes: booking.notes,
    status: booking.status,
    meetingRoom: booking.meetingRoom,
    price: booking.price,
    createdAt: booking.createdAt.toISOString(),
    mentor: {
      id: booking.mentor.id,
      // userId p/ abrir conversa e pagar a sessão no app (checkout usa usuário)
      userId: booking.mentor.userId,
      name: booking.mentor.user.name,
      avatarUrl: absolutize(booking.mentor.user.avatarUrl, ''),
    },
    reviewed: Boolean(booking.review),
    // true quando existe pedido PAID para esta sessão (esconde "Pagar agora")
    paid: (booking.orders ?? []).some((o) => o.status === 'PAID'),
  }
}

/** Carrega bookings do aluno com os includes usados pelo serializador */
export async function loadMobileBookings(
  studentId: string,
  opts?: { upcomingOnly?: boolean; take?: number; skip?: number }
) {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const nowNaiveStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

  return db.booking.findMany({
    where: {
      menteeId: studentId,
      ...(opts?.upcomingOnly
        ? { status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gte: nowNaiveStr } }
        : {}),
    },
    include: {
      mentor: { select: { id: true, userId: true, user: { select: { name: true, avatarUrl: true } } } },
      review: { select: { id: true } },
      orders: { select: { status: true } },
    },
    orderBy: { startsAt: opts?.upcomingOnly ? 'asc' : 'desc' },
    take: opts?.take,
    skip: opts?.skip,
  })
}
