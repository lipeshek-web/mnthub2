import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { v1Error, v1Json } from '@/lib/api-v1'
import { parseNaive } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/mentors/[id]/slots?date=YYYY-MM-DD
 * Horários livres de 30 em 30 min para uma sessão de 60 min, cruzando a
 * disponibilidade semanal do mentor com as reservas ativas (PENDING/CONFIRMED).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const date = req.nextUrl.searchParams.get('date')?.trim() ?? ''
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return v1Error('Informe a data no formato YYYY-MM-DD.', 400)
    }

    const mentor = await db.mentorProfile.findFirst({ where: { id, isPublished: true } })
    if (!mentor) return v1Error('Mentor não encontrado.', 404)

    // Meio-dia evita deslocamento de fuso ao derivar o dia da semana
    const weekday = parseNaive(`${date}T12:00`).getDay()
    const availability = await db.availability.findMany({ where: { mentorId: id, weekday } })
    if (availability.length === 0) return v1Json({ slots: [] })

    const sessionHours = 60 / 60 // duração padrão da sessão (1h)
    const stepHours = 0.5 // slots de 30 min

    // Ocupações existentes do mentor no dia
    const bookings = await db.booking.findMany({
      where: { mentorId: id, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { startsWith: date } },
      select: { startsAt: true, durationMin: true },
    })
    const busy = bookings.map((b) => {
      const start = parseNaive(b.startsAt).getTime()
      return { start, end: start + b.durationMin * 60_000 }
    })

    // "Agora" naive local para filtrar horários passados no dia corrente
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const todayKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const isToday = date === todayKey

    const slots: string[] = []
    for (const window of availability) {
      for (let h = window.startHour; h + sessionHours <= window.endHour + 1e-9; h += stepHours) {
        const hour = Math.floor(h)
        const minute = Math.round((h - hour) * 60)
        if (isToday && hour * 60 + minute <= nowMinutes) continue

        const slotStart = parseNaive(`${date}T${pad(hour)}:${pad(minute)}`).getTime()
        const slotEnd = slotStart + 60 * 60_000
        const conflicts = busy.some((b) => slotStart < b.end && b.start < slotEnd)
        if (conflicts) continue

        const label = `${pad(hour)}:${pad(minute)}`
        if (!slots.includes(label)) slots.push(label)
      }
    }

    return v1Json({ slots: slots.sort() })
  } catch (err) {
    console.error('GET /api/v1/mentors/[id]/slots', err)
    return v1Error('Erro ao calcular horários.', 500)
  }
}
