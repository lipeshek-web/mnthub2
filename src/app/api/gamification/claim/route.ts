import { NextRequest, NextResponse } from 'next/server'
import { resolveUser, unauthorized } from '@/lib/session'
import { MissionError, claimMission } from '@/lib/gamification'

export const dynamic = 'force-dynamic'

/**
 * POST /api/gamification/claim — coleta a recompensa de uma missão de HOJE.
 * Body: { missionId }. O progresso é revalidado no servidor (o cliente não
 * manda XP); a coleta é idempotente via ledger XpEvent (unique por dia/missão).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente.')

    const body = (await req.json().catch(() => null)) as { missionId?: string } | null
    const missionId = body?.missionId?.trim()
    if (!missionId) return NextResponse.json({ error: 'Missão não informada.' }, { status: 400 })

    const result = await claimMission(session.id, missionId)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof MissionError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('POST /api/gamification/claim', err)
    return NextResponse.json({ error: 'Erro ao coletar a missão.' }, { status: 500 })
  }
}
