// Tipos compartilhados entre frontend e API da plataforma MentorHub

export interface UserDTO {
  id: string
  name: string
  email: string
  bio?: string | null
}

export interface SocialLinksDTO {
  instagram?: string | null
  linkedin?: string | null
  github?: string | null
  website?: string | null
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
  }
  lessonCount: number
  totalDurationMin: number
  studentCount: number
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
