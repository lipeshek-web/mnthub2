import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { protectedCourseIds, revokeMembershipEnrollments } from './membership-access'

// ==================== REEMBOLSO (estorno) ====================
// Único caminho que estorna um pedido PAGO e revoga o acesso concedido.
// Usado por: webhook do Asaas (PAYMENT_REFUNDED), decisão do admin no painel
// e cancelamento de sessão 1:1 paga. Idempotente por design: só quem conseguir
// a transição condicional PAID → REFUNDED executa a revogação — reenvios do
// webhook ou cliques duplicados no admin não revogam 2x.

export interface RefundResult {
  ok: boolean
  error?: 'NOT_FOUND' | 'NOT_PAID' | 'ALREADY_REFUNDED'
  orderStatus?: string
}

/**
 * Estorna o pedido e desfaz o que a liberação concedeu:
 * - COURSE/TRACK/BUNDLE: remove matrículas NÃO protegidas por outra compra paga
 *   ou por assinatura com ciclo vigente (progresso de curso pago à parte nunca é apagado)
 * - MEMBERSHIP: encerra a assinatura imediatamente (renewsAt = agora) e revoga
 *   as matrículas concedidas
 * - SESSION (1:1): cancela a sessão (se ainda não aconteceu) e avisa as partes
 * - Devolve créditos de indicação usados no pedido
 * Observação: usos de cupom não são devolvidos (best-effort do ciclo anterior).
 */
export async function refundOrder(orderId: string, opts: { viaGateway?: boolean } = {}): Promise<RefundResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      student: { select: { id: true, name: true, creditCents: true } },
      course: { select: { id: true, title: true } },
      track: { select: { id: true, title: true, items: { select: { courseId: true } } } },
      bundle: { select: { id: true, title: true, items: { select: { courseId: true } } } },
      membership: { select: { id: true, title: true } },
      booking: {
        select: {
          id: true,
          status: true,
          topic: true,
          startsAt: true,
          mentorId: true,
          mentor: { select: { userId: true, user: { select: { name: true } } } },
        },
      },
    },
  })
  if (!order) return { ok: false, error: 'NOT_FOUND' }
  if (order.status !== 'PAID') {
    return {
      ok: false,
      error: order.status === 'REFUNDED' ? 'ALREADY_REFUNDED' : 'NOT_PAID',
      orderStatus: order.status,
    }
  }

  // Claim atômico: apenas um chamador executa a revogação
  const claim = await db.order.updateMany({
    where: { id: order.id, status: 'PAID' },
    data: { status: 'REFUNDED' },
  })
  if (claim.count === 0) return { ok: false, error: 'ALREADY_REFUNDED' }

  const userId = order.studentId
  const studentName = order.student.name

  // ---------- Revogação por tipo de item ----------
  if (order.membershipId && order.membership) {
    // Encerra a assinatura imediatamente: o dinheiro voltou, o ciclo acaba agora
    await db.membershipSubscription.updateMany({
      where: { membershipId: order.membershipId, userId, renewsAt: { gt: new Date() } },
      data: { status: 'CANCELLED', cancelledAt: new Date(), renewsAt: new Date() },
    })
    // Revoga as matrículas concedidas pelo plano (cursos comprados à parte são preservados)
    await revokeMembershipEnrollments(userId, order.mentorId)
  } else if (order.courseId && order.course) {
    await deleteIfUnprotected(userId, [order.courseId], order.id)
  } else if (order.trackId && order.track) {
    const otherPaidTrack = await db.order.count({
      where: { trackId: order.trackId, studentId: userId, status: 'PAID', id: { not: order.id } },
    })
    if (otherPaidTrack === 0) {
      await db.trackEnrollment.deleteMany({ where: { trackId: order.trackId, studentId: userId } })
    }
    await deleteIfUnprotected(
      userId,
      order.track.items.map((i) => i.courseId).filter((id): id is string => Boolean(id)),
      order.id
    )
  } else if (order.bundleId && order.bundle) {
    await deleteIfUnprotected(
      userId,
      order.bundle.items.map((i) => i.courseId),
      order.id
    )
  } else if (order.bookingId && order.booking) {
    // Sessão 1:1 estornada: cancela (se ainda não aconteceu) e avisa o mentor
    if (order.booking.status === 'PENDING' || order.booking.status === 'CONFIRMED') {
      await db.booking.update({ where: { id: order.booking.id }, data: { status: 'CANCELLED' } })
    }
    await notify({
      userId: order.booking.mentor.userId,
      kind: 'booking_cancelled',
      title: `Sessão estornada — ${studentName}`,
      body: `O pagamento da sessão "${order.booking.topic}" foi reembolsado e a sessão cancelada.`,
      linkView: 'dashboard',
      refId: order.booking.id,
    })
  }

  // ---------- Devolve créditos de indicação usados ----------
  if (order.creditsUsed > 0) {
    const cents = Math.round(order.creditsUsed * 100)
    await db.user
      .update({ where: { id: userId }, data: { creditCents: { increment: cents } } })
      .catch((err) => console.error('refundOrder: devolução de créditos falhou', err))
  }

  // ---------- Notifica o aluno ----------
  const itemTitle =
    order.course?.title ??
    order.track?.title ??
    order.bundle?.title ??
    order.membership?.title ??
    (order.booking ? `Sessão "${order.booking.topic}"` : 'Pedido')
  await notify({
    userId,
    kind: 'refund_approved',
    title: 'Reembolso confirmado 💸',
    body: `O pedido de "${itemTitle}" foi estornado e o acesso correspondente removido.${order.creditsUsed > 0 ? ' Seus créditos de indicação foram devolvidos.' : ''}`,
    linkView: 'dashboard',
    refId: order.id,
  })

  return { ok: true, orderStatus: 'REFUNDED' }
}

/** Deleta matrículas dos cursos informados que não estão protegidas por outra compra paga */
async function deleteIfUnprotected(userId: string, courseIds: string[], excludeOrderId: string): Promise<void> {
  if (courseIds.length === 0) return
  const mentorId = (await db.course.findFirst({ where: { id: courseIds[0] }, select: { mentorId: true } }))?.mentorId
  const protected_ = await protectedCourseIds(userId, mentorId ?? '', excludeOrderId)
  const toRevoke = courseIds.filter((id) => !protected_.has(id))
  if (toRevoke.length === 0) return
  await db.enrollment.deleteMany({ where: { studentId: userId, courseId: { in: toRevoke } } })
}
