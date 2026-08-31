import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { getAsaasConfig } from '@/lib/asaas'

export const dynamic = 'force-dynamic'

/** GET /api/admin/stats — números gerais da plataforma para o painel admin */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req)
  if ('error' in guard) return guard.error

  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [
      users,
      mentors,
      courses,
      tracks,
      libraryItems,
      ordersPaidAgg,
      orders30dAgg,
      paymentsPending,
      bookingsPending,
      admins,
    ] = await Promise.all([
      db.user.count({ where: { role: 'USER' } }),
      db.mentorProfile.count(),
      db.course.count(),
      db.track.count(),
      db.libraryItem.count(),
      db.order.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: true }),
      db.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: since30d } },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.booking.count({ where: { status: 'PENDING' } }),
      db.user.count({ where: { role: 'ADMIN' } }),
    ])

    const asaas = await getAsaasConfig()

    const recentPayments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        gateway: true,
        status: true,
        value: true,
        billingType: true,
        createdAt: true,
        user: { select: { name: true } },
        order: {
          select: {
            id: true,
            course: { select: { title: true } },
            track: { select: { title: true } },
            bundle: { select: { title: true } },
            membership: { select: { title: true } },
          },
        },
      },
    })

    return NextResponse.json({
      totals: {
        users,
        mentors,
        courses,
        tracks,
        libraryItems,
        admins,
        bookingsPending,
        paymentsPending,
      },
      revenue: {
        totalCents: Math.round((ordersPaidAgg._sum.amount ?? 0) * 100),
        ordersCount: ordersPaidAgg._count,
        last30dCents: Math.round((orders30dAgg._sum.amount ?? 0) * 100),
        last30dOrders: orders30dAgg._count,
      },
      asaas: {
        configured: asaas.apiKey.length > 0,
        env: asaas.env,
        webhookConfigured: Boolean(asaas.webhookToken),
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        gateway: p.gateway,
        status: p.status,
        value: p.value,
        billingType: p.billingType,
        createdAt: p.createdAt.toISOString(),
        userName: p.user.name,
        itemTitle:
          p.order.course?.title ??
          p.order.track?.title ??
          p.order.bundle?.title ??
          p.order.membership?.title ??
          'Pedido',
      })),
    })
  } catch (err) {
    console.error('GET /api/admin/stats', err)
    return NextResponse.json({ error: 'Erro ao carregar os números.' }, { status: 500 })
  }
}
