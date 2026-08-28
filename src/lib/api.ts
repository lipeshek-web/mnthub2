import type {
  AvailabilitySlotInput,
  BookingDTO,
  ContentPostDTO,
  CourseDetailDTO,
  CourseLessonDTO,
  CourseListItemDTO,
  EnrolledCourseDTO,
  MentorDetailDTO,
  MentorListItemDTO,
  ReviewDTO,
  SocialLinksDTO,
  UserDTO,
} from './types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  })
  let json: unknown = {}
  try {
    json = await res.json()
  } catch {
    json = {}
  }
  if (!res.ok) {
    const msg = (json as { error?: string })?.error || 'Ocorreu um erro inesperado. Tente novamente.'
    throw new Error(msg)
  }
  return json as T
}

const qs = (params: Record<string, string | number | undefined>) => {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export const api = {
  // Usuários
  listUsers: () => request<UserDTO[]>('/api/users'),
  createUser: (data: { name: string; email: string }) =>
    request<UserDTO>('/api/users', { method: 'POST', body: JSON.stringify(data) }),

  // Mentores
  listMentors: (params: { search?: string; category?: string; sort?: string }) =>
    request<MentorListItemDTO[]>(`/api/mentors${qs(params)}`),
  getMentor: (id: string) => request<MentorDetailDTO>(`/api/mentors/${id}`),
  getMyMentorProfile: (userId: string) =>
    request<{ profile: MentorDetailDTO | null }>(`/api/mentors/me${qs({ userId })}`),
  saveMentorProfile: (data: {
    userId: string
    headline: string
    description: string
    categories: string[]
    hourlyRate: number
    experienceYears: number
    languages: string
    socials?: SocialLinksDTO
  }) => request<{ id: string }>('/api/mentors', { method: 'POST', body: JSON.stringify(data) }),
  saveAvailability: (data: { userId: string; slots: AvailabilitySlotInput[] }) =>
    request<{ ok: boolean }>('/api/mentors/availability', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Horários livres
  getSlots: (mentorId: string, date: string) =>
    request<{ slots: string[] }>(`/api/slots${qs({ mentorId, date })}`),

  // Agendamentos
  listBookings: (userId: string) => request<BookingDTO[]>(`/api/bookings${qs({ userId })}`),
  createBooking: (data: {
    menteeId: string
    mentorId: string
    startsAt: string
    durationMin: number
    topic: string
    notes?: string
  }) => request<BookingDTO>('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id: string, data: { userId: string; action: 'confirm' | 'cancel' | 'complete' }) =>
    request<BookingDTO>(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Avaliações
  createReview: (data: { bookingId: string; userId: string; rating: number; comment: string }) =>
    request<ReviewDTO>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Conteúdos do mural
  createContent: (data: {
    userId: string
    title: string
    description: string
    tags: string[]
    type: string
    level: string
    durationMin: number
  }) => request<ContentPostDTO>('/api/contents', { method: 'POST', body: JSON.stringify(data) }),
  deleteContent: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/contents/${id}${qs({ userId })}`, { method: 'DELETE' }),

  // Cursos
  listCourses: (params: {
    search?: string
    category?: string
    sort?: string
    mentorId?: string
    mentorUserId?: string // lista também rascunhos do próprio mentor
  }) => request<CourseListItemDTO[]>(`/api/courses${qs(params)}`),
  getCourse: (id: string, userId?: string) =>
    request<CourseDetailDTO>(`/api/courses/${id}${qs({ userId })}`),
  createCourse: (data: {
    userId: string
    title: string
    description: string
    category: string
    level: string
    price: number
  }) => request<{ id: string }>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (
    id: string,
    data: {
      userId: string
      title?: string
      description?: string
      category?: string
      level?: string
      price?: number
      isPublished?: boolean
    }
  ) => request<{ ok: boolean }>(`/api/courses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCourse: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/courses/${id}${qs({ userId })}`, { method: 'DELETE' }),
  createLesson: (
    courseId: string,
    data: {
      userId: string
      title: string
      description?: string
      videoUrl?: string
      content?: string
      durationMin: number
    }
  ) =>
    request<CourseLessonDTO>(`/api/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteLesson: (courseId: string, lessonId: string, userId: string) =>
    request<{ ok: boolean }>(`/api/courses/${courseId}/lessons${qs({ userId, lessonId })}`, {
      method: 'DELETE',
    }),
  enrollCourse: (courseId: string, userId: string) =>
    request<{ ok: boolean; alreadyEnrolled: boolean }>(`/api/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  toggleLessonComplete: (courseId: string, data: { userId: string; lessonId: string }) =>
    request<{ completedLessonIds: string[] }>(`/api/courses/${courseId}/enroll`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Matrículas do usuário
  listMyEnrollments: (userId: string) =>
    request<EnrolledCourseDTO[]>(`/api/enrollments${qs({ userId })}`),
}
