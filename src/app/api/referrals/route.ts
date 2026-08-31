import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L) p/ códigos de convite */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newReferralCode(): string {
  let code = 'MH-'
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

/** Gera código único para o usuário (retenta em colisão) */
async function ensureReferralCode(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, referralCode: true },
  })
  if (!user) throw new Error('Usuário não encontrado')
  if (user.referralCode) return user.referralCode

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newReferralCode()
    try {
      const updated = await db.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      })
      return updated.referralCode as string
    } catch {
      /* colisão de código único — tenta de novo */
    }
  }
  throw new Error('Falha ao gerar código de convite')
}

/**
 * GET /api/referrals?userId= — dados do programa de indicação do usuário:
 * gera o código no 1º acesso, devolve saldo, estatísticas e convidados.
 */
export async function GET(req: NextRequest) {
  try {
    // Sessão — códigos/créditos de indicação de outro usuário eram legíveis (IDOR)
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão necessária.')
    const userId = session.id

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const code = await ensureReferralCode(userId)

    const referrals = await db.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { referred: { select: { name: true } } },
    })

    const REWARD_CENTS = 2000 // R$ 20 por conversão
    const converted = referrals.filter((r) => r.status === 'REWARDED')

    return NextResponse.json({
      code,
      shareUrl: `?ref=${code}`,
      creditCents: user.creditCents,
      invitedCount: referrals.length,
      convertedCount: converted.length,
      earnedCents: converted.length * REWARD_CENTS,
      pendingCount: referrals.length - converted.length,
      referrals: referrals.map((r) => ({
        id: r.id,
        referredName: r.referred.name,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        rewardedAt: r.rewardedAt ? r.rewardedAt.toISOString() : null,
      })),
    })
  } catch (err) {
    console.error('GET /api/referrals', err)
    return NextResponse.json({ error: 'Erro ao carregar indicações.' }, { status: 500 })
  }
}
