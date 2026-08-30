import { db } from '@/lib/db'

/** XP concedido por atividade de aprendizado */
export const XP_LESSON = 10 // aula concluída
export const XP_QUIZ = 5 // quiz acertado (1ª vez)
export const XP_COURSE = 50 // curso 100% concluído

const TZ = 'America/Bahia'

/** Data de hoje no fuso da plataforma como "YYYY-MM-DD" (en-CA já devolve nesse formato) */
export function studyDay(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}

function studyDayOffset(days: number): string {
  return studyDay(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
}

/** Ofensiva "ativa": streak conta se estudou hoje ou ontem; senão zera na exibição */
export function activeStreak(studyStreak: number, lastStudyDate: string | null): number {
  if (!lastStudyDate || studyStreak <= 0) return 0
  const today = studyDay()
  if (lastStudyDate === today || lastStudyDate === studyDayOffset(-1)) return studyStreak
  return 0
}

/**
 * Concede XP a um usuário de forma anti-farm (ledger XpEvent: 1 evento por
 * usuário/tipo/referência) e atualiza a ofensiva de estudos.
 * Retorna o XP efetivamente concedido (0 se o evento já existia).
 */
export async function awardXp(
  userId: string,
  kind: 'LESSON' | 'QUIZ' | 'COURSE',
  refId: string,
  amount: number
): Promise<number> {
  try {
    await db.xpEvent.create({ data: { userId, kind, refId, amount } })
  } catch {
    // P2002 (unique userId+kind+refId) — XP já concedido antes
    return 0
  }

  const today = studyDay()
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastStudyDate: true, studyStreak: true, longestStreak: true },
  })

  let streak: number
  if (!user?.lastStudyDate || user.lastStudyDate < studyDayOffset(-1)) {
    streak = 1 // primeira atividade ou ofensiva quebrada
  } else if (user.lastStudyDate === today) {
    streak = Math.max(1, user.studyStreak) // mesmo dia: mantém
  } else {
    streak = user.studyStreak + 1 // dia seguinte ao último: soma
  }

  await db.user.update({
    where: { id: userId },
    data: {
      xp: { increment: amount },
      studyStreak: streak,
      longestStreak: Math.max(user?.longestStreak ?? 0, streak),
      lastStudyDate: today,
    },
  })

  return amount
}
