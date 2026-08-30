import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'
import { generateTotpSecret, otpauthUri, verifyTotp } from '@/lib/totp'
import { verifyPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

// ==================== MFA DO ADMIN (TOTP) ====================
// GET: status do MFA do admin logado
// POST action=setup: gera segredo temporário + QR (ainda não ativa)
// POST action=enable: valida o código e ativa o MFA
// POST action=disable: exige a senha e desativa

/** Segredos de setup pendentes em memória (10 min) — só viram conta após enable */
const PENDING_SETUP = new Map<string, { secret: string; expiresAt: number }>()

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  const user = await db.user.findUnique({
    where: { id: actor.id },
    select: { mfaEnabled: true },
  })
  return NextResponse.json({ mfaEnabled: user?.mfaEnabled ?? false })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const action = String(body?.action ?? '')

    // ---------- Gerar QR de configuração ----------
    if (action === 'setup') {
      const secret = generateTotpSecret()
      PENDING_SETUP.set(actor.id, { secret, expiresAt: Date.now() + 10 * 60 * 1000 })
      const uri = otpauthUri(secret, actor.email)
      const qrDataUrl = await QRCode.toDataURL(uri, {
        width: 240,
        margin: 1,
        color: { dark: '#1c1917', light: '#ffffff' },
      })
      return NextResponse.json({ secret, uri, qrDataUrl })
    }

    // ---------- Ativar (confere o código de 6 dígitos) ----------
    if (action === 'enable') {
      const code = String(body?.code ?? '')
      const pending = PENDING_SETUP.get(actor.id)
      if (!pending || pending.expiresAt < Date.now()) {
        return NextResponse.json(
          { error: 'Configuração expirada. Gere o QR novamente.' },
          { status: 400 }
        )
      }
      if (!verifyTotp(pending.secret, code)) {
        return NextResponse.json({ error: 'Código inválido. Confira o horário e tente o próximo.' }, { status: 401 })
      }
      await db.user.update({
        where: { id: actor.id },
        data: { mfaSecret: pending.secret, mfaEnabled: true },
      })
      PENDING_SETUP.delete(actor.id)
      await audit(actor, 'mfa.enabled')
      return NextResponse.json({ ok: true, mfaEnabled: true })
    }

    // ---------- Desativar (exige senha) ----------
    if (action === 'disable') {
      const password = String(body?.password ?? '')
      const user = await db.user.findUnique({
        where: { id: actor.id },
        select: { passwordHash: true },
      })
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
      }
      await db.user.update({
        where: { id: actor.id },
        data: { mfaEnabled: false, mfaSecret: null },
      })
      await audit(actor, 'mfa.disabled')
      return NextResponse.json({ ok: true, mfaEnabled: false })
    }

    return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 })
  } catch (err) {
    console.error('POST /api/admin/mfa', err)
    return NextResponse.json({ error: 'Erro na operação do MFA.' }, { status: 500 })
  }
}
