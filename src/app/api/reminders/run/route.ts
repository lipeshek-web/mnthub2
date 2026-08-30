import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { addDays, dateKey, parseNaive } from '@/lib/helpers'

export const dynamic = 'force-dynamic'

/**
 * #7 Lembretes automáticos (idempotente — seguro chamar a cada boot do app).
 *
 * POST /api/reminders/run
 * body: { userId }
 * → ReminderRunDTO { created: number, kinds: string[] }
 *
 * Regras executadas na mesma chamada, cada uma isolada por try/catch:
 *  1. welcome            — 1ª visita (0 notificações e 0 matrículas)
 *  2. session_reminder   — sessões (PENDING/CONFIRMED) começando nas próximas 24h
 *  3. streak_risk        — ofensiva ativa que será perdida se não estudar hoje
 *  4. inactive_reminder  — com matrícula, inativo há mais de 7 dias (1x/dia)
 *
 * Dedupe universal: antes de criar, verifica (userId, kind, refId) existente.
 */

/** O union de kinds de notify() é fechado; os kinds de lembrete são novos e o banco
 * aceita qualquer string (Notification.kind: String). Cast controlado — lib/notify
 * permanece intocado. */
type NotifyKindArg = Parameters<typeof notify>[0]['kind']

/** Cria a notificação se ainda não existir (dedupe) — true quando criada. */
async function pushReminder(args: {
  userId: string
  kind: string
  title: string
  body: string
  refId: string
}): Promise<boolean> {
  const already = await db.notification.findFirst({
    where: { userId: args.userId, kind: args.kind, refId: args.refId },
  })
  if (already) return false
  await notify({
    userId: args.userId,
    kind: args.kind as NotifyKindArg,
    title: args.title,
    body: args.body,
    linkView: 'dashboard',
    refId: args.refId,
  })
  return true
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = String(body?.userId ?? '').trim()
    if (!userId) return NextResponse.json({ error: 'Usuário não informado.' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const kinds: string[] = []
    let created = 0
    const today = new Date()
    const todayKey = dateKey(today) // "YYYY-MM-DD" local
    const yesterdayKey = dateKey(addDays(today, -1))
    const p2 = (n: number) => String(n).padStart(2, '0')

    // ---------- 1) welcome: primeira visita ----------
    try {
      const [notifCount, enrollCount] = await Promise.all([
        db.notification.count({ where: { userId } }),
        db.enrollment.count({ where: { studentId: userId } }),
      ])
      if (notifCount === 0 && enrollCount === 0) {
        const isNew = await pushReminder({
          userId,
          kind: 'welcome',
          refId: 'welcome',
          title: 'Bem-vindo ao MentorHub! 🎉',
          body: 'Complete seu primeiro passo: explore cursos e conclua sua primeira aula hoje.',
        })
        if (isNew) {
          created += 1
          kinds.push('welcome')
        }
      }
    } catch (err) {
      console.error('reminders: welcome falhou (isolado)', err)
    }

    // ---------- 2) session_reminder: sessões nas próximas 24h ----------
    try {
      const profile = await db.mentorProfile.findUnique({ where: { userId } })
      const windowStart = new Date()
      const windowEnd = addDays(new Date(), 1) // agora + 24h
      const bookings = await db.booking.findMany({
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] },
          OR: [{ menteeId: userId }, ...(profile ? [{ mentorId: profile.id }] : [])],
        },
        include: {
          mentee: { select: { name: true } },
          mentor: { select: { user: { select: { name: true } } } },
        },
        orderBy: { startsAt: 'asc' },
      })
      for (const b of bookings) {
        const start = parseNaive(b.startsAt) // naive "YYYY-MM-DDTHH:mm" → Date local
        if (start < windowStart || start > windowEnd) continue
        const asMentor = profile ? b.mentorId === profile.id : false
        const otherName = asMentor ? b.mentee.name : b.mentor.user.name
        const when = `${p2(start.getDate())}/${p2(start.getMonth() + 1)} às ${p2(start.getHours())}:${p2(start.getMinutes())}`
        const isNew = await pushReminder({
          userId,
          kind: 'session_reminder',
          refId: b.id, // 1 lembrete por sessão
          title: `Sessão amanhã: ${b.topic} ⏰`,
          body: `${when} com ${otherName}. Prepare suas dúvidas!`,
        })
        if (isNew) {
          created += 1
          kinds.push('session_reminder')
        }
      }
    } catch (err) {
      console.error('reminders: session_reminder falhou (isolado)', err)
    }

    // ---------- 3) streak_risk: ofensiva em risco (estudou ontem, não hoje) ----------
    try {
      if (user.studyStreak > 0 && user.lastStudyDate === yesterdayKey) {
        const isNew = await pushReminder({
          userId,
          kind: 'streak_risk',
          refId: `streak:${todayKey}`, // no máximo 1x por dia
          title: `Sua ofensiva de ${user.studyStreak} dias está em risco 🔥`,
          body: 'Conclua 1 aula hoje para manter a sequência!',
        })
        if (isNew) {
          created += 1
          kinds.push('streak_risk')
        }
      }
    } catch (err) {
      console.error('reminders: streak_risk falhou (isolado)', err)
    }

    // ---------- 4) inactive_reminder: ≥1 matrícula e inativo há mais de 7 dias ----------
    try {
      const enrollCount = await db.enrollment.count({ where: { studentId: userId } })
      if (enrollCount > 0) {
        const [lastXp, lastEnrollment] = await Promise.all([
          db.xpEvent.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
          db.enrollment.findFirst({ where: { studentId: userId }, orderBy: { createdAt: 'desc' } }),
        ])
        const candidates: Date[] = []
        if (lastXp) candidates.push(lastXp.createdAt)
        if (lastEnrollment) candidates.push(lastEnrollment.createdAt)
        if (user.lastStudyDate) candidates.push(parseNaive(user.lastStudyDate))
        if (candidates.length > 0) {
          const lastActivity = candidates.reduce((acc, d) => (d.getTime() > acc.getTime() ? d : acc))
          const daysIdle = (Date.now() - lastActivity.getTime()) / 86_400_000
          if (daysIdle > 7) {
            const isNew = await pushReminder({
              userId,
              kind: 'inactive_reminder',
              refId: `inactive:${todayKey}`, // no máximo 1x por dia
              title: 'Sentimos sua falta! 💙',
              body: 'Faz mais de uma semana que você não estuda. Que tal retomar de onde parou?',
            })
            if (isNew) {
              created += 1
              kinds.push('inactive_reminder')
            }
          }
        }
      }
    } catch (err) {
      console.error('reminders: inactive_reminder falhou (isolado)', err)
    }

    return NextResponse.json({ created, kinds })
  } catch (err) {
    console.error('POST /api/reminders/run', err)
    return NextResponse.json({ error: 'Erro ao processar lembretes.' }, { status: 500 })
  }
}
