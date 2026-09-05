import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireMobileUser } from '@/lib/mobile-auth'
import { v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/notifications — notificações do aluno (30 mais recentes por
 * padrão). `?page=&pageSize=` pagina o histórico (pageSize máx. 50) — a
 * resposta ganha total/hasMore, campos que o app atual simplesmente ignora.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const sp = req.nextUrl.searchParams
    const page = Math.max(1, Math.trunc(Number(sp.get('page')) || 1))
    const pageSize = Math.min(50, Math.max(1, Math.trunc(Number(sp.get('pageSize')) || 30)))

    const [items, unread, total] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.notification.count({ where: { userId: user.id, readAt: null } }),
      db.notification.count({ where: { userId: user.id } }),
    ])

    return v1Json({
      items: items.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unread,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    })
  } catch (err) {
    console.error('GET /api/v1/notifications', err)
    return v1Error('Erro ao carregar notificações.', 500)
  }
}

/** POST /api/v1/notifications — { action: "read-all" } marca tudo como lido */
export async function POST(req: NextRequest) {
  try {
    const user = await requireMobileUser(req)
    if (!user) return v1Error('Sessão inválida ou expirada.', 401)

    const body = await req.json().catch(() => null)
    if (String(body?.action ?? '') !== 'read-all') {
      return v1Error('Ação inválida.', 400)
    }

    await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    return v1Json({ ok: true })
  } catch (err) {
    console.error('POST /api/v1/notifications', err)
    return v1Error('Erro ao atualizar notificações.', 500)
  }
}
