import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** GET /api/auth/me?userId=... — valida a sessão persistida no cliente */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ user: null })
    }
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        creditCents: true,
        role: true,
        blocked: true,
        mfaEnabled: true,
        mentorProfile: { select: { id: true } },
      },
    })
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({ user: { ...user, isMentor: Boolean(user.mentorProfile) } })
  } catch (err) {
    console.error('GET /api/auth/me', err)
    return NextResponse.json({ user: null })
  }
}
