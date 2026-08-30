// Tipos compartilhados entre frontend e API da plataforma MentorHub

export interface UserDTO {
  id: string
  name: string
  email: string
  bio?: string | null
  avatarUrl?: string | null
  /** true quando o usuário possui perfil de mentor cadastrado */
  isMentor?: boolean
  /** Saldo de créditos de indicação em centavos (R$ 10 = 1000) */
  creditCents?: number
  /** Papel na plataforma: USER (padrão) ou ADMIN (painel de administração) */
  role?: 'USER' | 'ADMIN' | string
  blocked?: boolean
  /** Segundo fator (TOTP) ativo nesta conta */
  mfaEnabled?: boolean
  /** Token da sessão administrativa (só admins, emitido no login) */
  adminToken?: string | null
}

export interface SocialLinksDTO {
  instagram?: string | null
  linkedin?: string | null
  github?: string | null
  website?: string | null
}

/** IDs públicos de rastreamento do mentor (GA4 / Meta Pixel) */
export interface TrackingIdsDTO {
  gaMeasurementId?: string | null
  metaPixelId?: string | null
}

/** Atribuição de tráfego (last-touch) enviada junto dos eventos e pedidos */
export interface AttributionDTO {
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  utmContent?: string | null
  utmTerm?: string | null
  gclid?: string | null
  fbclid?: string | null
  channel: string // direct | social | paid_social | paid_search | email | referral
  landingPage: 'mentor_lp' | 'platform'
}

export interface MentorListItemDTO {
  id: string
  userId: string
  name: string
  headline: string
  categories: string[]
  hourlyRate: number
  experienceYears: number
  languages: string
  rating: number // 0..5 (0 = sem avaliações)
  reviewCount: number
  contentsCount: number
  totalSessions: number
  socials: SocialLinksDTO
  avatarUrl?: string | null
  coverUrl?: string | null
  slug?: string | null
}

export interface ReviewDTO {
  id: string
  rating: number
  comment: string
  createdAt: string
  authorId: string
  authorName: string
}

export interface ContentPostDTO {
  id: string
  title: string
  description: string
  tags: string[]
  type: 'ARTICLE' | 'VIDEO' | 'WORKSHOP' | 'TRAIL' | string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | string
  durationMin: number
  createdAt: string
}

export interface AvailabilityDTO {
  id: string
  weekday: number // 0 = dom ... 6 = sáb
  startHour: number
  endHour: number
}

export interface MentorDetailDTO {
  id: string
  userId: string
  name: string
  bio?: string | null
  headline: string
  description: string
  categories: string[]
  hourlyRate: number
  experienceYears: number
  languages: string
  socials: SocialLinksDTO
  contents: ContentPostDTO[]
  availabilities: AvailabilityDTO[]
  reviews: ReviewDTO[]
  rating: number
  reviewCount: number
  totalSessions: number
  bookedSlots: string[] // "YYYY-MM-DDTHH:mm" já agendados (CONFIRMED/PENDING futuros)
  avatarUrl?: string | null
  coverUrl?: string | null
  /** Tipografia da página do criador (ids do catálogo em src/lib/fonts.ts; null = padrão) */
  fontHeading?: string | null
  fontBody?: string | null
  slug?: string | null
  /** IDs de rastreamento do mentor (presentes no /me e no detalhe público) */
  tracking?: TrackingIdsDTO | null
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

export interface BookingDTO {
  id: string
  startsAt: string // "YYYY-MM-DDTHH:mm"
  durationMin: number
  topic: string
  notes?: string | null
  status: BookingStatus | string
  meetingRoom: string
  price: number
  createdAt: string
  mentor: {
    id: string
    userId: string
    name: string
    headline: string
  }
  mentee: {
    id: string
    name: string
  }
  reviewed: boolean // mentorado já avaliou esta sessão
}

export interface AvailabilitySlotInput {
  weekday: number
  startHour: number
  endHour: number
}

// ==================== CURSOS ====================

export interface CourseLessonDTO {
  id: string
  title: string
  description: string
  kind: 'RECORDED' | 'TEXT' | 'LIVE' | 'READING' | string
  videoUrl: string | null
  content: string | null
  startsAt: string | null // LIVE: "YYYY-MM-DDTHH:mm"
  meetingUrl: string | null // LIVE: link da transmissão (só p/ inscritos)
  attachments: LessonAttachmentDTO[]
  hasAttachments: boolean
  durationMin: number
  questionCount: number
  quizCount: number
  order: number
  themeId: string | null // tema (módulo) da aula — null = sem tema
  /** Aula de leitura (READING): artigo/livro da Biblioteca (pdfUrl/content só p/ inscritos) */
  reading: { id: string; title: string; kind: string; pdfUrl: string | null; content: string | null } | null
}

export interface LessonAttachmentDTO {
  name: string
  url: string
}

/** Pergunta de quiz da aula. Para o aluno, correctIndex/explanation chegam null
 *  (correção no servidor) e são revelados na resposta do attempt. */
export interface QuizDTO {
  id: string
  prompt: string
  options: string[]
  correctIndex: number | null // mentor dono: gabarito; aluno: null até responder
  explanation: string | null
  order: number
  isMine: boolean
  myAttempt: { selectedIndex: number; correct: boolean } | null
}

export interface QuizAttemptResultDTO {
  correct: boolean
  correctIndex: number
  explanation: string
  xpAwarded: number
}

export interface XpStatsDTO {
  xp: number
  streak: number
  longestStreak: number
  lastStudyDate: string | null
  today: string
}

export interface LessonQuestionDTO {
  id: string
  body: string
  answer: string | null
  answeredAt: string | null
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
  isMine: boolean
}

export interface LessonNoteDTO {
  body: string
  updatedAt: string | null
}

export interface CourseListItemDTO {
  id: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | string
  price: number // 0 = gratuito
  isPublished: boolean
  mentor: {
    id: string
    userId: string
    name: string
    headline: string
    rating: number
    reviewCount: number
    avatarUrl?: string | null
    /** IDs de rastreamento do mentor — apenas no detalhe (para injetar os pixels dele) */
    tracking?: TrackingIdsDTO | null
  }
  lessonCount: number
  totalDurationMin: number
  liveCount: number
  mentorshipCount: number // sessões de mentoria 1:1 incluídas
  studentCount: number
  /** Nota média do curso (0 = sem avaliações de curso) */
  rating: number
  /** Nº de avaliações de alunos do curso */
  reviewCount: number
  coverUrl?: string | null
  createdAt: string
}

export interface CourseDetailDTO extends CourseListItemDTO {
  updatedAt: string
  lessons: CourseLessonDTO[]
  /** Temas (módulos) do curso em ordem — aulas sem tema ficam fora dos grupos */
  themes: CourseThemeDTO[]
  /** Preenchido quando userId é informado e o usuário está inscrito */
  enrollment: { completedLessonIds: string[] } | null
  /** Avaliações do curso (públicas) + resumo — preenchido no detalhe */
  reviews: CourseReviewDTO[]
  reviewSummary: { rating: number; count: number; distribution: number[] }
  /** Avaliação do próprio usuário (quando logado) */
  myReview: { rating: number; comment: string } | null
  /** Código do certificado do usuário neste curso (quando emitido) */
  certificateCode: string | null
}

export interface CourseThemeDTO {
  id: string
  title: string
  description: string
  order: number
}

export interface EnrolledCourseDTO {
  courseId: string
  enrolledAt: string
  completedLessonIds: string[]
  course: CourseListItemDTO
}

// ==================== NOTIFICAÇÕES ====================

export type NotificationKind =
  | 'booking_new'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'review_new'
  | 'lesson_new'
  | 'enrollment_new'
  | 'course_review_new'
  | 'purchase_new'
  | string

export interface NotificationDTO {
  id: string
  kind: NotificationKind
  title: string
  body?: string | null
  linkView?: 'dashboard' | 'course' | 'onboarding' | 'messages' | 'referrals' | null
  refId?: string | null
  read: boolean
  createdAt: string
}

export interface NotificationsResponseDTO {
  unreadCount: number
  items: NotificationDTO[]
}

// ==================== MENSAGENS DIRETAS (chat) ====================

export interface MessageDTO {
  id: string
  body: string
  mine: boolean
  read: boolean
  createdAt: string
}

export interface ThreadDTO {
  peer: { id: string; name: string; avatarUrl: string | null; isMentor: boolean }
  lastBody: string
  lastAt: string
  lastMine: boolean
  unread: number
}

export interface MessagesResponseDTO {
  peer: { id: string; name: string; avatarUrl: string | null; isMentor: boolean; headline?: string | null }
  items: MessageDTO[]
}

export interface ThreadsResponseDTO {
  unreadTotal: number
  threads: ThreadDTO[]
}

// ==================== AVALIAÇÕES DE CURSO ====================

export interface CourseReviewDTO {
  id: string
  rating: number
  comment: string
  createdAt: string
  student: { id: string; name: string; avatarUrl: string | null }
}

export interface CourseReviewsResponseDTO {
  rating: number
  count: number
  distribution: number[] // [5★, 4★, 3★, 2★, 1★]
  items: CourseReviewDTO[]
}

// ==================== CERTIFICADOS ====================

export interface CertificateDTO {
  code: string
  studentName: string
  courseTitle: string
  category: string
  mentorName: string
  mentorHeadline: string
  totalMin: number
  issuedAt: string
}

// ==================== CUPONS ====================

export interface CouponDTO {
  id: string
  code: string
  percentOff: number | null
  amountOff: number | null
  maxUses: number | null
  uses: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export interface CouponValidationDTO {
  ok: boolean
  code: string
  label: string
  discount: number
  finalPrice: number
}

// ==================== FINANCEIRO DO MENTOR ====================

export interface FinanceDTO {
  totalRevenue: number
  productsRevenue: number
  sessionsRevenue: number
  sessionsCount: number
  last30Revenue: number
  ordersCount: number
  avgTicket: number
  totalDiscount: number
  monthSeries: { label: string; revenue: number; orders: number }[] // últimos 6 meses
  byProduct: { id: string; title: string; revenue: number; orders: number }[]
  recentOrders: {
    id: string
    itemTitle: string
    amount: number
    discount: number
    couponCode: string | null
    channel: string
    createdAt: string
  }[]
}

// ==================== TRILHAS ====================

export interface TrackItemSummaryDTO {
  id: string
  type: 'COURSE' | 'MENTORSHIP' | string
  title: string
  sessionCount: number
  courseId: string | null
}

export interface TrackListItemDTO {
  id: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | string
  price: number // 0 = gratuita
  coverUrl?: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  mentor: {
    id: string
    userId: string
    name: string
    headline: string
    rating: number
    reviewCount: number
    avatarUrl?: string | null
  }
  courseCount: number
  mentorshipSessions: number
  lessonCount: number
  liveCount: number
  totalDurationMin: number
  studentCount: number
  items: TrackItemSummaryDTO[]
}

export interface TrackDetailItemDTO {
  id: string
  type: 'COURSE' | 'MENTORSHIP' | string
  title: string
  description: string
  courseId: string | null
  coverUrl?: string | null
  lessonCount: number
  liveCount: number
  totalDurationMin: number
  mentorshipCount: number
  studentCount: number
  sessionCount: number
}

export interface TrackDetailDTO extends TrackListItemDTO {
  items: TrackDetailItemDTO[]
  myEnrollment: { createdAt: string } | null
  courseProgress: Record<string, { completed: number; total: number }>
}

export interface MyTrackDTO extends TrackListItemDTO {
  enrolledAt: string | null
  percent: number
  perCourse: { courseId: string; completed: number; total: number }[]
}

// ==================== TRILHA — ENTRADA DE ITEM (onboarding) ====================

export interface TrackItemInput {
  type: 'COURSE' | 'MENTORSHIP'
  courseId?: string
  title?: string
  description?: string
  sessionCount?: number
}

// ==================== BIBLIOTECA (artigos e livros) ====================

export interface LibraryAuthorDTO {
  id: string
  userId: string
  name: string
  headline: string
  avatarUrl?: string | null
}

export interface LibraryItemDTO {
  id: string
  kind: 'ARTICLE' | 'BOOK' | string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | string
  coverUrl?: string | null
  readingMin: number
  isPublished: boolean
  hasPdf: boolean
  hasText: boolean
  createdAt: string
  author: LibraryAuthorDTO
  /** nº de aulas de cursos que usam este item como leitura */
  usageCount: number
}

export interface LibraryItemDetailDTO extends LibraryItemDTO {
  /** só preenchido quando o usuário pode ler (publicado, inscrito em curso vinculado ou autor) */
  pdfUrl: string | null
  content: string | null
  canRead: boolean
  /** cursos (máx. 5) que usam este item como leitura, via aulas vinculadas */
  linkedCourses?: { id: string; title: string }[]
}

// ==================== LP DO MENTOR (tráfego pago) ====================

/** Dados públicos da LP de um mentor: GET /api/mentors/by-slug/[slug] */
export interface MentorLpDTO {
  mentor: {
    id: string
    userId: string
    slug: string
    name: string
    headline: string
    description: string
    bio?: string | null
    categories: string[]
    hourlyRate: number
    experienceYears: number
    languages: string
    rating: number
    reviewCount: number
    totalSessions: number
    socials: SocialLinksDTO
    avatarUrl?: string | null
    coverUrl?: string | null
    /** Tipografia da LP (ids de src/lib/fonts.ts; null = padrão da plataforma) */
    fontHeading?: string | null
    fontBody?: string | null
    tracking: TrackingIdsDTO | null
  }
  courses: CourseListItemDTO[]
  contents: ContentPostDTO[]
  reviews: ReviewDTO[]
  studentCount: number
}

// ==================== CHECKOUT ====================

export interface PaymentMethod {
  value: 'PIX' | 'CREDIT_CARD'
  label: string
}

export interface OrderDTO {
  id: string
  itemKind: 'COURSE' | 'TRACK' | 'BUNDLE' | string
  itemTitle: string
  amount: number
  paymentMethod: string
  status: string
  createdAt: string
}

export interface CheckoutResultDTO {
  order: OrderDTO
  alreadyEnrolled: boolean
}

// ==================== STATS DE TRÁFEGO ====================

export interface TrackingTotalsDTO {
  pageviews: number
  viewItems: number
  checkouts: number
  purchases: number
  revenue: number
  conversionRate: number // purchases / pageviews (%)
}

export interface TrackingStatsDTO {
  totals: TrackingTotalsDTO
  byChannel: { channel: string; pageviews: number; purchases: number; revenue: number }[]
  bySource: { source: string; pageviews: number; purchases: number; revenue: number }[]
  byCourse: { courseId: string; title: string; purchases: number; revenue: number }[]
  daily: { date: string; pageviews: number; purchases: number }[] // últimos 14 dias
}

// ==================== IA (tutor, resumos, recomendações) ====================

/** Resumo IA da aula — gerado 1x no servidor e cacheado p/ todos os alunos */
export interface AiLessonSummaryDTO {
  summary: string
  keyPoints: string[]
  cached: boolean // true = já existia (gerado antes)
}

/** Mensagem da conversa com o Tutor IA (histórico mantido no cliente) */
export interface AiTutorChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Curso recomendado pela IA + motivo curto personalizado */
export interface RecommendationDTO {
  course: CourseListItemDTO
  reason: string
}

export interface RecommendationsDTO {
  items: RecommendationDTO[]
  /** true quando veio da IA personalizada; false = fallback popular */
  generated: boolean
}

// ==================== PACOTES DE CURSOS (bundles) ====================

export interface BundleCourseDTO {
  id: string
  title: string
  coverUrl?: string | null
  price: number
  category: string
}

export interface BundleDTO {
  id: string
  title: string
  description: string
  price: number
  isPublished: boolean
  createdAt: string
  mentor: {
    id: string
    userId: string
    name: string
    headline: string
    avatarUrl?: string | null
  }
  courses: BundleCourseDTO[]
  courseCount: number
  /** Soma dos preços dos cursos individuais (valor cheio) */
  coursesTotal: number
  /** Desconto implícito do pacote (0..100, arredondado) */
  discountPercent: number
}

export interface BundleDetailDTO extends BundleDTO {
  /** IDs de cursos do pacote em que o usuário já está inscrito (checkout) */
  myEnrolledCourseIds?: string[]
}

// ==================== PROGRAMA DE INDICAÇÃO ====================

export interface ReferralEntryDTO {
  id: string
  /** Nome do convidado (nunca e-mail) */
  referredName: string
  status: 'PENDING' | 'REWARDED' | string
  createdAt: string
  rewardedAt: string | null
}

export interface ReferralsDTO {
  code: string
  /** Link completo de convite (origin + ?ref=CODE) */
  shareUrl: string
  /** Saldo do usuário em centavos (R$ 10 = 1000) */
  creditCents: number
  invitedCount: number
  convertedCount: number
  earnedCents: number // total ganho com indicações
  pendingCount: number
  referrals: ReferralEntryDTO[]
}

// ==================== ASSINATURA DO MENTOR (membership) ====================

/** Assinante do plano (visão do painel do mentor) */
export interface MembershipSubscriberDTO {
  id: string
  name: string
  avatarUrl?: string | null
  status: 'ACTIVE' | 'CANCELLED' | string
  startedAt: string
  renewsAt: string
}

export interface MembershipDTO {
  id: string
  title: string
  description: string
  /** Mensalidade em R$ */
  price: number
  /** Dia da semana da sessão em grupo mensal (0=Dom..6=Sáb) */
  groupSessionDay: number
  /** Hora naive da sessão em grupo ("HH:mm") */
  groupSessionTime: string
  isPublished: boolean
  createdAt: string
  mentor: {
    id: string
    userId: string
    name: string
    headline: string
    avatarUrl?: string | null
  }
  /** Cursos publicados incluídos no plano */
  coursesCount: number
  /** Assinantes ativos (painel do mentor) */
  subscriberCount?: number
  /** Estado do usuário na requisição (view pública; null = não assinante) */
  myStatus?: 'ACTIVE' | 'CANCELLED' | null
  /** Fim do ciclo pago (quando assinante) */
  renewsAt?: string | null
  /** Lista de assinantes (apenas no painel do mentor) */
  subscribers?: MembershipSubscriberDTO[]
}

// ==================== META SEMANAL DE ESTUDOS ====================

export interface WeeklyGoalDTO {
  targetLessons: number
  /** Aulas concluídas na semana atual (segunda = início) */
  completedLessons: number
  goalAchieved: boolean
  /** "YYYY-MM-DD" da segunda-feira da semana atual */
  weekStart: string
  /** Concluídas nas últimas 4 semanas (mais antiga primeiro) */
  history: number[]
  /** true = meta definida pelo usuário; false = padrão (3 aulas) */
  isCustom: boolean
}

// ==================== LEMBRETES AUTOMÁTICOS ====================

export interface ReminderRunDTO {
  created: number
  /** Kinds criados nesta execução (dedupe no servidor) */
  kinds: string[]
}

// ==================== PAGAMENTOS (GATEWAY ASAAS) ====================

export interface PaymentsConfigDTO {
  /** ASAAS = gateway real (sandbox/produção); SIMULADO = modo demonstração */
  gateway: 'ASAAS' | 'SIMULADO'
  env: 'sandbox' | 'production' | null
}

export interface PendingPaymentDTO {
  id: string
  gatewayPaymentId?: string | null
  billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO' | string
  status: string
  value: number
  invoiceUrl?: string | null
  env?: 'sandbox' | 'production' | null
  pix?: { payload: string; encodedImage: string } | null
}

export interface PaymentStatusDTO {
  status: string
  orderStatus: string
  billingType: string
  invoiceUrl?: string | null
}

// ==================== PAINEL ADMIN ====================

export interface AdminStatsDTO {
  totals: {
    users: number
    mentors: number
    courses: number
    tracks: number
    libraryItems: number
    admins: number
    bookingsPending: number
    paymentsPending: number
  }
  revenue: {
    totalCents: number
    ordersCount: number
    last30dCents: number
    last30dOrders: number
  }
  asaas: {
    configured: boolean
    env: 'sandbox' | 'production'
    webhookConfigured: boolean
  }
  recentPayments: Array<{
    id: string
    gateway: string
    status: string
    value: number
    billingType: string
    createdAt: string
    userName: string
    itemTitle: string
  }>
}

export interface AdminUserDTO {
  id: string
  name: string
  email: string
  role: string
  blocked: boolean
  mfaEnabled: boolean
  isMentor: boolean
  creditCents: number
  enrollments: number
  orders: number
  createdAt: string
}

export interface AdminUsersResponseDTO {
  users: AdminUserDTO[]
  total: number
  page: number
  pages: number
}

export interface AsaasSettingsDTO {
  configured: boolean
  env: 'sandbox' | 'production'
  maskedKey: string
  webhookConfigured: boolean
}

// ==================== CUPONS DE PLATAFORMA + BARRA PROMOCIONAL ====================

export interface PlatformCouponDTO {
  id: string
  code: string
  percentOff: number | null
  amountOff: number | null
  scope: 'SITE_WIDE' | 'NEW_ACCOUNTS' | 'CATEGORY' | 'MENTOR'
  category: string | null
  mentorId: string | null
  mentorName: string | null
  maxUses: number | null
  uses: number
  expiresAt: string | null
  isActive: boolean
  showInPromoBar: boolean
  promoMessage: string | null
  createdAt: string
}

export interface AdminCouponsResponseDTO {
  coupons: PlatformCouponDTO[]
  mentors: { id: string; name: string }[]
}

export interface PromoBarItemDTO {
  id: string
  code: string
  message: string
  discountLabel: string
  scopeLabel: string
}

export interface AdminPaymentDTO {
  id: string
  gateway: string
  gatewayPaymentId?: string | null
  billingType: string
  status: string
  orderStatus: string
  value: number
  invoiceUrl?: string | null
  lastEvent?: string | null
  createdAt: string
  confirmedAt?: string | null
  userName: string
  userEmail: string
  itemTitle: string
  orderId: string
}

export interface AdminPaymentsResponseDTO {
  payments: AdminPaymentDTO[]
  total: number
  page: number
  pages: number
}

export interface AuditLogDTO {
  id: string
  actorName: string
  action: string
  meta: string
  createdAt: string
}
