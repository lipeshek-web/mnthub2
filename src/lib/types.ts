// Tipos compartilhados entre frontend e API da plataforma MentorHub

export interface UserDTO {
  id: string
  name: string
  email: string
  bio?: string | null
  avatarUrl?: string | null
  /** true quando o usuário possui perfil de mentor cadastrado */
  isMentor?: boolean
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
  itemKind: 'COURSE' | 'TRACK' | string
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
