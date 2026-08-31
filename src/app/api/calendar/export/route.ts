import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseNaive } from '@/lib/helpers'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * #8 Exportar calendário (.ics) — montagem manual, sem bibliotecas.
 *
 * GET /api/calendar/export
 * → text/calendar (attachment; filename="mentorhub.ics")
 *
 * Eventos:
 *  a) Sessões 1:1 do usuário (como mentee OU como mentor via perfil), PENDING/CONFIRMED
 *  b) Aulas ao vivo (kind='LIVE') dos cursos em que o usuário está matriculado
 *
 * Datas: DATETIME FLOATING local (sem Z e sem TZID) derivado do naive
 * "YYYY-MM-DDTHH:mm" — respeita o modelo de datas sem timezone do MentorHub.
 */

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Date local → "YYYYMMDDTHHMMSS" (floating, sem timezone) */
function localToIcs(d: Date): string {
  return (
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  )
}

/** agora → "YYYYMMDDTHHMMSSZ" (DTSTAMP em UTC) */
function utcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Escape RFC 5545: backslash, ponto-e-vírgula, vírgula e quebras de linha */
function icsEscape(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

type IcsEvent = { start: string; lines: string[] }

export async function GET(req: NextRequest) {
  try {
    // Sessão — a agenda completa (sessões + aulas) de outro usuário era baixável
    // com o userId público via query (IDOR).
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para exportar.')
    const userId = session.id

    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const profile = await db.mentorProfile.findUnique({ where: { userId } })
    const dtstamp = utcStamp(new Date())
    const events: IcsEvent[] = []

    // ---------- a) Sessões 1:1 (mentee OU mentor) ----------
    const bookings = await db.booking.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [{ menteeId: userId }, ...(profile ? [{ mentorId: profile.id }] : [])],
      },
      include: {
        mentee: { select: { name: true } },
        mentor: { select: { user: { select: { name: true } } } },
      },
    })
    for (const b of bookings) {
      const start = parseNaive(b.startsAt)
      const end = new Date(start.getTime() + b.durationMin * 60_000)
      const asMentor = profile ? b.mentorId === profile.id : false
      const otherName = asMentor ? b.mentee.name : b.mentor.user.name
      events.push({
        start: localToIcs(start),
        lines: [
          'BEGIN:VEVENT',
          `UID:mh-${b.id}-booking@mentorhub`,
          `DTSTAMP:${dtstamp}`,
          `DTSTART:${localToIcs(start)}`,
          `DTEND:${localToIcs(end)}`,
          `SUMMARY:${icsEscape(`Mentoria: ${b.topic}`)}`,
          `LOCATION:${icsEscape(b.meetingRoom)}`,
          `DESCRIPTION:${icsEscape(`Sessão com ${otherName} — status: ${b.status}`)}`,
          'END:VEVENT',
        ],
      })
    }

    // ---------- b) Aulas ao vivo das matrículas ----------
    const enrollments = await db.enrollment.findMany({
      where: { studentId: userId },
      select: { courseId: true },
    })
    const courseIds = enrollments.map((e) => e.courseId)
    if (courseIds.length > 0) {
      const lessons = await db.lesson.findMany({
        where: { courseId: { in: courseIds }, kind: 'LIVE', startsAt: { not: null } },
        include: { course: { select: { title: true } } },
      })
      for (const lesson of lessons) {
        if (!lesson.startsAt) continue
        const start = parseNaive(lesson.startsAt)
        const end = new Date(start.getTime() + lesson.durationMin * 60_000)
        events.push({
          start: localToIcs(start),
          lines: [
            'BEGIN:VEVENT',
            `UID:mh-${lesson.id}-live@mentorhub`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${localToIcs(start)}`,
            `DTEND:${localToIcs(end)}`,
            `SUMMARY:${icsEscape(`Aula (ao vivo): ${lesson.title}`)}`,
            `LOCATION:${icsEscape(lesson.meetingUrl ?? '')}`,
            `DESCRIPTION:${icsEscape(lesson.course.title)}`,
            'END:VEVENT',
          ],
        })
      }
    }

    // Ordena por data crescente e limita a 300 eventos
    events.sort((a, b) => a.start.localeCompare(b.start))
    const selected = events.slice(0, 300)

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MentorHub//PT-BR',
      'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:MentorHub',
      ...selected.flatMap((e) => e.lines),
      'END:VCALENDAR',
    ]
    const ics = lines.join('\r\n') + '\r\n'

    return new Response(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mentorhub.ics"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('GET /api/calendar/export', err)
    return NextResponse.json({ error: 'Erro ao exportar o calendário.' }, { status: 500 })
  }
}
