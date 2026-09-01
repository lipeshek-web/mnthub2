import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import { signMobileToken, publicMobileUser } from '@/lib/mobile-auth'
import { activeStreak } from '@/lib/xp'
import { absolutize, getOrigin, v1Error, v1Json } from '@/lib/api-v1'

export const dynamic = 'force-dynamic'

/** POST /api/v1/auth/login — autentica o aluno e devolve um JWT Bearer (30 dias) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return v1Error('Informe e-mail e senha.', 400)
    }

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
        xp: true,
        studyStreak: true,
        longestStreak: true,
        lastStudyDate: true,
        role: true,
        blocked: true,
        passwordHash: true,
        mfaEnabled: true,
        mentorProfile: { select: { id: true } },
      },
    })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return v1Error('E-mail ou senha incorretos.', 401)
    }
    if (user.blocked) {
      return v1Error('Esta conta está bloqueada. Fale com o suporte.', 403)
    }
    // v1 mobile não implementa o desafio TOTP — contas com 2FA precisam do site
    if (user.mfaEnabled) {
      return v1Error(
        'Esta conta usa verificação em duas etapas. Faça login pelo site do MentorHub.',
        403
      )
    }

    const token = signMobileToken(user.id)
    const publicUser = publicMobileUser({
      ...user,
      activeStreak: activeStreak(user.studyStreak, user.lastStudyDate),
    })

    return v1Json({ token, user: { ...publicUser, avatarUrl: absolutize(publicUser.avatarUrl, getOrigin(req)) } })
  } catch (err) {
    console.error('POST /api/v1/auth/login', err)
    return v1Error('Erro ao fazer login.', 500)
  }
}
