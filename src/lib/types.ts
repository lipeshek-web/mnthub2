// Tipos compartilhados entre frontend e API da plataforma MentorHub

export interface UserDTO {
  id: string
  name: string
  email: string
  bio?: string | null
  avatarUrl?: string | null
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
  videoUrl: string | null
  content: string | null
  durationMin: number
  order: number
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
  studentCount: number
  coverUrl?: string | null
  createdAt: string
}

export interface CourseDetailDTO extends CourseListItemDTO {
  updatedAt: string
  lessons: CourseLessonDTO[]
  /** Preenchido quando userId é informado e o usuário está inscrito */
  enrollment: { completedLessonIds: string[] } | null
}

export interface EnrolledCourseDTO {
  courseId: string
  enrolledAt: string
  completedLessonIds: string[]
  course: CourseListItemDTO
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
  courseId: string
  courseTitle: string
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
