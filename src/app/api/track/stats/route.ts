import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * GET /api/track/stats?mentorUserId=
 * Agregado de tráfego do mentor: funil (pageviews → view_item → checkout → compra),
 * receita, separação por canal e por utm_source, e série dos últimos 14 dias.
 */
export async function GET(req: NextRequest) {
  try {
    const mentorUserId = (req.nextUrl.searchParams.get('mentorUserId') || '').trim()
    if (!mentorUserId) {
      return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })
    }
    const profile = await db.mentorProfile.findUnique({ where: { userId: mentorUserId } })
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de mentor não encontrado.' }, { status: 404 })
    }

    const since = new Date()
    since.setDate(since.getDate() - 90)

    const [events, orders] = await Promise.all([
      db.trackingEvent.findMany({
        where: { mentorId: profile.id, createdAt: { gte: since } },
        select: {
          name: true,
          channel: true,
          utmSource: true,
          utmCampaign: true,
          createdAt: true,
        },
      }),
      db.order.findMany({
        where: { mentorId: profile.id, status: 'PAID', createdAt: { gte: since } },
        select: {
          courseId: true,
          amount: true,
          channel: true,
          utmSource: true,
          utmCampaign: true,
          createdAt: true,
          course: { select: { title: true } },
        },
      }),
    ])

    const count = (arr: { name: string }[], name: string) => arr.filter((e) => e.name === name).length
    const pageviews = count(events, 'page_view')
    const viewItems = count(events, 'view_item')
    const checkouts = count(events, 'begin_checkout')
    const purchases = orders.length
    const revenue = orders.reduce((acc, o) => acc + o.amount, 0)
    const conversionRate = pageviews > 0 ? Math.round((purchases / pageviews) * 1000) / 10 : 0

    const aggregate = <T extends string>(
      rows: { key: T; amount?: number }[]
    ): Map<T, { count: number; revenue: number }> => {
      const m = new Map<T, { count: number; revenue: number }>()
      for (const r of rows) {
        const cur = m.get(r.key) ?? { count: 0, revenue: 0 }
        cur.count += 1
        cur.revenue += r.amount ?? 0
        m.set(r.key, cur)
      }
      return m
    }

    const pageviewRows = events.filter((e) => e.name === 'page_view')
    const pvByChannel = aggregate(pageviewRows.map((e) => ({ key: e.channel })))
    const ordersByChannel = aggregate(
      orders.map((o) => ({ key: o.channel, amount: o.amount }))
    )
    const channels = Array.from(new Set([...pvByChannel.keys(), ...ordersByChannel.keys()]))
    const byChannel = channels
      .map((channel) => ({
        channel,
        pageviews: pvByChannel.get(channel)?.count ?? 0,
        purchases: ordersByChannel.get(channel)?.count ?? 0,
        revenue: Math.round((ordersByChannel.get(channel)?.revenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.pageviews + b.purchases * 20 - (a.pageviews + a.purchases * 20))

    const sourceOf = (utmSource: string | null, channel: string) => utmSource || channel
    const pvBySource = aggregate(pageviewRows.map((e) => ({ key: sourceOf(e.utmSource, e.channel) })))
    const ordersBySource = aggregate(
      orders.map((o) => ({ key: sourceOf(o.utmSource, o.channel), amount: o.amount }))
    )
    const sources = Array.from(new Set([...pvBySource.keys(), ...ordersBySource.keys()]))
    const bySource = sources
      .map((source) => ({
        source,
        pageviews: pvBySource.get(source)?.count ?? 0,
        purchases: ordersBySource.get(source)?.count ?? 0,
        revenue: Math.round((ordersBySource.get(source)?.revenue ?? 0) * 100) / 100,
      }))
      .sort((a, b) => b.pageviews + b.purchases * 20 - (a.pageviews + a.purchases * 20))
      .slice(0, 8)

    const ordersByCourse = aggregate(
      orders
        .filter((o) => o.courseId)
        .map((o) => ({ key: o.courseId as string, amount: o.amount }))
    )
    const byCourse = Array.from(ordersByCourse.entries())
      .map(([courseId, v]) => {
        const title = orders.find((o) => o.courseId === courseId)?.course?.title ?? 'Curso'
        return { courseId, title, purchases: v.count, revenue: Math.round(v.revenue * 100) / 100 }
      })
      .sort((a, b) => b.revenue - a.revenue)

    // Série diária dos últimos 14 dias
    const daily: { date: string; pageviews: number; purchases: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      daily.push({ date: dateKey(d), pageviews: 0, purchases: 0 })
    }
    const dailyIndex = new Map(daily.map((d) => [d.date, d]))
    for (const e of pageviewRows) {
      const k = dateKey(new Date(e.createdAt))
      const row = dailyIndex.get(k)
      if (row) row.pageviews += 1
    }
    for (const o of orders) {
      const k = dateKey(new Date(o.createdAt))
      const row = dailyIndex.get(k)
      if (row) row.purchases += 1
    }

    return NextResponse.json({
      totals: { pageviews, viewItems, checkouts, purchases, revenue, conversionRate },
      byChannel,
      bySource,
      byCourse,
      daily,
    })
  } catch (err) {
    console.error('GET /api/track/stats', err)
    return NextResponse.json({ error: 'Erro ao carregar estatísticas.' }, { status: 500 })
  }
}
