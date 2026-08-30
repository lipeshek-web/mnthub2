import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { addDays, dateKey } from '@/lib/helpers'
import type { WeeklyGoalDTO } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * #9 Meta semanal de estudos.
 *
 * GET /api/goals/weekly?userId=X → WeeklyGoalDTO
 * PUT /api/goals/weekly          → body { userId, targetLessons } (1..35) → WeeklyGoalDTO
 *
 * O progresso é calculado no servidor: nº de XpEvent kind=LESSON a partir da
 * segunda-feira 00:00 da semana atual (horário local do servidor) — 1 evento
 * por aula concluída, ledger anti-farm (ver src/lib/xp.ts).
 * Ao bater a meta, cria 1 notificação 'goal_achieved' por semana (refId = weekStart).
 */

/** O union de kinds de notify() é fechado; 'goal_achieved' é novo e o banco aceita
 * qualquer string (Notification.kind: String). Cast controlado — lib/notify intocado. */
type NotifyKindArg = Parameters<typeof notify>[0]['kind']
const GOAL_ACHIEVED: string = 'goal_achieved'

/** Segunda-feira 00:00 da semana da data informada (horário local do servidor). */
function startOfWeek(base: Date): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // seg = 0 dia atrás ... dom = 6
  return d
}

/** Monta o WeeklyGoalDTO completo — compartilhado entre GET e PUT (DRY). */
async function weeklyGoalDto(userId: string): Promise<WeeklyGoalDTO> {
  const monday = startOfWeek(new Date())
  const weekStart = dateKey(monday) // "YYYY-MM-DD" local

  // Histórico de 4 semanas: 3 semanas passadas + semana atual (mais antiga primeiro)
  const history: number[] = []
  for (let i = 3; i >= 0; i--) {
    const from = addDays(monday, -7 * i)
    const to = addDays(monday, 7 - 7 * i) // limite exclusivo (início da semana seguinte)
    const count = await db.xpEvent.count({
      where: { userId, kind: 'LESSON', createdAt: { gte: from, lt: to } },
    })
    history.push(count)
  }
  const completedLessons = history[history.length - 1]

  // Meta do usuário; ausente → padrão de 3 aulas (isCustom false)
  const goal = await db.weeklyGoal.findUnique({ where: { userId } })
  const targetLessons = goal?.targetLessons ?? 3
  const goalAchieved = completedLessons >= targetLessons

  // Notificação idempotente: no máximo 1 por semana (refId = weekStart)
  if (goalAchieved) {
    const already = await db.notification.findFirst({
      where: { userId, kind: GOAL_ACHIEVED, refId: weekStart },
    })
    if (!already) {
      await notify({
        userId,
        kind: GOAL_ACHIEVED as NotifyKindArg,
        title: 'Meta semanal batida! 🎉',
        body: `Você concluiu ${completedLessons} aulas nesta semana. Parabéns!`,
        linkView: 'dashboard',
        refId: weekStart,
      })
    }
  }

  return {
    targetLessons,
    completedLessons,
    goalAchieved,
    weekStart,
    history,
    isCustom: Boolean(goal),
  }
}

/** GET /api/goals/weekly?userId=X */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')?.trim() ?? ''
  if (!userId) {
    return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })
  }
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }
  try {
    return NextResponse.json(await weeklyGoalDto(userId))
  } catch (err) {
    console.error('GET /api/goals/weekly', err)
    return NextResponse.json({ error: 'Erro ao carregar a meta semanal.' }, { status: 500 })
  }
}

/** PUT /api/goals/weekly — body { userId, targetLessons } */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const userId = String(body?.userId ?? '').trim()
  if (!userId) {
    return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })
  }
  const target = Number(body?.targetLessons)
  if (!Number.isInteger(target) || target < 1 || target > 35) {
    return NextResponse.json(
      { error: 'A meta deve ser um número inteiro entre 1 e 35 aulas.' },
      { status: 400 }
    )
  }
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
    }
    await db.weeklyGoal.upsert({
      where: { userId },
      update: { targetLessons: target },
      create: { userId, targetLessons: target },
    })
    return NextResponse.json(await weeklyGoalDto(userId))
  } catch (err) {
    console.error('PUT /api/goals/weekly', err)
    return NextResponse.json({ error: 'Erro ao salvar a meta semanal.' }, { status: 500 })
  }
}
