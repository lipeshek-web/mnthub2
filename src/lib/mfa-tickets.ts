import crypto from 'crypto'
import { db } from '@/lib/db'

// Desafios MFA (2º fator do login) — persistidos no banco (5 min de validade,
// uso único) e só apontam para o usuário que JÁ autenticou a senha corretamente
// no /api/auth/login. Banco em vez de memória: sobrevive a reload/HMR do dev e
// funciona entre rotas/processos, igual ao AdminSession.

const TTL_MS = 5 * 60 * 1000

/** Cria um desafio MFA para o usuário que já provou a senha */
export async function createMfaTicket(userId: string): Promise<string> {
  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + TTL_MS)
  await db.mfaChallenge.create({ data: { token, userId, expiresAt } })
  // Limpeza oportunista de desafios expirados
  await db.mfaChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  return token
}

/** Valida o desafio SEM consumir (código só é apagado após a verificação ter sucesso) */
export async function peekMfaTicket(token: string): Promise<string | null> {
  if (!token) return null
  const entry = await db.mfaChallenge.findUnique({ where: { token } })
  if (!entry) return null
  if (entry.expiresAt.getTime() < Date.now()) {
    await db.mfaChallenge.delete({ where: { id: entry.id } }).catch(() => undefined)
    return null
  }
  return entry.userId
}

/** Consome o desafio (uso único) e devolve o userId; null se inválido/expirado */
export async function consumeMfaTicket(token: string): Promise<string | null> {
  if (!token) return null
  const entry = await db.mfaChallenge.findUnique({ where: { token } })
  if (!entry) return null
  // Remove sempre — o desafio é de uso único, válido ou não
  await db.mfaChallenge.delete({ where: { id: entry.id } }).catch(() => undefined)
  if (entry.expiresAt.getTime() < Date.now()) return null
  return entry.userId
}
