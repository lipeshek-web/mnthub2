import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/badges — contadores de sininhos do header em UMA chamada
 * (mensagens diretas não lidas + notificações não lidas).
 * Substitui o polling duplo (messages/unread a cada 45s + notifications a
 * cada 60s) por um único request leve e autenticado por sessão.
 * Identidade SEMPRE da sessão (corrige IDOR do userId na query).
 */
export async function GET(req: NextRequest) {
  const user = await resolveUser(req)
  if (!user) return unauthorized()

  try {
    const [messages, notifications] = await Promise.all([
      db.directMessage.count({ where: { recipientId: user.id, readAt: null } }),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
    ])
    return NextResponse.json({ messages, notifications })
  } catch (err) {
    console.error('GET /api/badges', err)
    return NextResponse.json({ error: 'Erro ao contar notificações' }, { status: 500 })
  }
}
