// Utilitários de domínio: datas naive (sem timezone), formatação pt-BR, avatares, metadados

export const CATEGORIES = [
  'Tecnologia',
  'Design',
  'Carreira',
  'Marketing',
  'Negócios',
  'Finanças',
  'Idiomas',
  'Saúde & Bem-estar',
] as const

export const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEKDAYS_FULL_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]
export const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** "YYYY-MM-DDTHH:mm" -> Date local (sem surpresas de timezone) */
export function parseNaive(iso: string): Date {
  const [datePart, timePart = '00:00'] = iso.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

export function toNaive(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function nowNaive(): string {
  return toNaive(new Date())
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/** "2025-06-01" com hora zerada */
export function dateKey(d: Date): string {
  return toNaive(d).slice(0, 10)
}

/** "2025-06-01T14:00" -> "sáb, 1 jun" */
export function formatDayLabel(iso: string): string {
  const d = parseNaive(iso)
  return `${WEEKDAYS_PT[d.getDay()].toLowerCase()}, ${d.getDate()} ${MONTHS_PT[d.getMonth()]}`
}

/** "2025-06-01T14:00" -> "sábado, 1 de junho" */
export function formatDayLabelLong(iso: string): string {
  const d = parseNaive(iso)
  const monthFull = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][d.getMonth()]
  return `${WEEKDAYS_FULL_PT[d.getDay()].toLowerCase()}, ${d.getDate()} de ${monthFull}`
}

/** "2025-06-01T14:30" -> "14:30" */
export function formatTimeLabel(iso: string): string {
  return iso.split('T')[1]?.slice(0, 5) ?? ''
}

/** fim da sessão: "2025-06-01T14:00" + 60min -> "15:00" */
export function addMinutesToTime(iso: string, minutes: number): string {
  const d = parseNaive(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return formatTimeLabel(toNaive(d))
}

export function relativeDayLabel(iso: string): string | null {
  const today = dateKey(new Date())
  const tomorrow = dateKey(addDays(new Date(), 1))
  const yesterday = dateKey(addDays(new Date(), -1))
  const day = iso.slice(0, 10)
  if (day === today) return 'Hoje'
  if (day === tomorrow) return 'Amanhã'
  if (day === yesterday) return 'Ontem'
  return null
}

export function currencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
}

export function hourToLabel(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function labelToHour(label: string): number {
  const [h, m] = label.split(':').map(Number)
  return h + m / 60
}

// ---------- Status de agendamento ----------
export const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Aguardando confirmação', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  CONFIRMED: { label: 'Confirmada', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  COMPLETED: { label: 'Concluída', className: 'bg-stone-100 text-stone-700 border-stone-200' },
  CANCELLED: { label: 'Cancelada', className: 'bg-rose-100 text-rose-700 border-rose-200' },
}

// ---------- Conteúdos do mural ----------
export const CONTENT_TYPE_META: Record<string, { label: string; className: string }> = {
  ARTICLE: { label: 'Artigo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  VIDEO: { label: 'Vídeo', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  WORKSHOP: { label: 'Workshop', className: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  TRAIL: { label: 'Trilha', className: 'bg-teal-50 text-teal-700 border-teal-200' },
}

export const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: 'Iniciante',
  INTERMEDIARIO: 'Intermediário',
  AVANCADO: 'Avançado',
}

// ---------- Avatar com gradiente determinístico ----------
const AVATAR_GRADIENTS: [string, string][] = [
  ['#059669', '#34d399'],
  ['#0d9488', '#2dd4bf'],
  ['#d97706', '#fbbf24'],
  ['#dc2626', '#fb7185'],
  ['#db2777', '#f472b6'],
  ['#65a30d', '#a3e635'],
  ['#7c3aed', '#c4b5fd'],
  ['#ea580c', '#fdba74'],
  ['#0f766e', '#5eead4'],
  ['#b45309', '#fcd34d'],
]

export function avatarGradient(name: string): { backgroundImage: string } {
  const hash = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const [from, to] = AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
  return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}
