import type { NextRequest } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'
import { MissionError, claimMission } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/v1/gamification/claim — coleta a recompensa de uma missão de HOJE
 * (JWT do app). Body: { missionId }. Progresso revalidado no servidor;
 * idempotente via ledger XpEvent.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const body = (await req.json().catch(() => null)) as { missionId?: string } | null
    const missionId = body?.missionId?.trim()
    if (!missionId) return v1Error('Missão não informada.', 400)

    const result = await claimMission(user.id, missionId)
    return v1Json(result)
  } catch (err) {
    if (err instanceof MissionError) {
      return v1Error(err.message, err.status)
    }
    console.error('POST /api/v1/gamification/claim', err)
    return v1Error('Erro ao coletar a missão.', 500)
  }
}
