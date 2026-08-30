import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications?userId= — lista as notificações do usuário (mais recentes primeiro)
 * + contagem de não lidas.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const [items, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.notification.count({ where: { userId, readAt: null } }),
    ])

    return NextResponse.json({
      unreadCount: unread,
      items: items.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        linkView: n.linkView,
        refId: n.refId,
        read: Boolean(n.readAt),
        createdAt: n.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/notifications', err)
    return NextResponse.json({ error: 'Erro ao listar notificações' }, { status: 500 })
  }
}

/**
 * POST /api/notifications — marca notificações como lidas.
 * body: { userId, ids?: string[] } — sem ids, marca TODAS as não lidas.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : null
    await db.notification.updateMany({
      where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/notifications', err)
    return NextResponse.json({ error: 'Erro ao atualizar notificações' }, { status: 500 })
  }
}
