import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/me?userId=... — valida a sessão persistida no cliente.
 * A identidade vem da SESSÃO (Authorization: Bearer, emitido no login) e o
 * userId da query só é aceito se for o próprio usuário — sem token válido a
 * rota responde { user: null } (o cliente trata como deslogado).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await resolveUser(req)
    if (!session) return NextResponse.json({ user: null })

    const userId = req.nextUrl.searchParams.get('userId')
    if (userId && userId !== session.id) {
      // Não pode consultar dados de outra pessoa
      return NextResponse.json({ user: null })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
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
