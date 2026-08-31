import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ==================== SEGURANÇA DO PAINEL ADMIN ====================
// Modelo: login com senha (+ código TOTP quando o MFA está ativo) emite um
// AdminSession token (12h). Todo endpoint admin exige o header x-admin-token
// resolvido contra o banco — sem token, sem acesso.

const SESSION_TTL_MS = 12 * 60 * 60 * 1000

export interface AdminActor {
  id: string
  name: string
  email: string
}

/** Cria uma sessão administrativa para o admin autenticado */
export async function createAdminSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  await db.adminSession.create({ data: { token, userId, expiresAt } })
  // Limpeza oportunista de sessões expiradas
  await db.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  return { token, expiresAt }
}

/**
 * Valida o header x-admin-token e retorna o admin da sessão.
 * Retorna null quando a sessão é inexistente/expirada ou o usuário deixou de
 * ser admin / foi bloqueado.
 */
export async function resolveAdmin(req: NextRequest): Promise<AdminActor | null> {
  const token = req.headers.get('x-admin-token')?.trim()
  if (!token) return null
  const session = await db.adminSession.findUnique({
    where: { token },
    select: { expiresAt: true, user: { select: { id: true, name: true, email: true, role: true, blocked: true } } },
  })
  if (!session || session.expiresAt.getTime() < Date.now()) return null
  const { user } = session
  if (user.role !== 'ADMIN' || user.blocked) return null
  return { id: user.id, name: user.name, email: user.email }
}

/** Wrapper para handlers admin: 401 quando não autenticado */
export async function requireAdmin(
  req: NextRequest
): Promise<{ actor: AdminActor } | { error: NextResponse }> {
  const actor = await resolveAdmin(req)
  if (!actor) {
    return {
      error: NextResponse.json(
        { error: 'Acesso administrativo necessário. Faça login como admin.' },
        { status: 401 }
      ),
    }
  }
  return { actor }
}

/** Registra uma ação na trilha de auditoria (nunca quebra o fluxo) */
export async function audit(
  actor: AdminActor | null,
  action: string,
  meta: Record<string, unknown> = {}
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorName: actor ? `${actor.name} (${actor.email})` : 'sistema',
        action,
        meta: JSON.stringify(meta).slice(0, 2000),
      },
    })
  } catch (err) {
    console.error('audit falhou (silencioso)', err)
  }
}
