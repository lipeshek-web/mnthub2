import type { NextRequest } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { getActivityHeatmap, getDailyMissions } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

/** GET /api/v1/gamification/daily — missões de hoje + heatmap (JWT do app). */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const [daily, heatmap] = await Promise.all([
      getDailyMissions(user.id),
      getActivityHeatmap(user.id),
    ])

    return v1Json({ ...daily, heatmap })
  } catch (err) {
    console.error('GET /api/v1/gamification/daily', err)
    return v1Error('Erro ao carregar missões.', 500)
  }
}
