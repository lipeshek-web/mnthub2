import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  bio: true,
  avatarUrl: true,
  passwordHash: true,
  mentorProfile: { select: { id: true } },
} as const

/** POST /api/auth/login — autentica com e-mail + senha */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Informe e-mail e senha.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email }, select: USER_SELECT })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    const { passwordHash: _ignored, ...rest } = user
    return NextResponse.json({ ...rest, isMentor: Boolean(user.mentorProfile) })
  } catch (err) {
    console.error('POST /api/auth/login', err)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
