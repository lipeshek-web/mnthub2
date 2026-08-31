import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit, requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// ==================== GESTÃO DE USUÁRIOS (ADMIN) ====================

/** GET /api/admin/users?q= — lista usuários com busca (nome/e-mail) */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1)
    const take = 20

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          blocked: true,
          mfaEnabled: true,
          createdAt: true,
          creditCents: true,
          mentorProfile: { select: { id: true, isPublished: true } },
          _count: { select: { enrollments: true, orders: true } },
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        blocked: u.blocked,
        mfaEnabled: u.mfaEnabled,
        isMentor: Boolean(u.mentorProfile),
        creditCents: u.creditCents,
        enrollments: u._count.enrollments,
        orders: u._count.orders,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / take)),
    })
  } catch (err) {
    console.error('GET /api/admin/users', err)
    return NextResponse.json({ error: 'Erro ao listar usuários.' }, { status: 500 })
  }
}

/** PATCH /api/admin/users — promove/rebaixa admin, bloqueia/desbloqueia */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error
  const { actor } = guard

  try {
    const body = await req.json().catch(() => ({}))
    const targetId = String(body?.userId ?? '')
    const action = String(body?.action ?? '')
    if (!targetId || !['promote', 'demote', 'block', 'unblock'].includes(action)) {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
    }
    if (targetId === actor.id) {
      return NextResponse.json(
        { error: 'Você não pode alterar o seu próprio nível de acesso ou bloqueio.' },
        { status: 400 }
      )
    }

    const target = await db.user.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, role: true, blocked: true },
    })
    if (!target) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    let data: { role?: string; blocked?: boolean }
    switch (action) {
      case 'promote':
        data = { role: 'ADMIN' }
        break
      case 'demote':
        data = { role: 'USER' }
        break
      case 'block':
        data = { blocked: true }
        break
      default:
        data = { blocked: false }
    }

    // Bloquear/abaixar um admin invalida as sessões admin dele imediatamente
    if (target.role === 'ADMIN' && (action === 'demote' || action === 'block')) {
      await db.adminSession.deleteMany({ where: { userId: targetId } })
    }

    const updated = await db.user.update({
      where: { id: targetId },
      data,
      select: { id: true, name: true, role: true, blocked: true },
    })

    await audit(actor, `user.${action}`, { targetId, targetName: target.name })
    return NextResponse.json({ user: updated })
  } catch (err) {
    console.error('PATCH /api/admin/users', err)
    return NextResponse.json({ error: 'Erro ao atualizar o usuário.' }, { status: 500 })
  }
}
