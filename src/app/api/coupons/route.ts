import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24)

/** GET /api/coupons?userId= — cupons do mentor */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 404 })

    const coupons = await db.coupon.findMany({
      where: { mentorId: mentor.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      coupons.map((c) => ({
        id: c.id,
        code: c.code,
        percentOff: c.percentOff,
        amountOff: c.amountOff,
        maxUses: c.maxUses,
        uses: c.uses,
        expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      }))
    )
  } catch (err) {
    console.error('GET /api/coupons', err)
    return NextResponse.json({ error: 'Erro ao listar cupons' }, { status: 500 })
  }
}

/**
 * POST /api/coupons — cria cupom do mentor.
 * body: { userId, code, percentOff?, amountOff?, maxUses?, expiresAt? (ISO) }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '').trim()
    const code = normalizeCode(String(body?.code ?? ''))
    const percentOff = body?.percentOff === undefined || body?.percentOff === null || body?.percentOff === ''
      ? null
      : Math.round(Number(body.percentOff))
    const amountOff = body?.amountOff === undefined || body?.amountOff === null || body?.amountOff === ''
      ? null
      : Math.round(Number(body.amountOff) * 100) / 100
    const maxUses = body?.maxUses === undefined || body?.maxUses === null || body?.maxUses === ''
      ? null
      : Math.max(1, Math.round(Number(body.maxUses)))
    const expiresAt = body?.expiresAt ? new Date(String(body.expiresAt)) : null

    if (!userId || !code) {
      return NextResponse.json({ error: 'Informe o código do cupom.' }, { status: 400 })
    }

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 404 })

    const hasPercent = percentOff !== null && Number.isFinite(percentOff) && percentOff > 0
    const hasAmount = amountOff !== null && Number.isFinite(amountOff) && amountOff > 0
    if (hasPercent === hasAmount) {
      return NextResponse.json(
        { error: 'Escolha exatamente um tipo de desconto: percentual OU valor fixo.' },
        { status: 400 }
      )
    }
    if (hasPercent && (percentOff as number) > 100) {
      return NextResponse.json({ error: 'O desconto não pode passar de 100%.' }, { status: 400 })
    }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: 'Data de validade inválida.' }, { status: 400 })
    }

    const dup = await db.coupon.findUnique({
      where: { mentorId_code: { mentorId: mentor.id, code } },
    })
    if (dup) return NextResponse.json({ error: 'Você já tem um cupom com este código.' }, { status: 409 })

    const coupon = await db.coupon.create({
      data: {
        mentorId: mentor.id,
        code,
        percentOff: hasPercent ? percentOff : null,
        amountOff: hasAmount ? amountOff : null,
        maxUses,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      },
    })

    return NextResponse.json(
      {
        id: coupon.id,
        code: coupon.code,
        percentOff: coupon.percentOff,
        amountOff: coupon.amountOff,
        maxUses: coupon.maxUses,
        uses: coupon.uses,
        expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/coupons', err)
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 })
  }
}

/** PATCH /api/coupons — ativa/desativa: { userId, id, isActive } */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '').trim()
    const id = String(body?.id ?? '').trim()
    if (!userId || !id) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 404 })

    const coupon = await db.coupon.findUnique({ where: { id } })
    if (!coupon || coupon.mentorId !== mentor.id) {
      return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })
    }

    const updated = await db.coupon.update({
      where: { id },
      data: { isActive: Boolean(body?.isActive) },
    })
    return NextResponse.json({ id: updated.id, isActive: updated.isActive })
  } catch (err) {
    console.error('PATCH /api/coupons', err)
    return NextResponse.json({ error: 'Erro ao atualizar cupom' }, { status: 500 })
  }
}

/** DELETE /api/coupons?userId=&id= — exclui cupom do mentor */
export async function DELETE(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const userId = (sp.get('userId') || '').trim()
    const id = (sp.get('id') || '').trim()
    if (!userId || !id) return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 404 })

    const coupon = await db.coupon.findUnique({ where: { id } })
    if (!coupon || coupon.mentorId !== mentor.id) {
      return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })
    }

    await db.coupon.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/coupons', err)
    return NextResponse.json({ error: 'Erro ao excluir cupom' }, { status: 500 })
  }
}
