import { NextRequest, NextResponse } from 'next/server'
import { resolveUser, unauthorized } from '@/lib/session'
import { getActivityHeatmap, getDailyMissions } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gamification/daily — missões de hoje (progresso + coletadas) e o
 * heatmap de consistência do usuário da SESSÃO. Falhar aqui nunca pode derrubar
 * o dashboard: erros viram 500 com mensagem amigável.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')

    const [daily, heatmap] = await Promise.all([
      getDailyMissions(session.id),
      getActivityHeatmap(session.id),
    ])

    return NextResponse.json({ ...daily, heatmap })
  } catch (err) {
    console.error('GET /api/gamification/daily', err)
    return NextResponse.json({ error: 'Erro ao carregar missões.' }, { status: 500 })
  }
}
