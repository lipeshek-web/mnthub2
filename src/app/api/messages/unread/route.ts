import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/messages/unread?userId= — contagem total de mensagens não lidas
 * (usada no badge do ícone de mensagens do header; polling leve).
 */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const count = await db.directMessage.count({ where: { recipientId: userId, readAt: null } })
    return NextResponse.json({ count })
  } catch (err) {
    console.error('GET /api/messages/unread', err)
    return NextResponse.json({ error: 'Erro ao contar mensagens' }, { status: 500 })
  }
}
