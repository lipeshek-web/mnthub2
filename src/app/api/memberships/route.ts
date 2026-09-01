import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { membershipBaseInclude, serializeMembership } from '@/lib/membership-serialize'
import { expireDueSubscriptions } from '@/lib/membership-access'
import { resolveUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/memberships — planos de assinatura mensal (1 por mentor).
 * Filtros:
 * - mentorUserId: painel do mentor (inclui rascunho + assinantes) — SOMENTE do
 *   próprio usuário da sessão
 * - mentorId:      público (plano publicado do perfil, p/ página do mentor)
 * - userId:        estado do usuário (myStatus/renewsAt) + re-sincroniza matrículas
 *                  de assinaturas ACTIVE (novos cursos publicados entram no plano)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const mentorUserId = (sp.get('mentorUserId') || '').trim()
    const mentorId = (sp.get('mentorId') || '').trim()
    const userId = (sp.get('userId') || '').trim()

    const session = await resolveUser(req)
    const canSeeDrafts = Boolean(mentorUserId) && session?.id === mentorUserId

    const where: Record<string, unknown> = {}
    if (canSeeDrafts) {
      where.mentor = { userId: mentorUserId } // painel: tudo (mesmo rascunho)
    } else if (mentorId) {
      where.mentorId = mentorId
      where.isPublished = true
    } else {
      where.isPublished = true
    }

    // Encerra assinaturas cujo ciclo pago venceu (renewsAt ≤ agora) — antes
    // o vencimento nunca era conferido e a assinatura ficava "ativa" para sempre.
    await expireDueSubscriptions()

    // Re-sincroniza matrículas dos planos com ciclo VIGENTE (renewsAt > agora):
    // cursos publicados DEPOIS da assinatura também ficam disponíveis.
    if (userId) {
      const activeSubs = await db.membershipSubscription.findMany({
        where: { userId, status: 'ACTIVE', renewsAt: { gt: new Date() } },
        select: { mentorId: true },
      })
      for (const sub of activeSubs) {
        const courses = await db.course.findMany({
          where: { mentorId: sub.mentorId, isPublished: true },
          select: { id: true },
        })
        for (const c of courses) {
          await db.enrollment.upsert({
            where: { courseId_studentId: { courseId: c.id, studentId: userId } },
            create: { courseId: c.id, studentId: userId, completedLessonIds: '[]' },
            update: {},
          })
        }
      }
    }

    const memberships = await db.mentorMembership.findMany({
      where,
      include: {
        ...membershipBaseInclude(),
        // Painel precisa da lista completa; view pública só do estado do usuário
        subscriptions: {
          orderBy: { startedAt: 'desc' },
          select: {
            id: true,
            userId: true,
            status: true,
            startedAt: true,
            renewsAt: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const result = await Promise.all(
      memberships.map(async (m) => {
        // Cursos publicados incluídos no plano
        const coursesCount = await db.course.count({
          where: { mentorId: m.mentorId, isPublished: true },
        })
        const mine = userId ? m.subscriptions.find((s) => s.userId === userId) : undefined
        const base = serializeMembership(m, {
          coursesCount,
          subscriberCount: m._count.subscriptions,
          myStatus: mine ? (mine.status as 'ACTIVE' | 'CANCELLED') : null,
          renewsAt: mine ? mine.renewsAt.toISOString() : null,
        })
        if (mentorUserId) {
          // Visão do painel: lista de assinantes
          return {
            ...base,
            subscribers: m.subscriptions.map((s) => ({
              id: s.id,
              name: s.user.name,
              avatarUrl: s.user.avatarUrl,
              status: s.status,
              startedAt: s.startedAt.toISOString(),
              renewsAt: s.renewsAt.toISOString(),
            })),
          }
        }
        return base
      })
    )

    return NextResponse.json({ memberships: result })
  } catch (err) {
    console.error('GET /api/memberships', err)
    return NextResponse.json({ error: 'Erro ao carregar assinaturas.' }, { status: 500 })
  }
}

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/

/**
 * POST /api/memberships — cria ou atualiza o plano do mentor (1 por mentor).
 * Body: { userId, id?, title, description?, price, groupSessionDay?, groupSessionTime?, isPublished? }
 * Sem id: se já existe plano do mentor, atualiza (upsert de fato).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '').trim()
    const id = String(body?.id ?? '').trim()
    const title = String(body?.title ?? '').trim()
    const description = String(body?.description ?? '').trim().slice(0, 500)
    const price = Number(body?.price)
    const groupSessionDay = Number(body?.groupSessionDay ?? 3)
    const groupSessionTime = String(body?.groupSessionTime ?? '19:00').trim()
    const isPublished = body?.isPublished !== false

    if (!userId || !title) {
      return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: 'Informe uma mensalidade maior que zero.' },
        { status: 400 }
      )
    }
    if (!Number.isInteger(groupSessionDay) || groupSessionDay < 0 || groupSessionDay > 6) {
      return NextResponse.json({ error: 'Dia da sessão inválido.' }, { status: 400 })
    }
    if (!TIME_RE.test(groupSessionTime)) {
      return NextResponse.json({ error: 'Hora inválida (use HH:mm).' }, { status: 400 })
    }

    const profile = await db.mentorProfile.findUnique({ where: { userId } })
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 403 })
    }

    const data = {
      title,
      description,
      price: Math.round(price * 100) / 100,
      groupSessionDay,
      groupSessionTime,
      isPublished,
    }

    if (id) {
      const existing = await db.mentorMembership.findUnique({ where: { id } })
      if (!existing || existing.mentorId !== profile.id) {
        return NextResponse.json({ error: 'Assinatura não encontrada.' }, { status: 404 })
      }
      await db.mentorMembership.update({ where: { id }, data })
      return NextResponse.json({ id })
    }

    // 1 plano por mentor (mentorId @unique): atualiza se já existir
    const existingForMentor = await db.mentorMembership.findUnique({
      where: { mentorId: profile.id },
    })
    if (existingForMentor) {
      await db.mentorMembership.update({ where: { id: existingForMentor.id }, data })
      return NextResponse.json({ id: existingForMentor.id })
    }

    const created = await db.mentorMembership.create({
      data: { mentorId: profile.id, ...data },
    })
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (err) {
    console.error('POST /api/memberships', err)
    return NextResponse.json({ error: 'Erro ao salvar a assinatura.' }, { status: 500 })
  }
}
