import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ==================== BARRA PROMOCIONAL (público) ====================
// GET /api/promo-bar — cupons de plataforma ativos, válidos e marcados para
// exibição na barra rotativa acima do header. Sem dados sensíveis.

export async function GET() {
  try {
    const now = new Date()
    const coupons = await db.coupon.findMany({
      where: {
        mentorId: null,
        isActive: true,
        showInPromoBar: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { mentor: { select: { user: { select: { name: true } } } } },
    })

    const items = coupons
      .filter((c) => c.maxUses === null || c.uses < c.maxUses)
      .map((c) => {
        const discountLabel =
          c.percentOff !== null
            ? `${c.percentOff}% OFF`
            : `R$ ${c.amountOff?.toFixed(2).replace('.', ',')} OFF`
        const scopeLabel =
          c.scope === 'NEW_ACCOUNTS'
            ? 'só para contas novas'
            : c.scope === 'CATEGORY'
              ? `categoria ${c.category ?? ''}`
              : c.scope === 'MENTOR'
                ? `com ${c.mentor?.user.name ?? 'mentor selecionado'}`
                : 'vale em todo o site'
        const message = c.promoMessage?.trim() || `Cupom ${c.code} · ${discountLabel}`
        return {
          id: c.id,
          code: c.code,
          message,
          discountLabel,
          scopeLabel,
        }
      })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('GET /api/promo-bar', err)
    return NextResponse.json({ items: [] })
  }
}
