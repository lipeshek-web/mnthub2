// Gamificação v2: missões diárias, ranking semanal e heatmap de consistência.
//
// Tudo é COMPUTADO de dados que já existem (XpEvent, EventParticipant,
// DirectMessage, LessonNote) — zero migração de schema. A coleta de missão é
// registrada no próprio ledger XpEvent (kind 'MISSION', refId "<dia>:<missão>"),
// que tem unique [userId, kind, refId]: idempotente por dia — não dá para
// farmar XP coletando a mesma missão duas vezes.
//
// Fuso da plataforma: America/Bahia (UTC-3 fixo, sem horário de verão) —
// mesma convenção de studyDay() em src/lib/xp.ts.
import { db } from '@/lib/db'
import { activeStreak, awardXp, studyDay } from '@/lib/xp'
import { levelFromXp } from '@/lib/helpers'

const TZ_OFFSET = '-03:00'

/** Início (Date) do dia "YYYY-MM-DD" no fuso da plataforma. */
function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00${TZ_OFFSET}`)
}

/** Dia da semana (0=Dom..6=Sáb) de um "YYYY-MM-DD". */
function weekdayOf(day: string): number {
  return new Date(`${day}T12:00:00${TZ_OFFSET}`).getDay()
}

/** Segunda-feira da semana de "YYYY-MM-DD" (a semana começa na segunda). */
function mondayOf(day: string): string {
  const offset = (weekdayOf(day) + 6) % 7 // Seg=0 .. Dom=6
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - offset)
  return d.toISOString().slice(0, 10)
}

// ------------------------------ Missões diárias -----------------------------

export interface MissionDef {
  id: string
  title: string
  description: string
  target: number
  xp: number
}

/** Missões fixas — todo dia, mesmo lugar (hábito). */
const FIXED_MISSIONS: MissionDef[] = [
  { id: 'aula', title: 'Aquecimento', description: 'Conclua 1 aula hoje', target: 1, xp: 15 },
  { id: 'quiz', title: 'Teste rápido', description: 'Acerte um quiz hoje', target: 1, xp: 10 },
]

/** Missão rotativa — muda conforme o dia da semana (variedade sem surpresa). */
const ROTATION: MissionDef[] = [
  { id: 'evento', title: 'Presença viva', description: 'Participe de uma reunião ou evento hoje', target: 1, xp: 20 },
  { id: 'mensagem', title: 'Voz ativa', description: 'Envie uma mensagem para um mentor ou colega', target: 1, xp: 15 },
  { id: 'anotacao', title: 'Registro esperto', description: 'Crie ou atualize uma anotação de aula', target: 1, xp: 15 },
]

export function missionsForDay(day: string): MissionDef[] {
  const rotating = ROTATION[weekdayOf(day) % ROTATION.length]
  return [...FIXED_MISSIONS, rotating]
}

export interface MissionDTO extends MissionDef {
  progress: number
  claimed: boolean
  claimable: boolean
}

async function missionProgress(userId: string, missionId: string, since: Date): Promise<number> {
  switch (missionId) {
    case 'aula':
      return db.xpEvent.count({ where: { userId, kind: 'LESSON', createdAt: { gte: since } } })
    case 'quiz':
      return db.xpEvent.count({ where: { userId, kind: 'QUIZ', createdAt: { gte: since } } })
    case 'evento':
      return db.eventParticipant.count({ where: { userId, createdAt: { gte: since } } })
    case 'mensagem':
      return db.directMessage.count({ where: { senderId: userId, createdAt: { gte: since } } })
    case 'anotacao':
      return db.lessonNote.count({ where: { userId, updatedAt: { gte: since } } })
    default:
      return 0
  }
}

export async function getDailyMissions(userId: string): Promise<{
  day: string
  streak: number
  missions: MissionDTO[]
}> {
  const day = studyDay()
  const since = dayStart(day)
  const defs = missionsForDay(day)

  const [user, claims] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { studyStreak: true, lastStudyDate: true },
    }),
    db.xpEvent.findMany({
      where: { userId, kind: 'MISSION', refId: { startsWith: `${day}:` } },
      select: { refId: true },
    }),
  ])
  const claimed = new Set(claims.map((c) => c.refId.slice(day.length + 1)))

  const missions = await Promise.all(
    defs.map(async (def) => {
      const progress = await missionProgress(userId, def.id, since)
      const isClaimed = claimed.has(def.id)
      return {
        ...def,
        progress: Math.min(progress, def.target),
        claimed: isClaimed,
        claimable: !isClaimed && progress >= def.target,
      }
    })
  )

  return {
    day,
    streak: activeStreak(user?.studyStreak ?? 0, user?.lastStudyDate ?? null),
    missions,
  }
}

export class MissionError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

/** Coleta a recompensa de uma missão de HOJE (idempotente via ledger). */
export async function claimMission(
  userId: string,
  missionId: string
): Promise<{ awarded: number; day: string; xpTotal: number; streak: number }> {
  const day = studyDay()
  const def = missionsForDay(day).find((m) => m.id === missionId)
  if (!def) throw new MissionError('Missão desconhecida.', 404)

  const already = await db.xpEvent.findUnique({
    where: { userId_kind_refId: { userId, kind: 'MISSION', refId: `${day}:${missionId}` } },
    select: { id: true },
  })
  if (already) throw new MissionError('Você já coletou essa missão hoje. Volte amanhã!', 409)

  const progress = await missionProgress(userId, missionId, dayStart(day))
  if (progress < def.target) throw new MissionError('Complete a missão antes de coletar o XP.', 409)

  await awardXp(userId, 'MISSION', `${day}:${missionId}`, def.xp)

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, studyStreak: true, lastStudyDate: true },
  })
  return {
    awarded: def.xp,
    day,
    xpTotal: user?.xp ?? 0,
    streak: activeStreak(user?.studyStreak ?? 0, user?.lastStudyDate ?? null),
  }
}

// ------------------------------ Ranking semanal -----------------------------

export interface LeaderboardEntryDTO {
  userId: string
  name: string
  avatarUrl: string | null
  weekXp: number
  levelLabel: string
}

export interface WeeklyLeaderboard {
  weekStart: string
  items: LeaderboardEntryDTO[]
  totalActive: number
  me: { rank: number; weekXp: number } | null
}

/**
 * Ranking por XP ganho NA semana corrente (desde a segunda 00:00 no fuso da
 * plataforma). `me.rank` = posição real no ranking completo (0 = ainda sem XP
 * esta semana). A lista retorna o top 20; a posição do usuário vale para o
 * ranking inteiro.
 */
export async function getWeeklyLeaderboard(viewerId: string | null): Promise<WeeklyLeaderboard> {
  const today = studyDay()
  const monday = mondayOf(today)
  const since = dayStart(monday)

  const events = await db.xpEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { userId: true, amount: true },
  })

  const sums = new Map<string, number>()
  for (const ev of events) sums.set(ev.userId, (sums.get(ev.userId) ?? 0) + ev.amount)
  const ranked = [...sums.entries()].sort((a, b) => b[1] - a[1])

  const top = ranked.slice(0, 20)
  const users = await db.user.findMany({
    where: { id: { in: top.map(([id]) => id) } },
    select: { id: true, name: true, avatarUrl: true, xp: true },
  })
  const byId = new Map(users.map((u) => [u.id, u]))

  const items: LeaderboardEntryDTO[] = top.map(([id, weekXp]) => {
    const u = byId.get(id)
    return {
      userId: id,
      name: u?.name ?? 'Membro',
      avatarUrl: u?.avatarUrl ?? null,
      weekXp,
      levelLabel: levelFromXp(u?.xp ?? 0).level.label,
    }
  })

  let me: WeeklyLeaderboard['me'] = null
  if (viewerId) {
    const rank = ranked.findIndex(([id]) => id === viewerId)
    const weekXp = sums.get(viewerId) ?? 0
    me = rank >= 0 ? { rank: rank + 1, weekXp } : { rank: 0, weekXp: 0 }
  }

  return { weekStart: monday, items, totalActive: sums.size, me }
}

// --------------------------- Heatmap de consistência ------------------------

export interface ActivityHeatmap {
  start: string
  days: { date: string; xp: number }[]
  activeDays: number
}

/** XP por dia nos últimos `days` dias (padrão ~13 semanas) — dias sem estudo ficam de fora (esparso). */
export async function getActivityHeatmap(userId: string, days = 91): Promise<ActivityHeatmap> {
  const since = new Date(Date.now() - days * 86_400_000)
  const events = await db.xpEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { amount: true, createdAt: true },
  })

  const byDay = new Map<string, number>()
  for (const ev of events) {
    const day = studyDay(ev.createdAt)
    byDay.set(day, (byDay.get(day) ?? 0) + ev.amount)
  }

  const list = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, xp]) => ({ date, xp }))

  return { start: studyDay(since), days: list, activeDays: byDay.size }
}
