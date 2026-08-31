import { useAppStore } from './store'
import type {
  AdminPaymentsResponseDTO,
  AdminStatsDTO,
  AdminUsersResponseDTO,
  AiLessonSummaryDTO,
  AiTutorChatMessage,
  AsaasSettingsDTO,
  AuditLogDTO,
  AvailabilitySlotInput,
  AdminCouponsResponseDTO,
  BookingDTO,
  BundleDTO,
  BundleDetailDTO,
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
  MembershipDTO,
  PaymentStatusDTO,
  PaymentsConfigDTO,
  PendingPaymentDTO,
  PlatformCouponDTO,
  PromoBarItemDTO,
  ReminderRunDTO,
  WeeklyGoalDTO,
  MessagesResponseDTO,
  NotificationsResponseDTO,
  ReferralsDTO,
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
  // Timeout padrão de 15s: rede travada não deixa skeleton eterno nem empilha polls.
  // Callers podem passar o próprio signal (AbortController) para cancelar.
  const signal = options?.signal ?? AbortSignal.timeout(15_000)
  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      cache: 'no-store',
      signal,
      headers: {
        ...(hasBody(options) ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...options?.headers,
      },
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('A conexão demorou demais. Verifique sua internet e tente de novo.')
    }
    throw err
  }
  let json: unknown = {}
  try {
    json = await res.json()
  } catch {
    json = {}
  }
  if (!res.ok) {
    // Sessão inválida/expirada: limpa a sessão local e pede novo login
    if (res.status === 401) {
      clearSession()
      const msg401 = (json as { error?: string })?.error || 'Sessão expirada. Entre novamente.'
      throw new Error(msg401)
    }
    const msg = (json as { error?: string })?.error || 'Ocorreu um erro inesperado. Tente novamente.'
    throw new Error(msg)
  }
  return json as T
}

/** true quando a requisição tem corpo (POST/PUT/PATCH) — só então envia Content-Type JSON */
function hasBody(options?: RequestInit): boolean {
  const method = (options?.method || 'GET').toUpperCase()
  return options?.body != null || method === 'POST' || method === 'PUT' || method === 'PATCH'
}

/** Limpa a sessão local (token + usuário) quando o servidor rejeita a sessão */
function clearSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem('mentorhub-session')
    window.dispatchEvent(new CustomEvent('mentorhub:session-expired'))
  } catch {
    /* ignora */
  }
}

/**
 * Header Authorization com o token de sessão assinado (emitido no login/
 * registro/verificação MFA e persistido junto ao usuário no zustand).
 * Anexado em TODAS as chamadas — o servidor decide quais rotas exigem.
 */
function authHeaders(): Record<string, string> {
  try {
    const token = useAppStore.getState().user?.sessionToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
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
  register: (data: { name: string; email: string; password: string; refCode?: string }) =>
    request<UserDTO & { referralApplied?: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<
      | UserDTO
      | { mfaRequired: true; mfaTicket: string; email: string }
    >('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyMfa: (data: { ticket: string; code: string }) =>
    request<
      UserDTO & { usedRecoveryCode?: boolean; recoveryCodesRemaining?: number }
    >('/api/auth/mfa/verify', { method: 'POST', body: JSON.stringify(data) }),
  me: (userId: string) =>
    request<{ user: UserDTO | null }>(`/api/auth/me${qs({ userId })}`),

  // Usuários
  /** Contas de demonstração para o seletor de login (substitui o antigo listUsers) */
  demoAccounts: () =>
    request<{ id: string; name: string; email: string; avatarUrl: string | null }[]>(
      '/api/auth/demo-accounts'
    ),

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

  // Baixa o .ics via fetch autenticado (a rota exige sessão — <a href> não
  // anexa Authorization) e dispara o download no browser.
  exportCalendar: async () => {
    const res = await fetch('/api/calendar/export', {
      cache: 'no-store',
      headers: authHeaders(),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      let msg = 'Não foi possível exportar o calendário.'
      try {
        msg = ((await res.json()) as { error?: string })?.error || msg
      } catch {
        /* resposta não-JSON */
      }
      throw new Error(msg)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mentorhub.ics'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  },

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

  // Checkout — curso, trilha, pacote ou assinatura (gateway Asaas ou modo demonstração)
  checkout: (
    data: {
      userId: string
      courseId?: string
      trackId?: string
      bundleId?: string
      membershipId?: string
      paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO'
      couponCode?: string
      useCredits?: boolean
      cpfCnpj?: string
    }
  ) =>
    request<CheckoutResultDTO | { pending: true; order: CheckoutResultDTO['order']; payment: PendingPaymentDTO }>(
      '/api/checkout',
      { method: 'POST', body: JSON.stringify(data) }
    ),

  // Pagamentos (config do gateway + status de cobrança pendente)
  paymentsConfig: () => request<PaymentsConfigDTO>('/api/payments/config'),
  paymentStatus: (userId: string, paymentId: string) =>
    request<PaymentStatusDTO>(`/api/payments/status${qs({ userId, paymentId })}`),

  // Pacotes de cursos (bundles)
  listBundles: (params: { mentorUserId?: string; courseId?: string; userId?: string }) =>
    request<{ bundles: BundleDTO[] }>(`/api/bundles${qs(params)}`),
  getBundle: (id: string, userId?: string) =>
    request<{ bundle: BundleDetailDTO }>(`/api/bundles/${id}${qs({ userId })}`),
  saveBundle: (data: {
    userId: string
    id?: string
    title: string
    description?: string
    price: number
    courseIds: string[]
    isPublished?: boolean
  }) => request<{ id: string }>('/api/bundles', { method: 'POST', body: JSON.stringify(data) }),
  deleteBundle: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/bundles/${id}${qs({ userId })}`, { method: 'DELETE' }),

  // Programa de indicação (código, saldo e convidados)
  referrals: (userId: string) => request<ReferralsDTO>(`/api/referrals${qs({ userId })}`),

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
  /** Contadores de sininhos do header (mensagens + notificações) em 1 request autenticado */
  badges: () => request<{ messages: number; notifications: number }>('/api/badges'),

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
  validateCoupon: (data: { code: string; userId?: string; courseId?: string; trackId?: string; bundleId?: string; membershipId?: string }) =>
    request<CouponValidationDTO>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Barra promocional (público): cupons ativos em rotação acima do header
  promoBar: () => request<{ items: PromoBarItemDTO[] }>('/api/promo-bar'),

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

  // Assinatura do mentor (membership)
  listMemberships: (params: { mentorUserId?: string; mentorId?: string; userId?: string }) =>
    request<{ memberships: MembershipDTO[] }>(`/api/memberships${qs(params)}`),
  getMembership: (id: string, userId?: string) =>
    request<{ membership: MembershipDTO }>(`/api/memberships/${id}${qs({ userId })}`),
  saveMembership: (data: {
    userId: string
    id?: string
    title: string
    description?: string
    price: number
    groupSessionDay?: number
    groupSessionTime?: string
    isPublished?: boolean
  }) => request<{ id: string }>('/api/memberships', { method: 'POST', body: JSON.stringify(data) }),
  deleteMembership: (id: string, userId: string) =>
    request<{ ok: boolean }>(`/api/memberships/${id}${qs({ userId })}`, { method: 'DELETE' }),
  cancelMembership: (data: { userId: string; membershipId: string }) =>
    request<{ ok: boolean }>('/api/memberships/cancel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Meta semanal de estudos (progresso calculado no servidor)
  getWeeklyGoal: (userId: string) =>
    request<WeeklyGoalDTO>(`/api/goals/weekly${qs({ userId })}`),
  updateWeeklyGoal: (data: { userId: string; targetLessons: number }) =>
    request<WeeklyGoalDTO>('/api/goals/weekly', { method: 'PUT', body: JSON.stringify(data) }),

  // Lembretes automáticos (idempotente — seguro chamar a cada boot)
  runReminders: (userId: string) =>
    request<ReminderRunDTO>('/api/reminders/run', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // ==================== PAINEL DE ADMINISTRAÇÃO ====================
  // Todas as chamadas exigem o header x-admin-token (sessão emitida no login)
  admin: {
    stats: (token: string) =>
      request<AdminStatsDTO>('/api/admin/stats', { headers: { 'x-admin-token': token } }),

    users: (token: string, params: { q?: string; page?: number }) =>
      request<AdminUsersResponseDTO>(`/api/admin/users${qs({ ...params })}`, {
        headers: { 'x-admin-token': token },
      }),
    userAction: (
      token: string,
      data: { userId: string; action: 'promote' | 'demote' | 'block' | 'unblock' }
    ) =>
      request<{ user: { id: string; role: string; blocked: boolean } }>('/api/admin/users', {
        method: 'PATCH',
        headers: { 'x-admin-token': token },
        body: JSON.stringify(data),
      }),

    // Cupons de plataforma (barra promocional / descontos globais)
    coupons: (token: string) =>
      request<AdminCouponsResponseDTO>('/api/admin/coupons', {
        headers: { 'x-admin-token': token },
      }),
    createCoupon: (
      token: string,
      data: {
        code: string
        percentOff?: number | null
        amountOff?: number | null
        scope: 'SITE_WIDE' | 'NEW_ACCOUNTS' | 'CATEGORY' | 'MENTOR'
        category?: string
        mentorId?: string
        maxUses?: number | null
        expiresAt?: string | null
        showInPromoBar?: boolean
        promoMessage?: string | null
      }
    ) =>
      request<{ coupon: PlatformCouponDTO }>('/api/admin/coupons', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify(data),
      }),
    updateCoupon: (
      token: string,
      data: { id: string; isActive?: boolean; showInPromoBar?: boolean; promoMessage?: string | null }
    ) =>
      request<{ coupon: PlatformCouponDTO }>('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'x-admin-token': token },
        body: JSON.stringify(data),
      }),
    deleteCoupon: (token: string, id: string) =>
      request<{ ok: boolean }>(`/api/admin/coupons${qs({ id })}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      }),

    settings: (token: string) =>
      request<{ asaas: AsaasSettingsDTO }>('/api/admin/settings', {
        headers: { 'x-admin-token': token },
      }),
    saveSettings: (token: string, data: { apiKey?: string; env: 'sandbox' | 'production' }) =>
      request<{ asaas: AsaasSettingsDTO }>('/api/admin/settings', {
        method: 'PUT',
        headers: { 'x-admin-token': token },
        body: JSON.stringify(data),
      }),
    removeSettings: (token: string) =>
      request<{ asaas: AsaasSettingsDTO }>('/api/admin/settings', {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      }),
    testConnection: (token: string) =>
      request<{ ok: true; env: string; stats: { received: number; pending: number } } | { ok: false; error: string }>(
        '/api/admin/settings',
        { method: 'POST', headers: { 'x-admin-token': token }, body: JSON.stringify({ action: 'test' }) }
      ),
    createWebhook: (token: string, url: string, email: string) =>
      request<{ ok: true; asaas: AsaasSettingsDTO } | { ok: false; error: string }>(
        '/api/admin/settings',
        { method: 'POST', headers: { 'x-admin-token': token }, body: JSON.stringify({ action: 'webhook', url, email }) }
      ),

    payments: (token: string, params: { status?: string; q?: string; page?: number }) =>
      request<AdminPaymentsResponseDTO>(`/api/admin/payments${qs({ ...params })}`, {
        headers: { 'x-admin-token': token },
      }),
    paymentAction: (
      token: string,
      data: { paymentId: string; action: 'confirm_asaas' | 'sync' | 'cancel' }
    ) =>
      request<{ ok: boolean } & Record<string, unknown>>('/api/admin/payments', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify(data),
      }),

    mfaStatus: (token: string) =>
      request<{ mfaEnabled: boolean; recoveryCodesRemaining: number }>('/api/admin/mfa', {
        headers: { 'x-admin-token': token },
      }),
    mfaSetup: (token: string) =>
      request<{ secret: string; uri: string; qrDataUrl: string }>('/api/admin/mfa', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify({ action: 'setup' }),
      }),
    mfaEnable: (token: string, code: string) =>
      request<{ ok: true; mfaEnabled: true; recoveryCodes: string[] }>('/api/admin/mfa', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify({ action: 'enable', code }),
      }),
    mfaRegenerateCodes: (token: string, password: string) =>
      request<{ ok: true; recoveryCodes: string[] }>('/api/admin/mfa', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify({ action: 'regenerate-codes', password }),
      }),
    mfaDisable: (token: string, password: string) =>
      request<{ ok: true; mfaEnabled: false }>('/api/admin/mfa', {
        method: 'POST',
        headers: { 'x-admin-token': token },
        body: JSON.stringify({ action: 'disable', password }),
      }),

    audit: (token: string, page = 1) =>
      request<{ logs: AuditLogDTO[]; total: number; page: number; pages: number }>(
        `/api/admin/audit${qs({ page })}`,
        { headers: { 'x-admin-token': token } }
      ),
  },
}
