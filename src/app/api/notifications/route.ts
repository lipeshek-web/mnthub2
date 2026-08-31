import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications — lista as notificações do usuário autenticado
 * (mais recentes primeiro) + contagem de não lidas.
 * Identidade vem da SESSÃO (header Authorization) — nunca mais do userId na
 * query, que permitia ler as notificações de qualquer pessoa.
 */
export async function GET(req: NextRequest) {
  const user = await resolveUser(req)
  if (!user) return unauthorized()

  try {
    const [items, unread] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
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
 * POST /api/notifications — marca notificações do usuário autenticado como lidas.
 * body: { ids?: string[] } — sem ids, marca TODAS as não lidas.
 */
export async function POST(req: NextRequest) {
  const user = await resolveUser(req)
  if (!user) return unauthorized()

  try {
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean).slice(0, 50) : null
    await db.notification.updateMany({
      where: { userId: user.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/notifications', err)
    return NextResponse.json({ error: 'Erro ao atualizar notificações' }, { status: 500 })
  }
}
