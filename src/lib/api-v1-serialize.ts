// Serializadores da API v1 (mobile) — formatos de saída estáveis documentados
// em docs/api-v1.md. Todas as URLs saem absolutas (origin do request).
import { db } from '@/lib/db'
import { absolutize, avgRating, parseJsonArray } from '@/lib/api-v1'

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
  mentor: { id: string; user: { name: string; avatarUrl: string | null } }
  review: { id: string } | null
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
      name: booking.mentor.user.name,
      avatarUrl: absolutize(booking.mentor.user.avatarUrl, ''),
    },
    reviewed: Boolean(booking.review),
  }
}

/** Carrega bookings do aluno com os includes usados pelo serializador */
export async function loadMobileBookings(studentId: string, opts?: { upcomingOnly?: boolean; take?: number }) {
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
      mentor: { select: { id: true, user: { select: { name: true, avatarUrl: true } } } },
      review: { select: { id: true } },
    },
    orderBy: { startsAt: opts?.upcomingOnly ? 'asc' : 'desc' },
    take: opts?.take,
  })
}
