import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { publicMobileUser, requireMobileUser } from '@/lib/mobile-auth'
import { CACHE_NO_STORE, absolutize, getOrigin, v1Error, v1Json } from '@/lib/api-v1'
import { buildDashboardPayload } from '@/lib/api-v1-home'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/home — BOOTSTRAP do app em UMA chamada.
 *
 * Junta o que o app buscava em 3–4 requisições no arranque (auth/me +
 * dashboard + contadores): usuário completo, badges de notificações e
 * mensagens não lidas e a home completa (cursos em andamento, próximas
 * sessões, livros novos, recomendações e meta semanal).
 *
 * Menos round-trips = arranque mais rápido, principalmente em rede móvel.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)
    const origin = getOrigin(req)

    const [payload, unreadNotifications, unreadMessages] = await Promise.all([
      buildDashboardPayload(user.id, origin),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
      db.directMessage.count({ where: { recipientId: user.id, readAt: null } }),
    ])

    const publicUser = publicMobileUser(user)

    return v1Json(
      {
        user: {
          ...publicUser,
          avatarUrl: absolutize(publicUser.avatarUrl, origin),
          creditCents: user.creditCents,
          unreadNotifications,
        },
        unreadMessages,
        ...payload,
      },
      200,
      { 'Cache-Control': CACHE_NO_STORE }
    )
  } catch (err) {
    console.error('GET /api/v1/home', err)
    return v1Error('Erro ao carregar o início.', 500)
  }
}
