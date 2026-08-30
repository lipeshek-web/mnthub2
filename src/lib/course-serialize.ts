// Serialização de Cursos compartilhada entre as rotas de cursos,
// recomendações IA e futuras integrações.
export function courseBaseInclude() {
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

export function serializeCourse(course: {
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
  mentorshipCount: number
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
}) {
  const rating =
    course.mentor.reviews.length > 0
      ? Math.round(
          (course.mentor.reviews.reduce((a, r) => a + r.rating, 0) / course.mentor.reviews.length) * 10
        ) / 10
      : 0
  // Nota do PRÓPRIO curso (avaliações de alunos)
  const courseRating =
    course.reviews.length > 0
      ? Math.round((course.reviews.reduce((a, r) => a + r.rating, 0) / course.reviews.length) * 10) / 10
      : 0
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    price: course.price,
    isPublished: course.isPublished,
    coverUrl: course.coverUrl,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    mentor: {
      id: course.mentor.id,
      userId: course.mentor.userId,
      name: course.mentor.user.name,
      headline: course.mentor.headline,
      rating,
      reviewCount: course.mentor.reviews.length,
      avatarUrl: course.mentor.user.avatarUrl,
    },
    lessonCount: course.lessons.length,
    totalDurationMin: course.lessons.reduce((a, l) => a + l.durationMin, 0),
    liveCount: course.lessons.filter((l) => l.kind === 'LIVE').length,
    mentorshipCount: course.mentorshipCount,
    studentCount: course.enrollments.length,
    rating: courseRating,
    reviewCount: course.reviews.length,
  }
}
