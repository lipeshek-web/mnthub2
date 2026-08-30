import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyTotp } from '@/lib/totp'
import { verifyAndConsumeRecoveryCode } from '@/lib/recovery-codes'
import { audit, createAdminSession } from '@/lib/admin-auth'
import { consumeMfaTicket } from '@/lib/mfa-tickets'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  bio: true,
  avatarUrl: true,
  creditCents: true,
  role: true,
  blocked: true,
  mfaEnabled: true,
  mfaSecret: true,
  mentorProfile: { select: { id: true } },
} as const

/**
 * POST /api/auth/mfa/verify — segundo fator do login.
 * Recebe { ticket, code } emitido pelo /api/auth/login quando o usuário tem
 * MFA ativo. Retorna a sessão completa (igual ao login) + adminToken quando
 * for ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const ticket = String(body?.ticket ?? '')
    const code = String(body?.code ?? '')

    const userId = await consumeMfaTicket(ticket)
    if (!userId) {
      return NextResponse.json(
        { error: 'Desafio expirado. Faça login novamente.' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({ where: { id: userId }, select: USER_SELECT })
    if (!user || user.blocked) {
      return NextResponse.json({ error: 'Usuário indisponível.' }, { status: 403 })
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: 'MFA não está ativo nesta conta.' }, { status: 400 })
    }

    // Aceita TOTP de 6 dígitos OU um código de recuperação (uso único) —
    // salva-vidas quando o app autenticador não está disponível.
    let usedRecoveryCode = false
    let recoveryCodesRemaining = -1
    if (verifyTotp(user.mfaSecret, code)) {
      // TOTP válido — segue o fluxo normal
    } else {
      const recovery = await verifyAndConsumeRecoveryCode(user.id, code)
      if (!recovery.ok) {
        return NextResponse.json(
          { error: 'Código inválido. Tente o próximo.' },
          { status: 401 }
        )
      }
      usedRecoveryCode = true
      recoveryCodesRemaining = recovery.remaining
      await audit(
        { id: user.id, name: user.name, email: user.email },
        'mfa.recovery.used',
        { remaining: recovery.remaining }
      )
    }

    let adminToken: string | null = null
    if (user.role === 'ADMIN') {
      adminToken = (await createAdminSession(user.id)).token
    }

    // O segredo TOTP NUNCA sai do servidor
    const { mfaSecret: _secret, ...safeUser } = user
    return NextResponse.json({
      ...safeUser,
      isMentor: Boolean(user.mentorProfile),
      adminToken,
      ...(usedRecoveryCode ? { usedRecoveryCode, recoveryCodesRemaining } : {}),
    })
  } catch (err) {
    console.error('POST /api/auth/mfa/verify', err)
    return NextResponse.json({ error: 'Erro ao verificar o código.' }, { status: 500 })
  }
}
