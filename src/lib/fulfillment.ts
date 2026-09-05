import { db } from '@/lib/db'
import { notify } from '@/lib/notify'
import { activateSubscription } from '@/lib/subscriptions'
import { brandedEmail, sendEmail } from '@/lib/email'

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
 * Pedido de R$ 0 (cupom 100% + créditos, gateway SIMULATED) NÃO conta como
 * compra — fecha a fraude de fazenda de contas que gerava código e "comprava"
 * grátis para imprimir recompensa.
 * Falha silenciosamente — nunca deve quebrar o checkout.
 */
export async function rewardPendingReferral(buyerId: string, buyerName: string, orderAmount = 0) {
  try {
    if (!(orderAmount > 0)) return
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
      student: { select: { id: true, name: true, email: true, creditCents: true } },
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
      booking: { select: { id: true, topic: true, status: true, startsAt: true, mentorId: true } },
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
    await activateSubscription(membership.id, userId, membership.mentorId)
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
  } else if (order.bookingId && order.booking) {
    // Sessão 1:1 paga: pagamento confirma a sessão (mesmo que o mentor ainda
    // não tenha aceito — dinheiro caiu, horário está reservado)
    await db.booking.update({
      where: { id: order.bookingId },
      data: { status: 'CONFIRMED' },
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
  } else if (order.booking) {
    const when = order.booking.startsAt.replace('T', ' às ')
    await notify({
      userId: order.mentor.userId,
      kind: 'booking_paid',
      title: `Sessão paga e confirmada: ${order.booking.topic} 💰`,
      body: `${studentName} pagou a sessão de ${when}.`,
      linkView: 'dashboard',
      refId: order.booking.id,
    })
    await notify({
      userId,
      kind: 'booking_paid',
      title: 'Pagamento confirmado! 🎉',
      body: `Sua sessão "${order.booking.topic}" está confirmada. Até ${when}!`,
      linkView: 'dashboard',
      refId: order.booking.id,
    })
  }

  // ---------- Indicação: 1ª compra paga (valor > 0) recompensa quem convidou ----------
  await rewardPendingReferral(userId, studentName, order.amount)

  // ---------- Recibo por e-mail (fila outbox; SMTP opcional) ----------
  const itemLabel = order.course?.title
    ? `Curso "${order.course.title}"`
    : order.track?.title
      ? `Trilha "${order.track.title}"`
      : order.bundle?.title
        ? `Pacote "${order.bundle.title}"`
        : order.membership?.title
          ? `Assinatura "${order.membership.title}"`
          : order.booking?.topic
            ? `Sessão 1:1 "${order.booking.topic}"`
            : 'Pedido'
  const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
  await sendEmail({
    to: order.student.email,
    kind: 'order_paid',
    subject: `Compra confirmada: ${itemLabel} — Órbita`,
    html: brandedEmail({
      title: 'Pagamento confirmado! 🎉',
      lines: [
        `<strong>${itemLabel}</strong> já está liberado na sua conta.`,
        `Valor pago: <strong>${brl(order.amount)}</strong>${order.creditsUsed > 0 ? ` (com ${brl(order.creditsUsed)} de créditos)` : ''}.`,
        'Bons estudos!',
      ],
      ...(appUrl ? { cta: { label: 'Acessar meus cursos', url: `${appUrl}/` } } : {}),
    }),
  })

  return { ok: true, alreadyFulfilled: false, orderStatus: 'PAID' }
}

// ==================== ESTORNO (REFUND) ====================

/**
 * O usuário tem acesso ao curso por uma via DIFERENTE do pedido estornado?
 * (pedido PAID direto/pacote/trilha que contenha o curso, ou assinatura
 * ACTIVE com ciclo futuro do mesmo mentor)
 */
async function hasOtherPaidAccess(userId: string, courseId: string, mentorId: string, excludeOrderId: string): Promise<boolean> {
  const paidOrders = await db.order.findMany({
    where: { studentId: userId, status: 'PAID', id: { not: excludeOrderId } },
    select: {
      courseId: true,
      bundle: { select: { items: { select: { courseId: true } } } },
      track: { select: { items: { where: { type: 'COURSE' }, select: { courseId: true } } } },
    },
  })
  if (
    paidOrders.some((o) => o.courseId === courseId) ||
    paidOrders.some((o) => o.bundle?.items.some((i) => i.courseId === courseId)) ||
    paidOrders.some((o) => o.track?.items.some((i) => i.courseId === courseId))
  ) {
    return true
  }
  const sub = await db.membershipSubscription.findFirst({
    where: { userId, mentorId, status: 'ACTIVE', renewsAt: { gt: new Date() } },
    select: { id: true },
  })
  return Boolean(sub)
}

/** Remove a matrícula do curso SE não houver outra via paga de acesso */
async function revokeEnrollmentIfNoOtherAccess(userId: string, courseId: string, mentorId: string, excludeOrderId: string) {
  if (await hasOtherPaidAccess(userId, courseId, mentorId, excludeOrderId)) return
  await db.enrollment.deleteMany({ where: { courseId, studentId: userId } })
}

export interface RevokeResult {
  ok: boolean
  alreadyRevoked: boolean
}

/**
 * Estorna um pedido PAGO: marca REFUNDED (transição condicional — idempotente),
 * devolve créditos usados, revoga o acesso concedido e notifica o aluno.
 * Seguro chamar múltiplas vezes (webhook + admin): só a 1ª executa.
 */
export async function revokeOrderAccess(orderId: string): Promise<RevokeResult> {
  // Claim atômico: só quem converte PAID→REFUNDED executa a revogação
  const claim = await db.order.updateMany({
    where: { id: orderId, status: 'PAID' },
    data: { status: 'REFUNDED' },
  })
  if (claim.count === 0) {
    const fresh = await db.order.findUnique({ where: { id: orderId }, select: { status: true } })
    return { ok: fresh?.status === 'REFUNDED', alreadyRevoked: fresh?.status === 'REFUNDED' }
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, mentorId: true } },
      track: {
        select: {
          id: true, title: true, mentorId: true,
          items: { where: { type: 'COURSE' }, select: { courseId: true } },
        },
      },
      bundle: { select: { id: true, title: true, mentorId: true, items: { select: { courseId: true } } } },
      membership: { select: { id: true, title: true, mentorId: true } },
      booking: { select: { id: true, topic: true } },
      payments: { select: { id: true } },
    },
  })
  if (!order) return { ok: false, alreadyRevoked: false }

  const userId = order.studentId

  try {
    // ---------- Revogação por tipo ----------
    if (order.membershipId && order.membership) {
      // Encerra a assinatura imediatamente (estorno = fim do ciclo)
      await db.membershipSubscription.updateMany({
        where: { membershipId: order.membershipId, userId, status: 'ACTIVE' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })
      const courses = await db.course.findMany({
        where: { mentorId: order.membership.mentorId, isPublished: true },
        select: { id: true },
      })
      for (const c of courses) {
        await revokeEnrollmentIfNoOtherAccess(userId, c.id, order.membership.mentorId, order.id)
      }
    } else if (order.bundleId && order.bundle) {
      for (const item of order.bundle.items) {
        await revokeEnrollmentIfNoOtherAccess(userId, item.courseId, order.bundle.mentorId, order.id)
      }
    } else if (order.trackId && order.track) {
      // Trilha: só remove a trackEnrollment se não houver outro pedido PAID da trilha
      const otherTrackOrder = await db.order.findFirst({
        where: { studentId: userId, trackId: order.trackId, status: 'PAID', id: { not: order.id } },
        select: { id: true },
      })
      if (!otherTrackOrder) {
        await db.trackEnrollment.deleteMany({ where: { trackId: order.trackId, studentId: userId } })
      }
      for (const item of order.track.items) {
        if (!item.courseId) continue
        await revokeEnrollmentIfNoOtherAccess(userId, item.courseId, order.track.mentorId, order.id)
      }
    } else if (order.courseId && order.course) {
      await revokeEnrollmentIfNoOtherAccess(userId, order.courseId, order.course.mentorId, order.id)
    } else if (order.bookingId && order.booking) {
      // Sessão estornada: volta para o agendamento decidir (cancela)
      await db.booking.updateMany({
        where: { id: order.bookingId, status: { in: ['PENDING', 'CONFIRMED'] } },
        data: { status: 'CANCELLED' },
      })
    }

    // Créditos usados no pedido voltam para o saldo (foram consumidos no fulfill)
    if (order.creditsUsed > 0) {
      await db.user.update({
        where: { id: userId },
        data: { creditCents: { increment: Math.round(order.creditsUsed * 100) } },
      })
    }

    await notify({
      userId,
      kind: 'order_refunded',
      title: 'Pagamento estornado',
      body: `O pedido de ${order.amount.toFixed(2).replace('.', ',')} foi estornado e o acesso revogado. Dúvidas? Fale com o suporte.`,
      linkView: 'dashboard',
      refId: order.id,
    })
    await sendEmail({
      to: order.student.email,
      kind: 'order_refunded',
      subject: 'Seu pagamento foi estornado — Órbita',
      html: brandedEmail({
        title: 'Estorno processado',
        lines: [
          `O pedido de <strong>R$ ${order.amount.toFixed(2).replace('.', ',')}</strong> foi estornado e o acesso correspondente foi revogado.`,
          'O reembolso segue o prazo do meio de pagamento utilizado.',
          'Dúvidas? Fale com o suporte respondendo este e-mail.',
        ],
      }),
    })
  } catch (err) {
    console.error('revokeOrderAccess falhou (pedido já está REFUNDED)', err)
  }

  return { ok: true, alreadyRevoked: false }
}
