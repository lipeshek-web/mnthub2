import crypto from 'crypto'

// Desafios MFA em memória (5 min de validade, 1 uso) — apenas apontam para o
// usuário que JÁ autenticou senha corretamente no /api/auth/login.
const MFA_TICKETS = new Map<string, { userId: string; expiresAt: number }>()

export function createMfaTicket(userId: string): string {
  // limpeza oportunista
  const now = Date.now()
  for (const [k, v] of MFA_TICKETS) if (v.expiresAt < now) MFA_TICKETS.delete(k)
  const ticket = crypto.randomBytes(24).toString('hex')
  MFA_TICKETS.set(ticket, { userId, expiresAt: now + 5 * 60 * 1000 })
  return ticket
}

export function consumeMfaTicket(ticket: string): string | null {
  const entry = MFA_TICKETS.get(ticket)
  if (!entry || entry.expiresAt < Date.now()) return null
  MFA_TICKETS.delete(ticket)
  return entry.userId
}
