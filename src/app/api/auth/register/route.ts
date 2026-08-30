import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { notify } from '@/lib/notify'

export const dynamic = 'force-dynamic'

/** Crédito de boas-vindas do convidado (R$ 10 em centavos) */
const WELCOME_CREDIT_CENTS = 1000

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
  mentorProfile: { select: { id: true } },
} as const

/** POST /api/auth/register — cria conta (nome, e-mail, senha) + convite ?ref= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')
    const refCode = String(body?.refCode ?? '').trim().toUpperCase().slice(0, 24)

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este e-mail. Faça login.' },
        { status: 409 }
      )
    }

    // Convite válido? (código existe e não é do próprio novo usuário — impossível
    // por definição, mas o código pode apontar p/ conta removida)
    let referrer: { id: string; name: string } | null = null
    if (refCode) {
      const inviter = await db.user.findUnique({
        where: { referralCode: refCode },
        select: { id: true, name: true },
      })
      if (inviter) referrer = inviter
    }

    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        // Convidado entra com R$ 10 de crédito de boas-vindas
        ...(referrer ? { creditCents: WELCOME_CREDIT_CENTS } : {}),
      },
      select: USER_SELECT,
    })

    // Registra a indicação (PENDING → REWARDED na 1ª compra paga)
    if (referrer) {
      try {
        await db.referral.create({
          data: { referrerId: referrer.id, referredId: user.id, code: refCode },
        })
        await notify({
          userId: referrer.id,
          kind: 'referral_joined',
          title: `${name} entrou com seu convite 🎁`,
          body: 'Você ganha R$ 20,00 quando ele concluir a primeira compra.',
          linkView: 'referrals',
        })
      } catch (err) {
        console.error('registro de indicação falhou (silencioso)', err)
      }
    }

    return NextResponse.json(
      { ...user, isMentor: Boolean(user.mentorProfile), referralApplied: Boolean(referrer) },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/auth/register', err)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
