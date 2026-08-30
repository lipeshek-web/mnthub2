import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/coupons/validate — valida um cupom para curso, trilha OU pacote (antes do checkout).
 * body: { code, courseId? , trackId?, bundleId? }
 * → { ok, code, label, discount, finalPrice }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawCode = String(body?.code ?? '').trim().toUpperCase()
    const courseId = String(body?.courseId ?? '').trim()
    const trackId = String(body?.trackId ?? '').trim()
    const bundleId = String(body?.bundleId ?? '').trim()

    if (!rawCode || [courseId, trackId, bundleId].filter(Boolean).length !== 1) {
      return NextResponse.json({ error: 'Informe o cupom e o item do checkout.' }, { status: 400 })
    }

    // Item e mentor dono
    const course = courseId
      ? await db.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, price: true, mentorId: true } })
      : null
    const track = trackId
      ? await db.track.findUnique({ where: { id: trackId }, select: { id: true, title: true, price: true, mentorId: true } })
      : null
    const bundle = bundleId
      ? await db.bundle.findUnique({ where: { id: bundleId }, select: { id: true, title: true, price: true, mentorId: true } })
      : null

    const item = course ?? track ?? bundle
    if (!item) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })
    if (item.price <= 0) {
      return NextResponse.json({ error: 'Este item é gratuito — cupom não é necessário.' }, { status: 400 })
    }

    const coupon = await db.coupon.findUnique({
      where: { mentorId_code: { mentorId: item.mentorId, code: rawCode } },
    })
    if (!coupon || coupon.mentorId !== item.mentorId) {
      return NextResponse.json({ error: 'Cupom inválido para este item.' }, { status: 404 })
    }
    if (!coupon.isActive) {
      return NextResponse.json({ error: 'Este cupom está desativado.' }, { status: 400 })
    }
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Este cupom expirou.' }, { status: 400 })
    }
    if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) {
      return NextResponse.json({ error: 'Este cupom esgotou o número de usos.' }, { status: 400 })
    }

    let discount = 0
    if (coupon.percentOff !== null) {
      discount = Math.round(item.price * (coupon.percentOff / 100) * 100) / 100
    } else if (coupon.amountOff !== null) {
      discount = Math.min(coupon.amountOff, item.price)
    }
    const finalPrice = Math.max(0, Math.round((item.price - discount) * 100) / 100)

    const label =
      coupon.percentOff !== null
        ? `${coupon.percentOff}% de desconto`
        : `R$ ${coupon.amountOff?.toFixed(2).replace('.', ',')} de desconto`

    return NextResponse.json({
      ok: true,
      code: coupon.code,
      label,
      discount,
      finalPrice,
    })
  } catch (err) {
    console.error('POST /api/coupons/validate', err)
    return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
