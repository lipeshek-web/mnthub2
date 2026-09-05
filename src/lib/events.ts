import { db } from '@/lib/db'
import { nowNaive, parseNaive } from '@/lib/helpers'

/**
 * Eventos & Reuniões — serialização e regras compartilhadas entre a API web
 * (/api/events*) e a API do app (/api/v1/events*).
 *
 * Convenção de horário: naive local "YYYY-MM-DDTHH:mm" (igual a Booking) —
 * a data/hora exibida é a data/hora salva, sem conversão de fuso.
 *
 * Ciclo de vida da sala:
 *  - "live"  = agora dentro de [startsAt, startsAt + duração + 5min de graça]
 *  - "soon"  = falta menos de 15min para começar (sala pode abrir p/ teste)
 *  - entrar na sala exige ser PARTICIPANTE (o join reserva o assento)
 */

export const EVENT_GRACE_MIN = 5
export const EVENT_OPEN_MIN = 15
export const MIN_CAPACITY = 2
export const MAX_CAPACITY = 12

export type EventWithParticipants = NonNullable<Awaited<ReturnType<typeof loadEvent>>>

export async function loadEvent(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, avatarUrl: true } },
      participants: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
}

export function eventWindowState(startsAt: string, durationMin: number) {
  const now = nowNaive()
  const start = startsAt
  const end = addMinutesNaive(startsAt, durationMin + EVENT_GRACE_MIN)
  const openFrom = addMinutesNaive(startsAt, -EVENT_OPEN_MIN)
  return {
    live: now >= start && now <= end,
    soon: now >= openFrom && now < start,
    openable: now >= openFrom && now <= end, // pode entrar na sala
    ended: now > end,
  }
}

export function addMinutesNaive(iso: string, minutes: number): string {
  const d = parseNaive(iso)
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Payload canônico de um evento para web e app */
export function serializeEvent(
  ev: NonNullable<EventWithParticipants>,
  currentUserId?: string | null
) {
  const win = eventWindowState(ev.startsAt, ev.durationMin)
  const hostSeat = ev.participants.find((p) => p.role === 'HOST')
  const guests = ev.participants.filter((p) => p.role !== 'HOST')
  void guests
  const me = currentUserId ? ev.participants.find((p) => p.userId === currentUserId) : undefined
  return {
    id: ev.id,
    title: ev.title,
    description: ev.description,
    coverUrl: ev.coverUrl,
    category: ev.category,
    startsAt: ev.startsAt,
    durationMin: ev.durationMin,
    capacity: ev.capacity,
    status: ev.status,
    live: ev.status !== 'CANCELLED' && win.live,
    openable: ev.status !== 'CANCELLED' && win.openable,
    ended: win.ended,
    cancelled: ev.status === 'CANCELLED',
    host: {
      id: ev.hostId,
      name: ev.host.name,
      avatarUrl: ev.host.avatarUrl,
    },
    participants: ev.participants.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl,
      role: p.role,
    })),
    joinedCount: ev.participants.length,
    seatsLeft: Math.max(ev.capacity - ev.participants.length, 0),
    isHost: currentUserId != null && (hostSeat?.userId === currentUserId || ev.hostId === currentUserId),
    isParticipant: Boolean(me),
    myRole: me ? (me.role as 'HOST' | 'GUEST') : null,
  }
}

export type SerializedEvent = ReturnType<typeof serializeEvent>

/** Lista base para GET (ordena por início; "ao vivo" primeiro) */
export function sortEvents(items: EventWithParticipants[]): EventWithParticipants[] {
  const now = nowNaive()
  return [...items].sort((a, b) => {
    const wa = eventWindowState(a.startsAt, a.durationMin)
    const wb = eventWindowState(b.startsAt, b.durationMin)
    const liveA = a.status !== 'CANCELLED' && wa.live ? 0 : 1
    const liveB = b.status !== 'CANCELLED' && wb.live ? 0 : 1
    if (liveA !== liveB) return liveA - liveB
    if (liveA === 0) return a.startsAt.localeCompare(b.startsAt)
    // futuros primeiro (crescente), passados depois (decrescente)
    const futA = a.startsAt >= now ? 0 : 1
    const futB = b.startsAt >= now ? 0 : 1
    if (futA !== futB) return futA - futB
    if (futA === 0) return a.startsAt.localeCompare(b.startsAt)
    return b.startsAt.localeCompare(a.startsAt)
  })
}

/** Validação do payload de criação (compartilhada web/app) */
export function validateEventInput(input: {
  title?: unknown
  description?: unknown
  category?: unknown
  coverUrl?: unknown
  startsAt?: unknown
  durationMin?: unknown
  capacity?: unknown
}): { title: string; description: string; category: string; coverUrl: string | null; startsAt: string; durationMin: number; capacity: number } | { error: string } {
  const title = String(input.title ?? '').trim()
  if (title.length < 3 || title.length > 120) {
    return { error: 'Informe um título entre 3 e 120 caracteres.' }
  }
  const description = String(input.description ?? '').trim().slice(0, 2000)
  const category = String(input.category ?? 'Geral').trim().slice(0, 40) || 'Geral'
  const rawCover = String(input.coverUrl ?? '').trim()
  const coverUrl = rawCover ? rawCover.slice(0, 500) : null
  const startsAt = String(input.startsAt ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(startsAt)) {
    return { error: 'Informe data e hora no formato válido.' }
  }
  const durationMin = Math.min(Math.max(Number(input.durationMin ?? 60) || 60, 15), 240)
  const capacity = Math.min(Math.max(Number(input.capacity ?? 8) || 8, MIN_CAPACITY), MAX_CAPACITY)
  return { title, description, category, coverUrl, startsAt, durationMin, capacity }
}
