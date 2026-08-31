import { db } from '@/lib/db'
import { notify } from '@/lib/notify'

// ==================== CONCLUSÃO DE PEDIDOS ====================
// Único caminho que transforma um pedido pago em acesso liberado:
// matrículas, assinatura, consumo de cupom/créditos, notificações e recompensa
// de indicação. Usado por: webhook do Asaas, confirmação manual do admin e
// modo demonstração (sem gateway). Idempotente por design.

/** Crédito do indicador por conversão (R$ 20 em centavos) */
export const REFERRAL_REWARD_CENTS = 2000

/** Validação de cupons (mentor + plataforma) vive em lib/coupons.ts — reexportado */
export { resolveCoupon } from '@/lib/coupons'

/**
 * Recompensa a indicação pendente do comprador: 1ª compra paga libera
 * R$ 20 em créditos para quem convidou (PENDING → REWARDED).
 * Falha silenciosamente — nunca deve quebrar o checkout.
 */
export async function rewardPendingReferral(buyerId: string, buyerName: string) {
  try {
    const referral = await db.referral.findFirst({
      where: { referredId: buyerId, status: 'PENDING' },
      include: { referrer: { select: { id: true, name: true } } },
    })
    if (!referral) return

    await db.$transaction([
      db.referral.update({
        where: { id: referral.id },
        data: { status: 'REWARDED', rewardedAt: new Date() },
      }),
      db.user.update({
        where: { id: referral.referrerId },
        data: { creditCents: { increment: REFERRAL_REWARD_CENTS } },
      }),
    ])

    await notify({
      userId: referral.referrerId,
      kind: 'referral_rewarded',
      title: `Ganhou R$ 20,00 com sua indicação 💰`,
      body: `${buyerName} concluiu a primeira compra. O crédito já está no seu saldo!`,
      linkView: 'referrals',
    })
  } catch (err) {
    console.error('rewardPendingReferral falhou (silencioso)', err)
  }
}

export interface FulfillResult {
  ok: boolean
  alreadyFulfilled: boolean
  orderStatus: string
}

/**
 * Executa a liberação de acesso de um pedido pago (idempotente).
 * Chamado quando o dinheiro realmente caiu (gateway confirmou) — ou no modo
 * demonstração, na hora do checkout.
 */
export async function fulfillOrder(orderId: string): Promise<FulfillResult> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      student: { select: { id: true, name: true, creditCents: true } },
      mentor: { include: { user: { select: { id: true, name: true } } } },
      course: { select: { id: true, title: true } },
      track: {
        select: {
          id: true,
          title: true,
          items: { where: { type: 'COURSE' }, select: { courseId: true } },
        },
      },
      bundle: { select: { id: true, title: true, items: { select: { courseId: true } } } },
      membership: { select: { id: true, title: true, mentorId: true, price: true } },
      payments: { select: { id: true, status: true, gateway: true } },
    },
  })
  if (!order) return { ok: false, alreadyFulfilled: false, orderStatus: 'NOT_FOUND' }

  // Idempotência ATÔMICA: só quem conseguir a transição PENDING→PAID (condi-
  // cional) executa a liberação. Webhook duplicado / duplo checkout / duas
  // rotas simultâneas caem no updateMany count === 0 e retornam cedo — sem
  // dobrar débito de créditos, uso de cupom ou notificações.
  const claim = await db.order.updateMany({
    where: { id: order.id, status: { notIn: ['PAID', 'REFUNDED', 'CANCELED'] } },
    data: { status: 'PAID' },
  })
  if (claim.count === 0) {
    const fresh = await db.order.findUnique({ where: { id: order.id }, select: { status: true } })
    const st = fresh?.status ?? order.status
    if (st === 'PAID') return { ok: true, alreadyFulfilled: true, orderStatus: 'PAID' }
    return { ok: false, alreadyFulfilled: false, orderStatus: st }
  }

  const userId = order.studentId
  const studentName = order.student.name
  const paidNow = new Date()

  // ---------- Liberação por tipo de item ----------
  if (order.membershipId && order.membership) {
    const membership = order.membership
    const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.membershipSubscription.upsert({
      where: { membershipId_userId: { membershipId: membership.id, userId } },
      create: { membershipId: membership.id, userId, mentorId: membership.mentorId, status: 'ACTIVE', renewsAt },
      update: { status: 'ACTIVE', startedAt: paidNow, renewsAt, cancelledAt: null },
    })
    // Matricula em TODOS os cursos publicados do mentor (acesso imediato)
    const courses = await db.course.findMany({
      where: { mentorId: membership.mentorId, isPublished: true },
      select: { id: true },
    })
    for (const c of courses) {
      await db.enrollment.upsert({
        where: { courseId_studentId: { courseId: c.id, studentId: userId } },
        create: { courseId: c.id, studentId: userId, completedLessonIds: '[]' },
        update: {},
      })
    }
  } else if (order.bundleId && order.bundle) {
    for (const item of order.bundle.items) {
      await db.enrollment.upsert({
        where: { courseId_studentId: { courseId: item.courseId, studentId: userId } },
        create: { courseId: item.courseId, studentId: userId, completedLessonIds: '[]' },
        update: {},
      })
    }
  } else if (order.trackId && order.track) {
    await db.trackEnrollment.upsert({
      where: { trackId_studentId: { trackId: order.trackId, studentId: userId } },
      create: { trackId: order.trackId, studentId: userId },
      update: {},
    })
    for (const item of order.track.items) {
      if (!item.courseId) continue
      await db.enrollment.upsert({
        where: { courseId_studentId: { courseId: item.courseId, studentId: userId } },
        create: { courseId: item.courseId, studentId: userId, completedLessonIds: '[]' },
        update: {},
      })
    }
  } else if (order.courseId) {
    await db.enrollment.upsert({
      where: { courseId_studentId: { courseId: order.courseId, studentId: userId } },
      create: { courseId: order.courseId, studentId: userId, completedLessonIds: '[]' },
      update: {},
    })
  }

  // ---------- Consome cupom + créditos e marca a cobrança como paga ----------
  await db.$transaction(async (tx) => {
    // Cupom: revalida (pode ter esgotado entre a criação e o pagamento);
    // esgotado/desativado não cancela o pedido — apenas não incrementa.
    // CUPOM DE MENTOR tem mentorId; CUPOM DA PLATAFORMA (site-wide, novas
    // contas, categoria) tem mentorId null — antes o incremento nunca achava
    // os da plataforma e maxUses ficava sem efeito.
    if (order.couponCode) {
      const coupon =
        (await tx.coupon.findUnique({
          where: { mentorId_code: { mentorId: order.mentorId, code: order.couponCode } },
        })) ??
        (await tx.coupon.findFirst({
          where: { mentorId: null, code: order.couponCode },
        }))
      if (coupon && coupon.isActive) {
        const notExpired = !coupon.expiresAt || coupon.expiresAt.getTime() > Date.now()
        const hasUses = coupon.maxUses === null || coupon.uses < coupon.maxUses
        if (notExpired && hasUses) {
          await tx.coupon.update({ where: { id: coupon.id }, data: { uses: { increment: 1 } } })
        }
      }
    }
    // Créditos de indicação usados no pedido
    if (order.creditsUsed > 0) {
      const debitCents = Math.round(order.creditsUsed * 100)
      const fresh = await tx.user.findUnique({
        where: { id: userId },
        select: { creditCents: true },
      })
      const balance = fresh?.creditCents ?? 0
      await tx.user.update({
        where: { id: userId },
        data: { creditCents: Math.max(0, balance - debitCents) },
      })
    }
    // Marca a cobrança como paga
    const payment = order.payments[0]
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'RECEIVED',
          confirmedAt: paidNow,
          lastEvent: payment.gateway === 'ASAAS' ? 'PAYMENT_RECEIVED' : 'SIMULADO_PAGO',
          lastEventAt: paidNow,
        },
      })
    }
  })

  // ---------- Notificações ----------
  if (order.membershipId && order.membership) {
    const membership = order.membership
    await notify({
      userId: order.mentor.userId,
      kind: 'membership_new',
      title: `Nova assinatura: "${membership.title}" 💳`,
      body: `${studentName} assinou o plano mensal (R$ ${membership.price.toFixed(2).replace('.', ',')}/mês).`,
      linkView: 'onboarding',
      refId: membership.id,
    })
    await notify({
      userId,
      kind: 'membership_subscribed',
      title: 'Assinatura ativada! 🎉',
      body: `Todos os cursos de ${order.mentor.user.name} foram liberados, mais a sessão em grupo mensal.`,
      linkView: 'dashboard',
      refId: membership.id,
    })
  } else if (order.bundleId && order.bundle) {
    await notify({
      userId: order.mentor.userId,
      kind: 'purchase_new',
      title: `Nova venda: pacote "${order.bundle.title}" 🤑`,
      body: `${studentName} comprou o pacote com ${order.bundle.items.length} cursos.`,
      linkView: 'onboarding',
      refId: order.bundle.id,
    })
  } else if (order.trackId && order.track) {
    await notify({
      userId: order.mentor.userId,
      kind: 'purchase_new',
      title: `Nova venda: "${order.track.title}" 🤑`,
      body: `${studentName} comprou a trilha${order.couponCode ? ` (cupom ${order.couponCode})` : ''}.`,
      linkView: 'onboarding',
      refId: order.track.id,
    })
  } else if (order.course) {
    await notify({
      userId: order.mentor.userId,
      kind: 'purchase_new',
      title: `Nova venda: "${order.course.title}" 🤑`,
      body: `${studentName} comprou o curso${order.couponCode ? ` (cupom ${order.couponCode})` : ''}.`,
      linkView: 'onboarding',
      refId: order.course.id,
    })
  }

  // ---------- Indicação: 1ª compra paga recompensa quem convidou ----------
  await rewardPendingReferral(userId, studentName)

  return { ok: true, alreadyFulfilled: false, orderStatus: 'PAID' }
}
