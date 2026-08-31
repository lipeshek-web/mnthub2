import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/unread — contagem total de mensagens não lidas do usuário
 * autenticado (badge do header; polling leve). Identidade da SESSÃO.
 */
export async function GET(req: NextRequest) {
  const session = await resolveUser(req)
  if (!session) return unauthorized()

  try {
    const count = await db.directMessage.count({
      where: { recipientId: session.id, readAt: null },
    })
    return NextResponse.json({ count })
  } catch (err) {
    console.error('GET /api/messages/unread', err)
    return NextResponse.json({ error: 'Erro ao contar mensagens' }, { status: 500 })
  }
}
