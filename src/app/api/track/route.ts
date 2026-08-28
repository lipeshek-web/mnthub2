import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EVENT_NAMES = ['page_view', 'view_item', 'begin_checkout', 'purchase', 'lead']

/** POST /api/track — registra evento de rastreamento com atribuição de tráfego */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name ?? '')
    if (!EVENT_NAMES.includes(name)) {
      return NextResponse.json({ error: 'Evento inválido.' }, { status: 400 })
    }

    const mentorId = body?.mentorId ? String(body.mentorId) : null
    const courseId = body?.courseId ? String(body.courseId) : null
    const userId = body?.userId ? String(body.userId) : null

    const value = Number(body?.value ?? 0)
    const valueCents = Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null

    const attr = (body?.attribution ?? {}) as Record<string, unknown>
    const s = (v: unknown, max = 190) => {
      const str = String(v ?? '').trim()
      return str ? str.slice(0, max) : null
    }

    const event = await db.trackingEvent.create({
      data: {
        name,
        mentorId: mentorId || null,
        courseId: courseId || null,
        userId: userId || null,
        valueCents,
        utmSource: s(attr.utmSource),
        utmMedium: s(attr.utmMedium),
        utmCampaign: s(attr.utmCampaign, 120),
        utmContent: s(attr.utmContent, 120),
        utmTerm: s(attr.utmTerm, 120),
        gclid: s(attr.gclid, 190),
        fbclid: s(attr.fbclid, 190),
        channel: s(attr.channel, 40) || 'direct',
        path: s(body?.path, 300),
      },
    })

    return NextResponse.json({ ok: true, id: event.id })
  } catch (err) {
    console.error('POST /api/track', err)
    return NextResponse.json({ error: 'Erro ao registrar evento.' }, { status: 500 })
  }
}
