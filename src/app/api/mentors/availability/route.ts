import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** PUT /api/mentors/availability — substitui todas as disponibilidades do mentor */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = String(body?.userId ?? '')
    const slots: Array<{ weekday: number; startHour: number; endHour: number }> = Array.isArray(
      body?.slots
    )
      ? body.slots
      : []

    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const profile = await db.mentorProfile.findUnique({ where: { userId } })
    if (!profile)
      return NextResponse.json({ error: 'Crie seu perfil de mentor primeiro.' }, { status: 400 })

    const valid = slots.filter(
      (s) =>
        Number.isInteger(s.weekday) &&
        s.weekday >= 0 &&
        s.weekday <= 6 &&
        Number.isFinite(s.startHour) &&
        Number.isFinite(s.endHour) &&
        s.endHour - s.startHour >= 1 &&
        s.startHour >= 0 &&
        s.endHour <= 24
    )

    await db.availability.deleteMany({ where: { mentorId: profile.id } })
    if (valid.length > 0) {
      await db.availability.createMany({
        data: valid.map((s) => ({
          mentorId: profile.id,
          weekday: s.weekday,
          startHour: s.startHour,
          endHour: s.endHour,
        })),
      })
    }

    return NextResponse.json({ ok: true, count: valid.length })
  } catch (err) {
    console.error('PUT /api/mentors/availability', err)
    return NextResponse.json({ error: 'Erro ao salvar disponibilidades' }, { status: 500 })
  }
}
