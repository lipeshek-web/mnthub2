import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { activeStreak, studyDay } from '@/lib/xp'

export const dynamic = 'force-dynamic'

/** GET /api/xp?userId= — XP, ofensiva atual e recorde do usuário */
export async function GET(req: NextRequest) {
  try {
    const userId = (req.nextUrl.searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { xp: true, studyStreak: true, longestStreak: true, lastStudyDate: true },
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    return NextResponse.json({
      xp: user.xp,
      streak: activeStreak(user.studyStreak, user.lastStudyDate),
      longestStreak: Math.max(user.longestStreak, activeStreak(user.studyStreak, user.lastStudyDate)),
      lastStudyDate: user.lastStudyDate,
      today: studyDay(),
    })
  } catch (err) {
    console.error('GET /api/xp', err)
    return NextResponse.json({ error: 'Erro ao carregar progresso.' }, { status: 500 })
  }
}
