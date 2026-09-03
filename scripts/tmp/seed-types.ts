// Tipos compartilhados do seed de conteúdo (cursos + biblioteca)
export type QuizDef = { prompt: string; options: string[]; correctIndex: number; explanation: string }
export type LessonDef = {
  title: string
  description: string
  durationMin: number
  content: string
  quiz?: QuizDef[]
}
export type ThemeDef = { title: string; description: string; lessons: LessonDef[] }
export type CourseDef = {
  mentorEmail: string
  title: string
  description: string
  category: string
  level: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO'
  price: number
  coverUrl: string
  mentorshipCount?: number
  themes: ThemeDef[]
}
