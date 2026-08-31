import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/** GET /api/admin/audit — trilha de auditoria (mais recentes primeiro) */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1)
    const take = 30

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      db.auditLog.count(),
    ])

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        actorName: l.actorName,
        action: l.action,
        meta: l.meta,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / take)),
    })
  } catch (err) {
    console.error('GET /api/admin/audit', err)
    return NextResponse.json({ error: 'Erro ao carregar a auditoria.' }, { status: 500 })
  }
}
