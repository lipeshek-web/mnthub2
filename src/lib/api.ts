import type {
  AvailabilitySlotInput,
  BookingDTO,
  CheckoutResultDTO,
  ContentPostDTO,
  CourseDetailDTO,
  CourseLessonDTO,
  CourseListItemDTO,
  CourseThemeDTO,
  EnrolledCourseDTO,
  LibraryItemDTO,
  LibraryItemDetailDTO,
  LessonAttachmentDTO,
  LessonNoteDTO,
  LessonQuestionDTO,
  MentorDetailDTO,
  MentorListItemDTO,
  MentorLpDTO,
  MyTrackDTO,
  ReviewDTO,
  SocialLinksDTO,
  TrackDetailDTO,
  TrackItemInput,
  TrackListItemDTO,
  TrackingStatsDTO,
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
  // Autenticação
  register: (data: { name: string; email: string; password: string }) =>
    request<UserDTO>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<UserDTO>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: (userId: string) =>
    request<{ user: UserDTO | null }>(`/api/auth/me${qs({ userId })}`),

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
    avatarUrl?: string | null
    coverUrl?: string | null
    gaMeasurementId?: string | null
    metaPixelId?: string | null
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
    coverUrl?: string | null
    mentorshipCount?: number
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
      coverUrl?: string | null
      mentorshipCount?: number
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
      kind?: 'RECORDED' | 'TEXT' | 'LIVE' | 'READING'
      videoUrl?: string
      content?: string
      startsAt?: string
      meetingUrl?: string
      attachments?: LessonAttachmentDTO[]
      themeId?: string | null
      libraryItemId?: string | null
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
  updateLesson: (
    courseId: string,
    lessonId: string,
    data: { userId: string; themeId?: string | null; title?: string; description?: string; order?: number }
  ) =>
    request<{ ok: boolean }>(`/api/courses/${courseId}/lessons${qs({ lessonId })}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Temas (módulos) do curso
  createTheme: (
    courseId: string,
    data: { userId: string; title: string; description?: string }
  ) =>
    request<CourseThemeDTO>(`/api/courses/${courseId}/themes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTheme: (
    courseId: string,
    themeId: string,
    data: { userId: string; title?: string; description?: string; order?: number }
  ) =>
    request<{ ok: boolean }>(`/api/courses/${courseId}/themes${qs({ themeId })}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTheme: (courseId: string, themeId: string, userId: string) =>
    request<{ ok: boolean }>(
      `/api/courses/${courseId}/themes${qs({ themeId, userId })}`,
      { method: 'DELETE' }
    ),
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

  // Classroom pro: Q&A e anotações da aula
  listLessonQuestions: (lessonId: string, userId: string) =>
    request<LessonQuestionDTO[]>(`/api/lessons/${lessonId}/questions${qs({ userId })}`),
  askLessonQuestion: (lessonId: string, data: { userId: string; body: string }) =>
    request<LessonQuestionDTO>(`/api/lessons/${lessonId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  answerQuestion: (questionId: string, data: { userId: string; answer: string }) =>
    request<{ id: string; answer: string | null; answeredAt: string | null }>(
      `/api/questions/${questionId}`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),
  deleteQuestion: (questionId: string, userId: string) =>
    request<{ ok: boolean }>(`/api/questions/${questionId}${qs({ userId })}`, { method: 'DELETE' }),
  getLessonNote: (lessonId: string, userId: string) =>
    request<LessonNoteDTO>(`/api/lessons/${lessonId}/note${qs({ userId })}`),
  saveLessonNote: (lessonId: string, data: { userId: string; body: string }) =>
    request<LessonNoteDTO>(`/api/lessons/${lessonId}/note`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Biblioteca (artigos e livros)
  listLibrary: (params: {
    search?: string
    kind?: string // ARTICLE | BOOK
    category?: string
    sort?: string
    authorUserId?: string // inclui rascunhos do próprio mentor
  }) => request<LibraryItemDTO[]>(`/api/library${qs(params)}`),
  getLibraryItem: (id: string, userId?: string) =>
    request<LibraryItemDetailDTO>(`/api/library/${id}${qs({ userId })}`),
  createLibraryItem: (data: {
    userId: string
    kind: 'ARTICLE' | 'BOOK'
    title: string
    description?: string
    category?: string
    level?: string
    coverUrl?: string | null
    pdfUrl?: string | null
    content?: string | null
    readingMin?: number
  }) => request<{ id: string }>('/api/library', { method: 'POST', body: JSON.stringify(data) }),
  updateLibraryItem: (
    id: string,
    data: {
      userId: string
      kind?: 'ARTICLE' | 'BOOK'
      title?: string
      description?: string
      category?: string
      level?: string
      coverUrl?: string | null
      pdfUrl?: string | null
      content?: string | null
      readingMin?: number
      isPublished?: boolean
    }
  ) => request<{ ok: boolean }>(`/api/library/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLibraryItem: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/library/${id}${qs({ userId })}`, { method: 'DELETE' }),

  // Trilhas
  listTracks: (params: { search?: string; category?: string; sort?: string; mentorUserId?: string }) =>
    request<TrackListItemDTO[]>(`/api/tracks${qs(params)}`),
  getTrack: (id: string, userId?: string) =>
    request<TrackDetailDTO>(`/api/tracks/${id}${qs({ userId })}`),
  createTrack: (data: {
    userId: string
    title: string
    description: string
    category: string
    level: string
    price: number
    coverUrl?: string | null
    items: TrackItemInput[]
  }) => request<{ id: string }>('/api/tracks', { method: 'POST', body: JSON.stringify(data) }),
  updateTrack: (
    id: string,
    data: {
      userId: string
      title?: string
      description?: string
      category?: string
      level?: string
      price?: number
      coverUrl?: string | null
      isPublished?: boolean
      items?: TrackItemInput[]
    }
  ) => request<{ ok: boolean }>(`/api/tracks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTrack: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/tracks/${id}${qs({ userId })}`, { method: 'DELETE' }),
  enrollTrack: (trackId: string, userId: string) =>
    request<{ ok: boolean }>(`/api/tracks/${trackId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  listMyTracks: (userId: string) =>
    request<MyTrackDTO[]>(`/api/tracks/mine${qs({ userId })}`),

  // Upload de arquivos (imagens: avatar/capas · documentos: anexos de aula)
  uploadImage: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch('/api/upload', { method: 'POST', body: fd, cache: 'no-store' }).then(async (res) => {
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error || 'Falha no upload do arquivo.')
      return json.url
    })
  },

  // Upload de anexo de aula (documento/vídeo/áudio) → { url, name }
  uploadAttachment: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch('/api/upload', { method: 'POST', body: fd, cache: 'no-store' }).then(async (res) => {
      const json = (await res.json().catch(() => ({}))) as {
        url?: string
        name?: string
        error?: string
      }
      if (!res.ok || !json.url) throw new Error(json.error || 'Falha no upload do anexo.')
      return { url: json.url, name: json.name || file.name }
    })
  },

  // LP pública do mentor (tráfego pago) — por slug
  getMentorBySlug: (slug: string) => request<MentorLpDTO>(`/api/mentors/by-slug/${encodeURIComponent(slug)}`),

  // Checkout (pagamento demonstrativo) — curso ou trilha
  checkout: (data: {
    userId: string
    courseId?: string
    trackId?: string
    paymentMethod: 'PIX' | 'CREDIT_CARD'
  }) => request<CheckoutResultDTO>('/api/checkout', { method: 'POST', body: JSON.stringify(data) }),

  // Estatísticas de tráfego do mentor (dashboard)
  trackingStats: (mentorUserId: string) =>
    request<TrackingStatsDTO>(`/api/track/stats${qs({ mentorUserId })}`),
}
