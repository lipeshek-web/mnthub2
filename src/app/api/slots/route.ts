import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * GET /api/slots?mentorId=&date=YYYY-MM-DD
 * Retorna horários livres (sessões de 60 min, em ponto) para o dia informado.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const mentorId = sp.get('mentorId') || ''
    const date = sp.get('date') || ''

    if (!mentorId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const [y, m, d] = date.split('-').map(Number)
    const weekday = new Date(y, m - 1, d).getDay()

    const availabilities = await db.availability.findMany({ where: { mentorId, weekday } })
    const booked = await db.booking.findMany({
      where: {
        mentorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startsAt: { gte: `${date}T00:00`, lte: `${date}T23:59` },
      },
      select: { startsAt: true },
    })
    const bookedTimes = new Set(booked.map((b) => b.startsAt))

    const slots: string[] = []
    for (const a of availabilities) {
      for (let h = Math.ceil(a.startHour); h + 1 <= a.endHour; h++) {
        if (h < 0 || h > 23) continue
        const startsAt = `${date}T${pad(h)}:00`
        if (!bookedTimes.has(startsAt) && !slots.includes(startsAt)) {
          slots.push(startsAt)
        }
      }
    }
    slots.sort()

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('GET /api/slots', err)
    return NextResponse.json({ error: 'Erro ao buscar horários' }, { status: 500 })
  }
}
