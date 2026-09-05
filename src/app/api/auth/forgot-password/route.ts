import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SMTP_CONFIGURED, brandedEmail, sendEmail } from '@/lib/email'
import { clientIp, rateLimit, tooMany } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/forgot-password — "esqueci minha senha".
 *
 * Responde SEMPRE { ok: true } (sem enumerar contas): exista ou não o e-mail,
 * o corpo da resposta é o mesmo. Quando a conta existe, um token de uso único
 * (30 min) é gerado — o banco guarda apenas o sha256 — e o link de redefinição
 * é enviado por e-mail (fila EmailOutbox).
 *
 * MODO DEMONSTRAÇÃO (sem SMTP configurado): além do e-mail na fila, o link
 * volta na própria resposta (resetUrl) para que o fluxo seja completável na
 * sandbox. Com SMTP configurado a resposta é genérica e o link vai só no e-mail.
 */

function guardForgot(req: NextRequest) {
  const r = rateLimit(`forgot:${clientIp(req)}`, 3, 10 * 60_000)
  return r.ok ? null : tooMany(r.retryAfterSec)
}

export async function POST(req: NextRequest) {
  const limited = guardForgot(req)
  if (limited) return limited
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const okResponse = NextResponse.json(
      SMTP_CONFIGURED
        ? { ok: true, delivery: 'email' }
        : { ok: true, delivery: 'outbox' }
    )

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return okResponse

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, blocked: true },
    })
    // Sem conta / bloqueada: mesma resposta genérica (sem enumeração)
    if (!user || user.blocked) return okResponse

    // Invalida tokens anteriores e cria o novo (uso único, 30 min)
    const raw = randomBytes(24).toString('base64url')
    const tokenHash = createHash('sha256').update(raw).digest('hex')
    await db.$transaction([
      db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60_000) },
      }),
    ])

    const base = req.nextUrl.origin
    const resetUrl = `${base}/?reset=${raw}`

    await sendEmail({
      to: email,
      kind: 'password_reset',
      subject: 'Redefinir sua senha — Órbita',
      html: brandedEmail({
        title: `Oi, ${user.name.split(' ')[0]}!`,
        lines: [
          'Recebemos um pedido para redefinir a senha da sua conta.',
          'Este link é válido por <strong>30 minutos</strong> e só pode ser usado uma vez.',
          'Se não foi você, ignore este e-mail — sua senha continua a mesma.',
        ],
        cta: { label: 'Redefinir senha', url: resetUrl },
      }),
    })

    // Modo demonstração: sem SMTP, o link precisa chegar ao usuário de outra forma
    if (!SMTP_CONFIGURED) {
      return NextResponse.json({ ok: true, delivery: 'outbox', resetUrl })
    }
    return okResponse
  } catch (err) {
    console.error('POST /api/auth/forgot-password', err)
    return NextResponse.json({ error: 'Erro ao processar o pedido.' }, { status: 500 })
  }
}
