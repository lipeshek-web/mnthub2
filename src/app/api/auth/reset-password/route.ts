import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { brandedEmail, sendEmail } from '@/lib/email'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/reset-password — consome o token do link de redefinição.
 * Token cru (24 bytes base64url) → sha256 → busca; uso único e 30 min.
 * A troca da senha e o consumo do token são atômicos ($transaction).
 * NOTA: sessões são HMAC sem estado — senhas antigas continuam válidas até
 * expirar (30 dias); mitigação futura: versão de senha no payload do token.
 */

function guardReset(req: NextRequest) {
  const r = rateLimit(`resetpw:${clientIp(req)}`, 5, 10 * 60_000)
  return r.ok ? null : tooMany(r.retryAfterSec)
}

export async function POST(req: NextRequest) {
  const limited = guardReset(req)
  if (limited) return limited
  try {
    const body = await req.json()
    const token = String(body?.token ?? '').trim()
    const password = String(body?.password ?? '')

    if (!token) {
      return NextResponse.json({ error: 'Link inválido ou expirado. Peça um novo.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    })
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Link inválido ou expirado. Peça um novo.' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: record.userId },
      select: { id: true, email: true, name: true, blocked: true },
    })
    if (!user || user.blocked) {
      return NextResponse.json({ error: 'Link inválido ou expirado. Peça um novo.' }, { status: 400 })
    }

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Outros tokens pendentes do usuário deixam de valer
      db.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null, id: { not: record.id } },
      }),
    ])

    await sendEmail({
      to: user.email,
      kind: 'password_changed',
      subject: 'Sua senha foi alterada — Órbita',
      html: brandedEmail({
        title: 'Senha alterada com sucesso',
        lines: [
          `A senha da sua conta (${user.email}) acabou de ser alterada.`,
          'Se não foi você, entre em contato com o suporte imediatamente.',
        ],
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/auth/reset-password', err)
    return NextResponse.json({ error: 'Erro ao redefinir a senha.' }, { status: 500 })
  }
}
