import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { SMTP_CONFIGURED } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/emails — fila de e-mails transacionais (outbox), últimos 50.
 * Read-only: diagnóstico da entrega (SENT/LOGGED/FAILED) e visualização do HTML.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  try {
    const take = 50
    const [emails, total] = await Promise.all([
      db.emailOutbox.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          to: true,
          subject: true,
          kind: true,
          status: true,
          provider: true,
          error: true,
          bodyHtml: true,
          createdAt: true,
        },
      }),
      db.emailOutbox.count(),
    ])

    return NextResponse.json({
      emails,
      total,
      smtpConfigured: SMTP_CONFIGURED,
    })
  } catch (err) {
    console.error('GET /api/admin/emails', err)
    return NextResponse.json({ error: 'Erro ao carregar a fila de e-mails.' }, { status: 500 })
  }
}
