import type {
  AiLessonSummaryDTO,
  AiTutorChatMessage,
  AvailabilitySlotInput,
  BookingDTO,
  CertificateDTO,
  CheckoutResultDTO,
  ContentPostDTO,
  CouponDTO,
  CouponValidationDTO,
  CourseDetailDTO,
  CourseLessonDTO,
  CourseListItemDTO,
  CourseReviewsResponseDTO,
  CourseThemeDTO,
  EnrolledCourseDTO,
  FinanceDTO,
  LibraryItemDTO,
  LibraryItemDetailDTO,
  LessonAttachmentDTO,
  LessonNoteDTO,
  LessonQuestionDTO,
  MessageDTO,
  MessagesResponseDTO,
  NotificationsResponseDTO,
  ThreadsResponseDTO,
  QuizAttemptResultDTO,
  QuizDTO,
  RecommendationsDTO,
  XpStatsDTO,
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
    /** Tipografia da página do criador (ids do catálogo em src/lib/fonts.ts) */
    fontHeading?: string | null
    fontBody?: string | null
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
    request<{
      completedLessonIds: string[]
      xpAwarded: number
      courseCompleted: boolean
    }>(`/api/courses/${courseId}/enroll`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Quiz da aula (correção no servidor + XP)
  listLessonQuizzes: (lessonId: string, userId?: string) =>
    request<QuizDTO[]>(`/api/lessons/${lessonId}/quizzes${qs({ userId })}`),
  createQuiz: (
    lessonId: string,
    data: { userId: string; prompt: string; options: string[]; correctIndex: number; explanation: string }
  ) =>
    request<QuizDTO>(`/api/lessons/${lessonId}/quizzes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateQuiz: (
    quizId: string,
    data: { userId: string; prompt?: string; options?: string[]; correctIndex?: number; explanation?: string }
  ) =>
    request<{ ok: boolean }>(`/api/quizzes/${quizId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteQuiz: (quizId: string, userId: string) =>
    request<{ ok: boolean }>(`/api/quizzes/${quizId}${qs({ userId })}`, { method: 'DELETE' }),
  answerQuiz: (quizId: string, data: { userId: string; selectedIndex: number }) =>
    request<QuizAttemptResultDTO>(`/api/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Gamificação: XP e ofensiva de estudos
  xpStats: (userId: string) => request<XpStatsDTO>(`/api/xp${qs({ userId })}`),

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

  // Checkout (pagamento demonstrativo) — curso ou trilha, com cupom opcional
  checkout: (data: {
    userId: string
    courseId?: string
    trackId?: string
    paymentMethod: 'PIX' | 'CREDIT_CARD'
    couponCode?: string
  }) => request<CheckoutResultDTO>('/api/checkout', { method: 'POST', body: JSON.stringify(data) }),

  // Estatísticas de tráfego do mentor (dashboard)
  trackingStats: (mentorUserId: string) =>
    request<TrackingStatsDTO>(`/api/track/stats${qs({ mentorUserId })}`),

  // Notificações in-app (sino do header)
  listNotifications: (userId: string) =>
    request<NotificationsResponseDTO>(`/api/notifications${qs({ userId })}`),
  markNotificationsRead: (userId: string, ids?: string[]) =>
    request<{ ok: boolean }>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify({ userId, ids }),
    }),

  // Mensagens diretas (chat aluno ↔ mentor)
  listThreads: (userId: string) =>
    request<ThreadsResponseDTO>(`/api/messages/threads${qs({ userId })}`),
  listMessages: (userId: string, peerId: string) =>
    request<MessagesResponseDTO>(`/api/messages${qs({ userId, peerId })}`),
  sendMessage: (userId: string, peerId: string, body: string) =>
    request<MessageDTO>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ userId, peerId, body }),
    }),
  unreadMessages: (userId: string) =>
    request<{ count: number }>(`/api/messages/unread${qs({ userId })}`),

  // Avaliações de curso
  listCourseReviews: (courseId: string) =>
    request<CourseReviewsResponseDTO>(`/api/courses/${courseId}/reviews`),
  saveCourseReview: (
    courseId: string,
    data: { userId: string; rating: number; comment: string }
  ) =>
    request<{ id: string; updated: boolean }>(`/api/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Certificado de conclusão (código público verificável)
  issueCertificate: (courseId: string, userId: string) =>
    request<{ code: string; issuedAt: string }>('/api/certificates', {
      method: 'POST',
      body: JSON.stringify({ courseId, userId }),
    }),
  getCertificate: (code: string) =>
    request<CertificateDTO>(`/api/certificates/${encodeURIComponent(code)}`),

  // Cupons de desconto (painel do mentor + checkout)
  listCoupons: (userId: string) => request<CouponDTO[]>(`/api/coupons${qs({ userId })}`),
  createCoupon: (data: {
    userId: string
    code: string
    percentOff?: number | null
    amountOff?: number | null
    maxUses?: number | null
    expiresAt?: string | null
  }) => request<CouponDTO>('/api/coupons', { method: 'POST', body: JSON.stringify(data) }),
  toggleCoupon: (data: { userId: string; id: string; isActive: boolean }) =>
    request<{ id: string; isActive: boolean }>('/api/coupons', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCoupon: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/coupons${qs({ userId, id })}`, { method: 'DELETE' }),
  validateCoupon: (data: { code: string; courseId?: string; trackId?: string }) =>
    request<CouponValidationDTO>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Financeiro do mentor
  finance: (userId: string) => request<FinanceDTO>(`/api/mentors/finance${qs({ userId })}`),

  // Duplicar curso (rascunho com temas/aulas/quizzes)
  duplicateCourse: (courseId: string, userId: string) =>
    request<{ id: string; title: string }>(`/api/courses/${courseId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // IA: resumo da aula (gerado 1x no servidor e cacheado)
  lessonAiSummary: (lessonId: string, userId: string) =>
    request<AiLessonSummaryDTO>(`/api/lessons/${lessonId}/ai-summary`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // IA: tutor do curso (responde com base no conteúdo do curso/aula)
  aiTutor: (data: {
    courseId: string
    lessonId?: string
    userId: string
    message: string
    history: AiTutorChatMessage[]
  }) =>
    request<{ reply: string }>('/api/ai/tutor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // IA: recomendações personalizadas ("Feito para você")
  recommendations: (userId: string) =>
    request<RecommendationsDTO>(`/api/ai/recommendations${qs({ userId })}`),
}
