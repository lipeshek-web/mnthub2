import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'

export const dynamic = 'force-dynamic'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  bio: true,
  avatarUrl: true,
  mentorProfile: { select: { id: true } },
} as const

/** POST /api/auth/register — cria conta (nome, e-mail, senha) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Informe seu nome completo.' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este e-mail. Faça login.' },
        { status: 409 }
      )
    }

    const user = await db.user.create({
      data: { name, email, passwordHash: hashPassword(password) },
      select: USER_SELECT,
    })

    return NextResponse.json(
      { ...user, isMentor: Boolean(user.mentorProfile) },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/auth/register', err)
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
  }
}
