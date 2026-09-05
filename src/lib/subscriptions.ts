import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { brandedEmail, sendEmail } from '@/lib/email'

// ==================== CICLO DE VIDA DA ASSINATURA ====================
// renewsAt era apenas decorativo: assinante pagava 1 mês e tinha acesso
// para sempre. Este sweep marca como EXPIRED as assinaturas ACTIVE cujo
// ciclo pago terminou e revoga as matrículas concedidas pelo plano —
// preservando acesso conquistado por OUTRA via (compra direta do curso,
// pacote ou trilha paga).

/**
 * O usuário tem acesso INDEPENDENTE ao curso (não originado da assinatura)?
 * Regras:
 *  - pedido PAID do próprio curso
 *  - pedido PAID de pacote que contém o curso
 *  - pedido PAID de trilha que contém o curso
 *  - outra assinatura ACTIVE (renewsAt futuro) do mesmo mentor
 */
async function hasIndependentAccess(userId: string, courseId: string, mentorId: string): Promise<boolean> {
  const paidOrders = await db.order.findMany({
    where: { studentId: userId, status: 'PAID' },
    select: {
      courseId: true,
      bundle: { select: { items: { select: { courseId: true } } } },
      track: { select: { items: { where: { type: 'COURSE' }, select: { courseId: true } } } },
    },
  })
  const boughtDirect = paidOrders.some((o) => o.courseId === courseId)
  const boughtBundle = paidOrders.some((o) => o.bundle?.items.some((i) => i.courseId === courseId))
  const boughtTrack = paidOrders.some((o) => o.track?.items.some((i) => i.courseId === courseId))
  if (boughtDirect || boughtBundle || boughtTrack) return true

  const otherSub = await db.membershipSubscription.findFirst({
    where: {
      userId,
      mentorId,
      status: 'ACTIVE',
      renewsAt: { gt: new Date() },
    },
    select: { id: true },
  })
  return Boolean(otherSub)
}

/**
 * Expira assinaturas vencidas (status ACTIVE + renewsAt < agora).
 * Idempotente e incremental (lote de 50): seguro chamar em toda leitura de
 * memberships e no run de lembretes. Retorna quantas foram expiradas.
 */
export async function expireDueSubscriptions(): Promise<number> {
  const due = await db.membershipSubscription.findMany({
    where: { status: 'ACTIVE', renewsAt: { lt: new Date() } },
    take: 50,
    orderBy: { renewsAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      membership: { select: { id: true, title: true, mentorId: true } },
    },
  })
  if (due.length === 0) return 0

  let expired = 0
  for (const sub of due) {
    try {
      // Marca EXPIRED de forma condicional (idempotência sob concorrência)
      const claim = await db.membershipSubscription.updateMany({
        where: { id: sub.id, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      })
      if (claim.count === 0) continue
      expired += 1

      // Revoga matrículas que só existiam por causa do plano
      const courses = await db.course.findMany({
        where: { mentorId: sub.mentorId, isPublished: true },
        select: { id: true },
      })
      for (const c of courses) {
        if (await hasIndependentAccess(sub.userId, c.id, sub.mentorId)) continue
        await db.enrollment.deleteMany({
          where: { courseId: c.id, studentId: sub.userId },
        })
      }

      await notify({
        userId: sub.userId,
        kind: 'membership_expired',
        title: `Assinatura "${sub.membership.title}" expirou`,
        body: 'Renove para manter acesso a todos os cursos do mentor. Seu progresso fica salvo.',
        linkView: 'dashboard',
        refId: sub.id,
      })
      // mentorId é denormalizado (sem relação direta) — busca o user do mentor
      const mentorUser = await db.mentorProfile.findUnique({
        where: { id: sub.mentorId },
        select: { user: { select: { id: true } } },
      })
      if (mentorUser) {
        await notify({
          userId: mentorUser.user.id,
          kind: 'membership_expired',
          title: `Assinatura de ${sub.user.name} expirou`,
          body: `Plano "${sub.membership.title}" — ciclo vencido em ${sub.renewsAt.toLocaleDateString('pt-BR')}.`,
          linkView: 'dashboard',
          refId: sub.id,
        })
      }
      await sendEmail({
        to: sub.user.email,
        kind: 'membership_expired',
        subject: `Sua assinatura "${sub.membership.title}" expirou — Órbita`,
        html: brandedEmail({
          title: 'Assinatura expirada',
          lines: [
            `O ciclo do plano <strong>"${sub.membership.title}"</strong> terminou em ${sub.renewsAt.toLocaleDateString('pt-BR')}.`,
            'Seu progresso nos cursos continua salvo — renove para recuperar o acesso a todos os conteúdos.',
          ],
        }),
      })
    } catch (err) {
      console.error('expireDueSubscriptions: falha em uma assinatura (isolada)', err)
    }
  }
  return expired
}

/**
 * Renova/ativa a assinatura de um pedido pago (chamado pelo fulfillment).
 * Upsert com ciclo de 30 dias a partir de agora.
 */
export async function activateSubscription(membershipId: string, userId: string, mentorId: string) {
  const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await db.membershipSubscription.upsert({
    where: { membershipId_userId: { membershipId, userId } },
    create: { membershipId, userId, mentorId, status: 'ACTIVE', renewsAt },
    update: { status: 'ACTIVE', startedAt: new Date(), renewsAt, cancelledAt: null },
  })
}
