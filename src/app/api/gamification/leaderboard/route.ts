import { NextRequest, NextResponse } from 'next/server'
import { resolveUser } from '@/lib/session'
import { getWeeklyLeaderboard } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gamification/leaderboard — ranking de XP da semana corrente
 * (desde a segunda 00:00 no fuso da plataforma). Com sessão, devolve também a
 * posição do usuário (`me`); sem sessão, apenas o top.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await resolveUser(req)
    const viewerId = session?.id ?? null
    const board = await getWeeklyLeaderboard(viewerId)
    return NextResponse.json(board)
  } catch (err) {
    console.error('GET /api/gamification/leaderboard', err)
    return NextResponse.json({ error: 'Erro ao carregar o ranking.' }, { status: 500 })
  }
}
