import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'
import { CATEGORIES } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

// ==================== CUPONS DA PLATAFORMA (ADMIN) ====================
// GET    — lista cupons de plataforma (mentorId null) + mentores p/ escopo
// POST   — cria cupom (site inteiro · contas novas · categoria · mentor)
// PATCH  — ativa/desativa + alterna exibição na barra promocional
// DELETE — remove

const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24)

const SCOPES = ['SITE_WIDE', 'NEW_ACCOUNTS', 'CATEGORY', 'MENTOR'] as const

function dto(c: {
  id: string
  code: string
  percentOff: number | null
  amountOff: number | null
  scope: string
  category: string | null
  mentorId: string | null
  mentor?: { user: { name: string } } | null
  maxUses: number | null
  uses: number
  expiresAt: Date | null
  isActive: boolean
  showInPromoBar: boolean
  promoMessage: string | null
  createdAt: Date
}) {
  return {
    id: c.id,
    code: c.code,
    percentOff: c.percentOff,
    amountOff: c.amountOff,
    scope: c.scope,
    category: c.category,
    mentorId: c.mentorId,
    mentorName: c.mentor?.user.name ?? null,
    maxUses: c.maxUses,
    uses: c.uses,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isActive: c.isActive,
    showInPromoBar: c.showInPromoBar,
    promoMessage: c.promoMessage,
    createdAt: c.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  try {
    const [coupons, mentors] = await Promise.all([
      db.coupon.findMany({
        where: { mentorId: null },
        orderBy: { createdAt: 'desc' },
        include: { mentor: { select: { user: { select: { name: true } } } } },
      }),
      db.mentorProfile.findMany({
        select: { id: true, user: { select: { name: true } } },
        take: 300,
      }),
    ])
    const mentorList = mentors
      .map((m) => ({ id: m.id, name: m.user.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ coupons: coupons.map(dto), mentors: mentorList })
  } catch (err) {
    console.error('GET /api/admin/coupons', err)
    return NextResponse.json({ error: 'Erro ao listar cupons.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const code = normalizeCode(String(body?.code ?? ''))
    const scope = String(body?.scope ?? 'SITE_WIDE') as (typeof SCOPES)[number]
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
    const showInPromoBar = body?.showInPromoBar === true
    const promoMessage = String(body?.promoMessage ?? '').trim().slice(0, 140) || null
    const category = String(body?.category ?? '').trim()
    const mentorId = String(body?.mentorId ?? '').trim()

    if (!code) return NextResponse.json({ error: 'Informe o código do cupom.' }, { status: 400 })
    if (!SCOPES.includes(scope)) {
      return NextResponse.json({ error: 'Escopo inválido.' }, { status: 400 })
    }

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
    if (scope === 'CATEGORY' && !(CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Informe uma categoria válida para o escopo.' }, { status: 400 })
    }
    if (scope === 'MENTOR' && !mentorId) {
      return NextResponse.json({ error: 'Escolha o mentor para este escopo.' }, { status: 400 })
    }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: 'Data de validade inválida.' }, { status: 400 })
    }
    if (scope === 'MENTOR') {
      const mentor = await db.mentorProfile.findUnique({ where: { id: mentorId } })
      if (!mentor) return NextResponse.json({ error: 'Mentor não encontrado.' }, { status: 404 })
    }

    // Código exclusivo entre cupons de plataforma (cupons de mentor têm o próprio espaço)
    const dup = await db.coupon.findFirst({ where: { mentorId: null, code } })
    if (dup) return NextResponse.json({ error: 'Já existe um cupom de plataforma com este código.' }, { status: 409 })

    const coupon = await db.coupon.create({
      data: {
        mentorId: scope === 'MENTOR' ? mentorId : null,
        code,
        percentOff: hasPercent ? percentOff : null,
        amountOff: hasAmount ? amountOff : null,
        maxUses,
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
        scope,
        category: scope === 'CATEGORY' ? category : null,
        showInPromoBar,
        promoMessage,
      },
    })

    await audit(actor, 'platform_coupon.created', { code, scope, category, mentorId, showInPromoBar })
    return NextResponse.json({ coupon: dto(coupon) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/coupons', err)
    return NextResponse.json({ error: 'Erro ao criar cupom.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const id = String(body?.id ?? '').trim()
    if (!id) return NextResponse.json({ error: 'Cupom não informado.' }, { status: 400 })

    const coupon = await db.coupon.findFirst({ where: { id, mentorId: null } })
    if (!coupon) return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })

    const data: { isActive?: boolean; showInPromoBar?: boolean; promoMessage?: string | null } = {}
    if (body?.isActive !== undefined) data.isActive = Boolean(body.isActive)
    if (body?.showInPromoBar !== undefined) data.showInPromoBar = Boolean(body.showInPromoBar)
    if (body?.promoMessage !== undefined) {
      data.promoMessage = String(body.promoMessage ?? '').trim().slice(0, 140) || null
    }

    const updated = await db.coupon.update({ where: { id }, data })
    await audit(actor, 'platform_coupon.updated', { code: coupon.code, ...data })
    return NextResponse.json({ coupon: dto(updated) })
  } catch (err) {
    console.error('PATCH /api/admin/coupons', err)
    return NextResponse.json({ error: 'Erro ao atualizar cupom.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const id = (req.nextUrl.searchParams.get('id') || '').trim()
    if (!id) return NextResponse.json({ error: 'Cupom não informado.' }, { status: 400 })

    const coupon = await db.coupon.findFirst({ where: { id, mentorId: null } })
    if (!coupon) return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })

    await db.coupon.delete({ where: { id } })
    await audit(actor, 'platform_coupon.deleted', { code: coupon.code })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/coupons', err)
    return NextResponse.json({ error: 'Erro ao remover cupom.' }, { status: 500 })
  }
}
