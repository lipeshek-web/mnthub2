import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mentors/finance?userId= — resumo financeiro do mentor:
 * receita de cursos/trilhas (Orders PAID), receita de sessões (Bookings COMPLETED),
 * série mensal (6 meses), por produto e pedidos recentes.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const mentor = await db.mentorProfile.findUnique({ where: { userId } })
    if (!mentor) return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 404 })

    const [orders, bookings] = await Promise.all([
      db.order.findMany({
        where: { mentorId: mentor.id, status: 'PAID' },
        include: {
          course: { select: { id: true, title: true } },
          track: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.booking.findMany({
        where: { mentorId: mentor.id, status: 'COMPLETED' },
        select: { price: true, startsAt: true },
      }),
    ])

    const productsRevenue = orders.reduce((acc, o) => acc + o.amount, 0)
    const sessionsRevenue = bookings.reduce((acc, b) => acc + b.price, 0)
    const totalRevenue = productsRevenue + sessionsRevenue

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const last30Revenue = orders
      .filter((o) => o.createdAt.getTime() >= thirtyDaysAgo)
      .reduce((acc, o) => acc + o.amount, 0)

    // Série mensal (últimos 6 meses, incluindo o atual)
    const monthLabels: string[] = []
    const monthKeys: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
      monthLabels.push(
        d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
      )
    }
    const monthSeries = monthKeys.map((key, idx) => {
      const monthOrders = orders.filter(
        (o) =>
          `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}` === key
      )
      return {
        label: monthLabels[idx],
        revenue: Math.round(monthOrders.reduce((acc, o) => acc + o.amount, 0) * 100) / 100,
        orders: monthOrders.length,
      }
    })

    // Por produto (cursos e trilhas)
    const byProductMap = new Map<string, { title: string; revenue: number; orders: number }>()
    for (const o of orders) {
      const key = o.courseId ?? o.trackId
      if (!key) continue
      const title = o.course?.title ?? o.track?.title ?? 'Produto'
      const entry = byProductMap.get(key) ?? { title, revenue: 0, orders: 0 }
      entry.revenue = Math.round((entry.revenue + o.amount) * 100) / 100
      entry.orders += 1
      byProductMap.set(key, entry)
    }
    const byProduct = Array.from(byProductMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    const paidCount = orders.length
    const avgTicket = paidCount > 0 ? Math.round((productsRevenue / paidCount) * 100) / 100 : 0

    // Descontos concedidos via cupons
    const totalDiscount = orders.reduce((acc, o) => acc + (o.discount ?? 0), 0)

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      productsRevenue: Math.round(productsRevenue * 100) / 100,
      sessionsRevenue: Math.round(sessionsRevenue * 100) / 100,
      sessionsCount: bookings.length,
      last30Revenue: Math.round(last30Revenue * 100) / 100,
      ordersCount: paidCount,
      avgTicket,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      monthSeries,
      byProduct,
      recentOrders: orders.slice(0, 8).map((o) => ({
        id: o.id,
        itemTitle: o.course?.title ?? o.track?.title ?? 'Produto',
        amount: o.amount,
        discount: o.discount ?? 0,
        couponCode: o.couponCode,
        channel: o.channel,
        createdAt: o.createdAt.toISOString(),
      })),
    })
  } catch (err) {
    console.error('GET /api/mentors/finance', err)
    return NextResponse.json({ error: 'Erro ao carregar dados financeiros' }, { status: 500 })
  }
}
