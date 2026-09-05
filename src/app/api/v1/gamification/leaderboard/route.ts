import type { NextRequest } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { getWeeklyLeaderboard } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

/** GET /api/v1/gamification/leaderboard — ranking de XP da semana (JWT do app). */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const board = await getWeeklyLeaderboard(user.id)
    return v1Json(board)
  } catch (err) {
    console.error('GET /api/v1/gamification/leaderboard', err)
    return v1Error('Erro ao carregar o ranking.', 500)
  }
}
