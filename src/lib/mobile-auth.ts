// Auth da API mobile (/api/v1): JWT HS256 assinado com node:crypto —
// sem dependências externas. O token guarda só o userId (sub) + exp.
import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { activeStreak } from '@/lib/xp'

const SECRET =
  process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'mentorhub-mobile-dev-secret'

const TOKEN_TTL_DAYS = 30

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url')
}

/** Emite um JWT HS256 para o usuário (válido por 30 dias) */
export function signMobileToken(userId: string, ttlDays = TOKEN_TTL_DAYS): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, iat: now, exp: now + ttlDays * 86400 })
  ).toString('base64url')
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`
}

/** Valida assinatura + expiração; devolve o userId (sub) ou null */
export function verifyMobileToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, sig] = parts
  // Compara as strings base64url em bytes UTF-8 (mesma codificação dos dois lados)
  const expected = Buffer.from(sign(`${header}.${payload}`), 'utf8')
  const actual = Buffer.from(sig, 'utf8')
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  // Header precisa declarar o algoritmo que de fato usamos (evita confusão de alg)
  try {
    const hdr = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as {
      alg?: unknown
      typ?: unknown
    }
    if (hdr.alg !== 'HS256' || (hdr.typ !== undefined && hdr.typ !== 'JWT')) return null

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: unknown
      exp?: unknown
    }
    if (typeof data.sub !== 'string') return null
    // `exp` é OBRIGATÓRIO: todo token emitido pelo signMobileToken tem exp —
    // payload sem exp não é nosso e nunca expiraria.
    if (typeof data.exp !== 'number' || data.exp < Math.floor(Date.now() / 1000)) return null
    return data.sub
  } catch {
    return null
  }
}

/** Lê o header "Authorization: Bearer <jwt>" e devolve o userId ou null */
export function getMobileUserId(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  if (!match) return null
  return verifyMobileToken(match[1].trim())
}

/** Usuário autenticado pela API mobile (recusa token inválido e conta bloqueada) */
export async function requireMobileUser(req: NextRequest) {
  const userId = getMobileUserId(req)
  if (!userId) return null
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      avatarUrl: true,
      xp: true,
      studyStreak: true,
      longestStreak: true,
      lastStudyDate: true,
      role: true,
      blocked: true,
      creditCents: true,
      mentorProfile: { select: { id: true } },
    },
  })
  if (!user || user.blocked) return null
  return { ...user, activeStreak: activeStreak(user.studyStreak, user.lastStudyDate) }
}

/** Campos públicos do usuário retornados no login/me — nunca expõe hash nem flags internas */
export function publicMobileUser(user: {
  id: string
  name: string
  email: string
  bio: string | null
  avatarUrl: string | null
  xp: number
  studyStreak: number
  longestStreak: number
  role: string
  activeStreak: number
  mentorProfile: { id: string } | null
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    studyStreak: user.activeStreak,
    longestStreak: user.longestStreak,
    role: user.role,
    isMentor: Boolean(user.mentorProfile),
  }
}
