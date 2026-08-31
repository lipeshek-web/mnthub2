import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { createAdminSession } from '@/lib/admin-auth'
import { createMfaTicket } from '@/lib/mfa-tickets'
import { createSessionToken } from '@/lib/session'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  bio: true,
  avatarUrl: true,
  creditCents: true,
  passwordHash: true,
  role: true,
  blocked: true,
  mfaEnabled: true,
  mentorProfile: { select: { id: true } },
} as const

/** POST /api/auth/login — autentica com e-mail + senha (+ desafio MFA quando ativo) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
    }

    // Rate limit: 10 tentativas por IP a cada 5 min + 5 por conta a cada 5 min
    const ipGate = rateLimit(`login:ip:${clientIp(req)}`, 10, 5 * 60_000)
    if (!ipGate.ok) return tooMany(ipGate.retryAfterSec)
    const accGate = rateLimit(`login:acc:${email}`, 5, 5 * 60_000)
    if (!accGate.ok)
      return tooMany(accGate.retryAfterSec, 'Muitas tentativas para esta conta. Aguarde alguns minutos.')

    const user = await db.user.findUnique({ where: { email }, select: USER_SELECT })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }
    if (user.blocked) {
      return NextResponse.json(
        { error: 'Esta conta está bloqueada. Fale com o suporte.' },
        { status: 403 }
      )
    }

    // MFA ativo: senha correta não basta — pede o código do app autenticador
    if (user.mfaEnabled) {
      return NextResponse.json({
        mfaRequired: true,
        mfaTicket: await createMfaTicket(user.id),
        email: user.email,
      })
    }

    const { passwordHash: _ignored, ...rest } = user

    // Admin sem MFA configurado: emite o token do painel mesmo assim (o painel
    // exige a ativação do MFA como primeira ação e exibe aviso persistente).
    let adminToken: string | null = null
    if (user.role === 'ADMIN') {
      adminToken = (await createAdminSession(user.id)).token
    }

    return NextResponse.json({
      ...rest,
      isMentor: Boolean(user.mentorProfile),
      adminToken,
      sessionToken: createSessionToken(user.id).token,
    })
  } catch (err) {
    console.error('POST /api/auth/login', err)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
