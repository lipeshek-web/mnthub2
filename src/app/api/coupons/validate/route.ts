import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveCoupon, type CouponKind } from '@/lib/coupons'

export const dynamic = 'force-dynamic'

/**
 * POST /api/coupons/validate — valida um cupom para curso, trilha, pacote, assinatura OU sessão 1:1 (antes do checkout).
 * body: { code, userId?, courseId?, trackId?, bundleId?, membershipId?, bookingId? }
 * userId habilita o escopo NEW_ACCOUNTS (cupom só na 1ª compra).
 * → { ok, code, label, discount, finalPrice }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawCode = String(body?.code ?? '').trim()
    const userId = String(body?.userId ?? '').trim()
    const courseId = String(body?.courseId ?? '').trim()
    const trackId = String(body?.trackId ?? '').trim()
    const bundleId = String(body?.bundleId ?? '').trim()
    const membershipId = String(body?.membershipId ?? '').trim()
    const bookingId = String(body?.bookingId ?? '').trim()

    if (!rawCode || [courseId, trackId, bundleId, membershipId, bookingId].filter(Boolean).length !== 1) {
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
    const membership = membershipId
      ? await db.mentorMembership.findUnique({ where: { id: membershipId }, select: { id: true, title: true, price: true, mentorId: true } })
      : null
    const booking = bookingId
      ? await db.booking.findUnique({ where: { id: bookingId }, select: { id: true, topic: true, price: true, mentorId: true } })
      : null

    const item = course ?? track ?? bundle ?? membership ?? booking
    if (!item) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 })
    if (item.price <= 0) {
      return NextResponse.json({ error: 'Este item é gratuito — cupom não é necessário.' }, { status: 400 })
    }

    const kind: CouponKind = course ? 'COURSE' : track ? 'TRACK' : bundle ? 'BUNDLE' : booking ? 'SESSION' : 'MEMBERSHIP'
    const { error, coupon, discount, label } = await resolveCoupon(rawCode, {
      userId,
      item: { kind, id: item.id, mentorId: item.mentorId, price: item.price },
    })
    if (error || !coupon) {
      return NextResponse.json({ error: error ?? 'Cupom inválido.' }, { status: 400 })
    }

    const finalPrice = Math.max(0, Math.round((item.price - discount) * 100) / 100)
    return NextResponse.json({ ok: true, code: coupon.code, label, discount, finalPrice })
  } catch (err) {
    console.error('POST /api/coupons/validate', err)
    return NextResponse.json({ error: 'Erro ao validar cupom' }, { status: 500 })
  }
}
