import type { Prisma } from '@prisma/client'
import type { MembershipDTO } from './types'

/** Include padrão de membership (mentor + contagem de assinantes ativos) */
export function membershipBaseInclude() {
  return {
    mentor: {
      select: {
        id: true,
        userId: true,
        headline: true,
        user: { select: { name: true, avatarUrl: true } },
      },
    },
    _count: { select: { subscriptions: { where: { status: 'ACTIVE' } } } },
  } satisfies Prisma.MentorMembershipInclude
}

export type MembershipWithRelations = Prisma.MentorMembershipGetPayload<{
  include: ReturnType<typeof membershipBaseInclude>
}>

export const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const

/** Próxima ocorrência da sessão em grupo como naive "YYYY-MM-DDTHH:mm" (sempre no futuro) */
export function nextGroupSessionNaive(day: number, time: string): string {
  const now = new Date()
  const parts = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  const hh = parts ? Number(parts[1]) : 19
  const mm = parts ? Number(parts[2]) : 0
  const pad = (n: number) => String(n).padStart(2, '0')
  for (let add = 0; add < 8; add++) {
    const d = new Date(now.getTime() + add * 24 * 60 * 60 * 1000)
    if (d.getDay() !== ((day % 7) + 7) % 7) continue
    d.setHours(hh, mm, 0, 0)
    if (d.getTime() > now.getTime()) {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
  }
  // Nunca deve chegar aqui (sempre há uma ocorrência em ≤7 dias)
  const fallback = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())}T${pad(hh)}:${pad(mm)}`
}

/** Rótulo curto da sessão em grupo, ex: "Quinta às 19:00" */
export function groupSessionLabel(day: number, time: string): string {
  const label = WEEKDAY_LABELS[((day % 7) + 7) % 7] ?? 'Quinta'
  return `${label} às ${time}`
}

/** Opções de exibição calculadas pela rota (contagens e estado do usuário) */
export interface SerializeMembershipOpts {
  coursesCount?: number
  subscriberCount?: number
  myStatus?: MembershipDTO['myStatus']
  renewsAt?: string | null
}

export function serializeMembership(
  membership: MembershipWithRelations,
  opts: SerializeMembershipOpts = {}
): MembershipDTO {
  return {
    id: membership.id,
    title: membership.title,
    description: membership.description,
    price: membership.price,
    groupSessionDay: membership.groupSessionDay,
    groupSessionTime: membership.groupSessionTime,
    isPublished: membership.isPublished,
    createdAt: membership.createdAt.toISOString(),
    mentor: {
      id: membership.mentor.id,
      userId: membership.mentor.userId,
      name: membership.mentor.user.name,
      headline: membership.mentor.headline,
      avatarUrl: membership.mentor.user.avatarUrl,
    },
    coursesCount: opts.coursesCount ?? 0,
    subscriberCount: opts.subscriberCount,
    myStatus: opts.myStatus ?? null,
    renewsAt: opts.renewsAt ?? null,
  }
}
