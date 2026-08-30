import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser, publicMobileUser } from '@/lib/mobile-auth'
import { absolutize, getOrigin, v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/** GET /api/v1/auth/me — dados da sessão atual (Bearer) */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const unreadNotifications = await db.notification.count({
      where: { userId: user.id, readAt: null },
    })

    return v1Json({
      user: {
        ...publicMobileUser(user),
        avatarUrl: absolutize(user.avatarUrl, getOrigin(req)),
        creditCents: user.creditCents,
        unreadNotifications,
      },
    })
  } catch (err) {
    console.error('GET /api/v1/auth/me', err)
    return v1Error('Erro ao carregar perfil.', 500)
  }
}
