import { db } from '@/lib/db'

// ==================== CUPONS (mentor + plataforma) ====================
// Resolução unificada usada por /api/coupons/validate e /api/checkout.
// Um cupom é de PLATAFORMA quando mentorId é null — nesse caso o escopo
// (scope) define onde ele vale:
//   SITE_WIDE    → qualquer item pago
//   NEW_ACCOUNTS → qualquer item, mas só na 1ª compra do usuário (conta nova)
//   CATEGORY     → itens da categoria alvo (curso/trilha direto; pacote via
//                  cursos internos; assinatura via categorias do mentor)
//   MENTOR       → apenas itens do mentor alvo (criado pelo admin)
// Cupons de mentor (scope MENTOR + mentorId setado) valem só nos itens dele.

export type CouponKind = 'COURSE' | 'TRACK' | 'BUNDLE' | 'MEMBERSHIP' | 'SESSION'

export interface CouponItemContext {
  kind: CouponKind
  id: string
  mentorId: string
  price: number
}

export interface ResolvedCoupon {
  error: string | null
  coupon: {
    id: string
    code: string
    percentOff: number | null
    amountOff: number | null
  } | null
  discount: number
  label: string
}

export function couponLabel(c: { percentOff: number | null; amountOff: number | null }): string {
  if (c.percentOff !== null) return `${c.percentOff}% de desconto`
  if (c.amountOff !== null) return `R$ ${c.amountOff.toFixed(2).replace('.', ',')} de desconto`
  return 'Desconto'
}

/** O item é elegível ao escopo CATEGORY? (consulta o que precisar no banco) */
async function itemMatchesCategory(item: CouponItemContext, category: string): Promise<boolean> {
  if (!category) return false
  try {
    if (item.kind === 'COURSE') {
      const course = await db.course.findUnique({ where: { id: item.id }, select: { category: true } })
      return course?.category === category
    }
    if (item.kind === 'TRACK') {
      const track = await db.track.findUnique({ where: { id: item.id }, select: { category: true } })
      return track?.category === category
    }
    if (item.kind === 'BUNDLE') {
      const bundle = await db.bundle.findUnique({
        where: { id: item.id },
        select: { items: { select: { course: { select: { category: true } } } } },
      })
      return (bundle?.items ?? []).some((i) => i.course.category === category)
    }
    // MEMBERSHIP/SESSION: categoria dentro das categorias do mentor (JSON array)
    const mentor = await db.mentorProfile.findUnique({
      where: { id: item.mentorId },
      select: { categories: true },
    })
    try {
      const cats: string[] = JSON.parse(mentor?.categories ?? '[]')
      return cats.includes(category)
    } catch {
      return false
    }
  } catch {
    return false
  }
}

/** Checagens comuns (ativa/não expirado/não esgotado) — retorna erro ou null */
function commonChecks(c: { isActive: boolean; expiresAt: Date | null; maxUses: number | null; uses: number }): string | null {
  if (!c.isActive) return 'Este cupom está desativado.'
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return 'Este cupom expirou.'
  if (c.maxUses !== null && c.uses >= c.maxUses) return 'Este cupom esgotou o número de usos.'
  return null
}

function applyDiscount(
  c: { id: string; code: string; percentOff: number | null; amountOff: number | null },
  price: number
): ResolvedCoupon {
  let discount = 0
  if (c.percentOff !== null) {
    discount = Math.round(price * (c.percentOff / 100) * 100) / 100
  } else if (c.amountOff !== null) {
    discount = Math.min(c.amountOff, price)
  }
  return {
    error: null,
    coupon: { id: c.id, code: c.code, percentOff: c.percentOff, amountOff: c.amountOff },
    discount,
    label: couponLabel(c),
  }
}

const fail = (error: string): ResolvedCoupon => ({ error, coupon: null, discount: 0, label: '' })

/**
 * Resolve (valida) um cupom para um item de checkout.
 * Ordem: cupons de plataforma (por escopo) → cupons do mentor do item.
 */
export async function resolveCoupon(
  rawCode: string,
  opts: { userId: string; item: CouponItemContext }
): Promise<ResolvedCoupon> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { error: null, coupon: null, discount: 0, label: '' }
  const { userId, item } = opts

  // ---------- 1) Cupom de PLATAFORMA (mentorId null) ----------
  const platform = await db.coupon.findFirst({ where: { mentorId: null, code } })
  if (platform) {
    const base = commonChecks(platform)
    if (base) return fail(base)

    if (platform.scope === 'NEW_ACCOUNTS') {
      // "Primeira compra" = pedido PAGO (PENDING abandonado não queima o cupom)
      const priorOrders = await db.order.count({
        where: { studentId: userId, status: 'PAID' },
      })
      if (priorOrders > 0) {
        return fail('Este cupom é válido apenas para a primeira compra (contas novas).')
      }
    } else if (platform.scope === 'CATEGORY') {
      const ok = await itemMatchesCategory(item, platform.category ?? '')
      if (!ok) {
        return fail(`Este cupom vale apenas para itens da categoria "${platform.category ?? ''}".`)
      }
    } else if (platform.scope === 'MENTOR') {
      if (platform.mentorId !== item.mentorId) {
        return fail('Cupom inválido para este item.')
      }
    }
    // SITE_WIDE: vale para qualquer item pago
    return applyDiscount(platform, item.price)
  }

  // ---------- 2) Cupom do MENTOR do item ----------
  const mentorCoupon = await db.coupon.findUnique({
    where: { mentorId_code: { mentorId: item.mentorId, code } },
  })
  if (!mentorCoupon) return fail('Cupom inválido para este item.')
  const base = commonChecks(mentorCoupon)
  if (base) return fail(base)
  return applyDiscount(mentorCoupon, item.price)
}
