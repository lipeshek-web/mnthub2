import type { NextRequest } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-auth'
import { CACHE_NO_STORE, getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import { buildDashboardPayload } from '@/lib/api-v1-home'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/dashboard — agregação da home do aluno no app (formato histórico,
 * mantido por compatibilidade). Para um bootstrap em UMA chamada (usuário +
 * badges + este payload), use GET /api/v1/home.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const origin = getOrigin(req)
    const payload = await buildDashboardPayload(user.id, origin)

    return v1Json(
      {
        user: {
          xp: user.xp,
          studyStreak: user.activeStreak,
          longestStreak: user.longestStreak,
        },
        ...payload,
      },
      200,
      { 'Cache-Control': CACHE_NO_STORE }
    )
  } catch (err) {
    console.error('GET /api/v1/dashboard', err)
    return v1Error('Erro ao carregar o painel.', 500)
  }
}
