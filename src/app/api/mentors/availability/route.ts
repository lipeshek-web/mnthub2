import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser, unauthorized } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** PUT /api/mentors/availability — substitui todas as disponibilidades do mentor da SESSÃO */
export async function PUT(req: NextRequest) {
  try {
    // Sessão em vez de userId do body — sem isso qualquer um bagunça a agenda
    // de outro mentor (o userId é público).
    const session = await resolveUser(req)
    if (!session) return unauthorized('Sessão expirada. Entre novamente para salvar a agenda.')
    const body = await req.json()
    const userId = session.id
    const slots: Array<{ weekday: number; startHour: number; endHour: number }> = Array.isArray(
      body?.slots
    )
      ? body.slots
      : []

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

    // Atômico: apagar e recriar no mesmo lote evita agenda vazia em falha parcial
    await db.$transaction([
      db.availability.deleteMany({ where: { mentorId: profile.id } }),
      ...(valid.length > 0
        ? [
            db.availability.createMany({
              data: valid.map((s) => ({
                mentorId: profile.id,
                weekday: s.weekday,
                startHour: s.startHour,
                endHour: s.endHour,
              })),
            }),
          ]
        : []),
    ])

    return NextResponse.json({ ok: true, count: valid.length })
  } catch (err) {
    console.error('PUT /api/mentors/availability', err)
    return NextResponse.json({ error: 'Erro ao salvar disponibilidades' }, { status: 500 })
  }
}
