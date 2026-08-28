import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const users = await db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/users', err)
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '').trim().toLowerCase()
    if (!name || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe nome e e-mail válidos.' }, { status: 400 })
    }
    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail.' }, { status: 409 })
    }
    const user = await db.user.create({
      data: { name, email, bio: body?.bio ? String(body.bio) : null },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('POST /api/users', err)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
