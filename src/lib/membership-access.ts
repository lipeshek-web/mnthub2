import { db } from '@/lib/db'
import { notify } from '@/lib/notify'

// ==================== ACESSO POR ASSINATURA (ciclo pago) ====================
// Regra central do Sprint 2: a assinatura dá acesso enquanto o ciclo pago
// vigia — `renewsAt > agora` — independente de ACTIVE ou CANCELLED (cancelar
// mantém acesso até o fim do que já foi pago). Quando `renewsAt` vence, a
// assinatura ACTIVE é encerrada (CANCELLED) e as matrículas que ela concedia
// são revogadas — preservando cursos comprados por outros pedidos pagos.

/**
 * Encerra assinaturas cujo ciclo pago venceu (ACTIVE + renewsAt <= agora) e
 * revoga as matrículas concedidas por elas (idempotente: chamar nos leitores
 * de assinatura — GET /api/memberships, [id] e no checkout).
 * Retorna quantas assinaturas expiraram nesta chamada.
 */
export async function expireDueSubscriptions(): Promise<number> {
  const now = new Date()
  const due = await db.membershipSubscription.findMany({
    where: { status: 'ACTIVE', renewsAt: { lte: now } },
    select: { id: true, userId: true, mentorId: true, membershipId: true, renewsAt: true, membership: { select: { title: true } } },
  })
  if (due.length === 0) return 0

  for (const sub of due) {
    // Transição condicional: duas chamadas simultâneas não revogam 2x
    const claim = await db.membershipSubscription.updateMany({
      where: { id: sub.id, status: 'ACTIVE' },
      data: { status: 'CANCELLED', cancelledAt: now },
    })
    if (claim.count === 0) continue
    await revokeMembershipEnrollments(sub.userId, sub.mentorId)
    await notify({
      userId: sub.userId,
      kind: 'membership_expired',
      title: `Assinatura "${sub.membership.title}" expirou`,
      body: 'O ciclo pago terminou. Renove o plano para continuar com acesso a todos os cursos do mentor.',
      linkView: 'dashboard',
      refId: sub.membershipId ?? undefined,
    }).catch(() => {})
  }
  return due.length
}

/**
 * O usuário tem acesso válido por assinatura a um mentor NESTE momento?
 * (ciclo pago vigente — ACTIVE ou cancelada que ainda não venceu)
 */
export async function hasMembershipAccess(mentorId: string, userId: string): Promise<boolean> {
  const sub = await db.membershipSubscription.findFirst({
    where: { mentorId, userId, renewsAt: { gt: new Date() } },
    select: { id: true },
  })
  return Boolean(sub)
}

/**
 * Cursos do mentor que o usuário tem pago por OUTRO pedido (compra direta,
 * trilha, pacote) ou por assinatura com ciclo vigente — estes NÃO podem ser
 * revogados quando a assinatura/pedido atual é estornado/expirado.
 */
export async function protectedCourseIds(userId: string, mentorId: string, excludeOrderId?: string): Promise<Set<string>> {
  const set = new Set<string>()

  const orders = await db.order.findMany({
    where: {
      studentId: userId,
      status: 'PAID',
      id: excludeOrderId ? { not: excludeOrderId } : undefined,
      OR: [{ courseId: { not: null } }, { trackId: { not: null } }, { bundleId: { not: null } }],
    },
    select: {
      courseId: true,
      track: { select: { items: { select: { courseId: true } } } },
      bundle: { select: { items: { select: { courseId: true } } } },
    },
  })
  for (const o of orders) {
    if (o.courseId) set.add(o.courseId)
    for (const item of o.track?.items ?? []) if (item.courseId) set.add(item.courseId)
    for (const item of o.bundle?.items ?? []) set.add(item.courseId)
  }

  // Assinaturas com ciclo vigente cobrem todos os cursos do mentor
  const subs = await db.membershipSubscription.findMany({
    where: { userId, mentorId, renewsAt: { gt: new Date() } },
    select: { id: true },
  })
  if (subs.length > 0) {
    const courses = await db.course.findMany({ where: { mentorId }, select: { id: true } })
    for (const c of courses) set.add(c.id)
  }

  return set
}

/**
 * Revoga as matrículas concedidas por uma assinatura/expiração: remove as
 * matrículas nos cursos do mentor que NÃO estão protegidos por outra compra.
 * Nunca apaga progresso de curso pago separadamente.
 */
export async function revokeMembershipEnrollments(userId: string, mentorId: string): Promise<number> {
  const protected_ = await protectedCourseIds(userId, mentorId)
  const mentorCourses = await db.course.findMany({
    where: { mentorId },
    select: { id: true },
  })
  const toRevoke = mentorCourses.map((c) => c.id).filter((id) => !protected_.has(id))
  if (toRevoke.length === 0) return 0
  const res = await db.enrollment.deleteMany({
    where: { studentId: userId, courseId: { in: toRevoke } },
  })
  return res.count
}
