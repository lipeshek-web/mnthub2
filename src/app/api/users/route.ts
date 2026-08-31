import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users — legado. Era uma lista pública com o e-mail de TODOS os
 * usuários (vazamento). Agora exige token de administrador (x-admin-token);
 * o seletor de contas demo da tela de login usa /api/auth/demo-accounts.
 */
export async function GET(req: NextRequest) {
  const admin = await resolveAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito à administração.' }, { status: 403 })
  }
  try {
    const users = await db.user.findMany({
      orderBy: { name: 'asc' },
      take: 200,
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    })
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/users', err)
    return NextResponse.json({ error: 'Erro ao listar usuários' }, { status: 500 })
  }
}

/**
 * POST /api/users — legado (criava conta SEM senha, inutilizável e fora do
 * fluxo de indicação). Exige admin; cadastro real continua em /api/auth/register.
 */
export async function POST(req: NextRequest) {
  const admin = await resolveAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Acesso restrito à administração.' }, { status: 403 })
  }
  try {
    const body = await req.json()
    const name = String(body?.name ?? '').trim().slice(0, 80)
    const email = String(body?.email ?? '').trim().toLowerCase()
    if (!name || !email || !email.includes('@')) {
      return NextResponse.json({ error: 'Informe nome e e-mail válidos.' }, { status: 400 })
    }
    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Já existe um usuário com este e-mail.' }, { status: 409 })
    }
    const user = await db.user.create({
      data: { name, email, bio: body?.bio ? String(body.bio).slice(0, 280) : null },
      select: { id: true, name: true, email: true, bio: true, avatarUrl: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (err) {
    console.error('POST /api/users', err)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
