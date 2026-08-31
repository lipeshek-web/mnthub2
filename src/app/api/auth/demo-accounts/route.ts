import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/demo-accounts — contas de demonstração (e-mail @demo.com).
 * Substitui o antigo GET /api/users (que expunha o e-mail de TODOS os usuários,
 * inclusive contas reais). Aqui só entram as contas demo públicas, sem dados
 * sensíveis — todas usam a senha demo123 já publicada na tela de login.
 */
export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { email: { endsWith: '@demo.com' }, blocked: false },
      orderBy: { name: 'asc' },
      take: 12,
      select: { id: true, name: true, email: true, avatarUrl: true },
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/auth/demo-accounts', err)
    return NextResponse.json({ error: 'Erro ao listar contas demo' }, { status: 500 })
  }
}
