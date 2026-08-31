import { createHmac, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

/**
 * Sessão de usuário — token assinado (HMAC-SHA256) sem estado.
 *
 * Formato: base64url(payload).base64url(hmac)
 * payload: { uid, exp } — userId + expiração (epoch ms)
 *
 * Emitido no login/registro/verificação MFA e devolvido ao cliente, que o
 * envia no header `Authorization: Bearer <token>` (central em src/lib/api.ts).
 * Rotas sensíveis derivam a identidade daqui em vez de confiar em userId do
 * corpo da requisição (corrige IDOR sistêmico).
 */

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.DATABASE_URL || // fallback determinístico do ambiente
    'mentorhub-dev-secret'
  )
}

function b64url(buf: Buffer): string {
  return buf.toString('base64url')
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', getSecret()).update(payload).digest())
}

/** Cria um token de sessão assinado para o usuário */
export function createSessionToken(userId: string): { token: string; expiresAt: Date } {
  const exp = Date.now() + SESSION_TTL_MS
  const payload = b64url(Buffer.from(JSON.stringify({ uid: userId, exp })))
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp) }
}

/** Verifica assinatura + expiração (comparação timing-safe). null = inválido */
export function verifySessionToken(token: string | null | undefined): string | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  // Ambos decodificados de base64url p/ 32 bytes brutos do HMAC-SHA256
  const expected = Buffer.from(sign(payload), 'base64url')
  let received: Buffer
  try {
    received = Buffer.from(sig, 'base64url')
  } catch {
    return null
  }
  if (received.length !== expected.length) return null
  if (!timingSafeEqual(received, expected)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      uid?: string
      exp?: number
    }
    if (!data.uid || typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return data.uid
  } catch {
    return null
  }
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  blocked: boolean
}

/**
 * Resolve o usuário autenticado a partir do header `Authorization: Bearer`.
 * Retorna null se não autenticado ou se a conta foi bloqueada desde a emissão.
 */
export async function resolveUser(req: Request): Promise<SessionUser | null> {
  const header = req.headers.get('authorization') || ''
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null
  const uid = verifySessionToken(token)
  if (!uid) return null
  const user = await db.user.findUnique({
    where: { id: uid },
    select: { id: true, name: true, email: true, role: true, blocked: true },
  })
  if (!user || user.blocked) return null
  return user
}

/** JSON 401 padrão */
export function unauthorized(message = 'Sessão expirada. Entre novamente.'): Response {
  return Response.json({ error: message }, { status: 401 })
}
