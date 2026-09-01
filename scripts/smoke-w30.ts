/**
 * Smoke tests do Sprint 2 (W-30) — circuito de dinheiro.
 * #5 expiração de assinatura · #6 reserva de créditos · #7 estorno revoga acesso
 * #9 double-booking · #10 sessão 1:1 paga
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const BASE = 'http://localhost:3000'

let pass = 0
let fail = 0
function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    pass++
    console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    fail++
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function loginAna(): Promise<{ token: string; id: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.SMOKE_USER ?? 'ana@demo.com', password: 'demo123' }),
  })
  const j = (await res.json()) as { sessionToken?: string; id?: string }
  if (!j.sessionToken || !j.id) throw new Error('login ana falhou')
  return { token: j.sessionToken, id: j.id }
}

async function main() {
  const ana = await loginAna()
  const auth = { Authorization: `Bearer ${ana.token}`, 'Content-Type': 'application/json' }
  console.log(`ana: ${ana.id}`)

  // ============ #9 DOUBLE-BOOKING (transação) ============
  console.log('\n#9 Double-booking: 5 agendamentos simultâneos no mesmo slot')
  const mentor = await db.mentorProfile.findFirst({
    where: { isPublished: true, hourlyRate: { gt: 0 }, userId: { not: ana.id } },
    select: { id: true, hourlyRate: true },
  })
  if (!mentor) throw new Error('sem mentor')
  // encontra um weekday/hora coberto pela disponibilidade do mentor
  const av = await db.availability.findFirst({ where: { mentorId: mentor.id } })
  if (!av) throw new Error('mentor sem disponibilidade')
  const slot = `2026-12-0${((av.weekday % 6) + 1) /* 1..6 garante weekday válido-ish */}T${String(av.startHour).padStart(2, '0')}:00`
  // usa uma data que caia no weekday certo
  const target = new Date()
  target.setDate(target.getDate() + ((av.weekday - target.getDay() + 7) % 7 || 7))
  const when = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}T${String(av.startHour).padStart(2, '0')}:00`
  console.log(`  slot: ${when} (weekday ${av.weekday})`)
  void slot

  const attempts = await Promise.all(
    Array.from({ length: 5 }, () =>
      fetch(`${BASE}/api/bookings`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({
          mentorId: mentor.id,
          startsAt: when,
          durationMin: 60,
          topic: 'W30 double-booking test',
        }),
      }).then(async (r) => ({ status: r.status, body: (await r.json()) as { id?: string; error?: string } }))
    )
  )
  for (const a of attempts) console.log(`    → status=${a.status} body=${JSON.stringify(a.body).slice(0, 110)}`)
  const created = attempts.filter((a) => a.status === 201)
  const conflicts = attempts.filter((a) => a.status === 409)
  check('exatamente 1 agendamento criado', created.length === 1, `criados=${created.length}, conflitos=${conflicts.length}, outros=${attempts.filter((a) => a.status !== 201 && a.status !== 409).length}`)
  check('demais receberam 409', conflicts.length === 4, `${conflicts.length} × "Alguém acabou de agendar"`)
  const testBookingIds = created.map((a) => a.body.id!).filter(Boolean)

  // ============ #10 SESSÃO 1:1 PAGA (checkout + fulfillment + duplicata) ============
  console.log('\n#10 Sessão 1:1 paga')
  if (testBookingIds[0]) {
    const bookingId = testBookingIds[0]
    const co = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ bookingId, paymentMethod: 'PIX' }),
    })
    const coBody = (await co.json()) as { order?: { id: string; status: string; amount: number; itemKind?: string }; error?: string }
    check('checkout da sessão cria pedido', co.status === 200 || co.status === 201, `status=${co.status} amount=${coBody.order?.amount}`)
    check('pedido pago no modo demo', coBody.order?.status === 'PAID', `status=${coBody.order?.status}`)
    const after = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true, price: true } })
    check('pagamento CONFIRMOU a sessão', after?.status === 'CONFIRMED', `booking.status=${after?.status} (preço R$${after?.price})`)
    const dup = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ bookingId, paymentMethod: 'PIX' }),
    })
    check('segunda cobrança da mesma sessão bloqueada', dup.status === 409, `status=${dup.status}`)
    const order = await db.order.findFirst({ where: { bookingId }, select: { id: true, amount: true } })
    if (order && after && after.price > 0) {
      // estorno da sessão (#7 na variante booking): sessão volta a CANCELLED
      const { revokeOrderAccess } = await import('../src/lib/fulfillment')
      const rev = await revokeOrderAccess(order.id)
      const afterRefund = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } })
      const orderAfter = await db.order.findUnique({ where: { id: order.id }, select: { status: true } })
      check('estorno: pedido → REFUNDED', rev.ok && orderAfter?.status === 'REFUNDED', `order=${orderAfter?.status}`)
      check('estorno: sessão → CANCELLED', afterRefund?.status === 'CANCELLED', `booking=${afterRefund?.status}`)
      const rev2 = await revokeOrderAccess(order.id)
      check('estorno idempotente (2ª chamada)', rev2.alreadyRevoked === true, `alreadyRevoked=${rev2.alreadyRevoked}`)
    }
    // limpa pedido/pagamento do teste
    await db.payment.deleteMany({ where: { orderId: order?.id ?? 'none' } })
    await db.order.deleteMany({ where: { id: order?.id ?? 'none' } })
  }
  // limpa bookings do teste
  await db.booking.deleteMany({ where: { topic: 'W30 double-booking test' } })
  console.log('  (bookings de teste removidos)')

  // ============ #6 CRÉDITOS — reserva bloqueia double-spend ============
  console.log('\n#6 Créditos: saldo já reservado em pedido PENDING não reutilizável')
  const anaUser = await db.user.findUnique({ where: { id: ana.id }, select: { creditCents: true } })
  const originalCredits = anaUser?.creditCents ?? 0
  const paidCourse = await db.course.findFirst({
    where: { isPublished: true, price: { gt: 0 }, enrollments: { none: { studentId: ana.id } } },
    select: { id: true, title: true, price: true },
  })
  if (!paidCourse) {
    console.log('  ⚠️ sem curso pago não possuído p/ testar — pulando')
  } else {
    // ana ganha R$ 50 de saldo + 1 pedido PENDING que reserva os mesmos R$ 50
    await db.user.update({ where: { id: ana.id }, data: { creditCents: 5000 } })
    const pendingOrder = await db.order.create({
      data: {
        courseId: paidCourse.id,
        studentId: ana.id,
        mentorId: mentor.id,
        amount: 0,
        status: 'PENDING',
        creditsUsed: 50,
      },
    })
    // Pedido PENDING reserva os créditos — checkout com useCredits deve vir SEM créditos
    const co = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ courseId: paidCourse.id, paymentMethod: 'PIX', useCredits: true }),
    })
    const coBody = (await co.json()) as { order?: { id: string; amount: number; status: string; itemKind?: string } }
    const createdOrder = coBody.order
      ? await db.order.findUnique({ where: { id: coBody.order.id }, select: { creditsUsed: true, amount: true } })
      : null
    check(
      'créditos reservados NÃO reaproveitados no checkout',
      createdOrder !== null && createdOrder.creditsUsed === 0 && createdOrder.amount === paidCourse.price,
      `creditsUsed=${createdOrder?.creditsUsed}, amount=R$${createdOrder?.amount} (esperado 0 e R$${paidCourse.price})`
    )
    // limpa: pedidos/pagamentos do teste + devolve saldo original
    if (createdOrder) {
      await db.payment.deleteMany({ where: { orderId: createdOrder.amount !== undefined ? (coBody.order!.id) : 'none' } })
      await db.order.delete({ where: { id: coBody.order!.id } })
    }
    await db.enrollment.deleteMany({ where: { courseId: paidCourse.id, studentId: ana.id } })
    await db.payment.deleteMany({ where: { orderId: pendingOrder.id } })
    await db.order.delete({ where: { id: pendingOrder.id } })
    await db.user.update({ where: { id: ana.id }, data: { creditCents: originalCredits } })
  }

  // ============ #5 EXPIRAÇÃO DE ASSINATURA ============
  console.log('\n#5 Assinatura vencida → EXPIRED + matrícula revogada')
  {
    const membership = await db.mentorMembership.findFirst({ where: { mentorId: mentor.id } })
    const anyCourse = await db.course.findFirst({
      where: { mentorId: mentor.id, isPublished: true },
      select: { id: true, title: true },
    })
    if (!membership || !anyCourse) {
      console.log('  ⚠️ mentor sem plano ou sem curso publicado — pulando #5')
    } else {
      // Preserva matrícula original (progresso) se existir
      const originalEnr = await db.enrollment.findUnique({
        where: { courseId_studentId: { courseId: anyCourse.id, studentId: ana.id } },
      })
      if (originalEnr) await db.enrollment.delete({ where: { id: originalEnr.id } })
      // Preserva assinatura original da ana no plano (unique membershipId+userId)
      const originalSub = await db.membershipSubscription.findUnique({
        where: { membershipId_userId: { membershipId: membership.id, userId: ana.id } },
      })
      if (originalSub) await db.membershipSubscription.delete({ where: { id: originalSub.id } })
      const sub = await db.membershipSubscription.create({
        data: {
          membershipId: membership.id,
          userId: ana.id,
          mentorId: mentor.id,
          status: 'ACTIVE',
          startedAt: new Date(Date.now() - 40 * 24 * 3600 * 1000),
          renewsAt: new Date(Date.now() - 10 * 24 * 3600 * 1000), // vencido há 10 dias
        },
      })
      // matrícula "concedida pelo plano"
      const enr = await db.enrollment.create({ data: { courseId: anyCourse.id, studentId: ana.id, completedLessonIds: '[]' } })
      // dispara o sweep via GET /api/memberships
      await fetch(`${BASE}/api/memberships?userId=${ana.id}`, { headers: auth })
      const subAfter = await db.membershipSubscription.findUnique({ where: { id: sub.id } })
      const enrAfter = await db.enrollment.findUnique({ where: { id: enr.id } })
      check('assinatura vencida virou EXPIRED', subAfter?.status === 'EXPIRED', `status=${subAfter?.status}`)
      check('matrícula do plano expirado foi revogada', enrAfter === null, enrAfter ? 'matrícula ainda existe' : 'matrícula removida')
      const notif = await db.notification.findFirst({ where: { userId: ana.id, kind: 'membership_expired', refId: sub.id } })
      check('aluno notificado da expiração', notif !== null)
      // limpa
      await db.notification.deleteMany({ where: { refId: sub.id } })
      await db.membershipSubscription.delete({ where: { id: sub.id } })
      // restaura assinatura original
      if (originalSub) {
        await db.membershipSubscription.create({ data: {
          membershipId: originalSub.membershipId, userId: originalSub.userId, mentorId: originalSub.mentorId,
          status: originalSub.status, startedAt: originalSub.startedAt, renewsAt: originalSub.renewsAt,
          cancelledAt: originalSub.cancelledAt,
        } })
      }
      // restaura matrícula original exatamente como estava
      if (originalEnr) {
        await db.enrollment.create({ data: { courseId: originalEnr.courseId, studentId: originalEnr.studentId, completedLessonIds: originalEnr.completedLessonIds, createdAt: originalEnr.createdAt } })
      }
    }
  }

  // ============ #7 ESTORNO — curso: revoga matrícula + devolve créditos ============
  console.log('\n#7 Estorno: matrícula revogada, créditos devolvidos, idempotente')
  // curso sem matrícula E sem outra via paga do usuário (a trava preserva
  // acesso conquistado por compra — o teste precisa de um curso "isolado")
  const anaPaidOrders = await db.order.findMany({
    where: { studentId: ana.id, status: 'PAID' },
    select: {
      courseId: true,
      bundle: { select: { items: { select: { courseId: true } } } },
      track: { select: { items: { where: { type: 'COURSE' }, select: { courseId: true } } } },
    },
  })
  const coveredCourseIds = new Set<string>()
  for (const o of anaPaidOrders) {
    if (o.courseId) coveredCourseIds.add(o.courseId)
    o.bundle?.items.forEach((i) => coveredCourseIds.add(i.courseId))
    o.track?.items.forEach((i) => coveredCourseIds.add(i.courseId))
  }
  const rCourse = await db.course.findFirst({
    where: {
      isPublished: true,
      price: { gt: 0 },
      enrollments: { none: { studentId: ana.id } },
      id: { notIn: Array.from(coveredCourseIds) },
    },
    select: { id: true, title: true, price: true },
  })
  if (!rCourse) {
    console.log('  ⚠️ sem curso pago livre — pulando #7')
  } else {
    await db.enrollment.create({ data: { courseId: rCourse.id, studentId: ana.id, completedLessonIds: '[]' } })
    const before = await db.user.findUnique({ where: { id: ana.id }, select: { creditCents: true } })
    const order = await db.order.create({
      data: {
        courseId: rCourse.id,
        studentId: ana.id,
        mentorId: mentor.id,
        amount: rCourse.price,
        status: 'PAID',
        creditsUsed: 10,
      },
    })
    const { revokeOrderAccess } = await import('../src/lib/fulfillment')
    const rev = await revokeOrderAccess(order.id)
    const orderAfter = await db.order.findUnique({ where: { id: order.id }, select: { status: true } })
    const enrAfter = await db.enrollment.findFirst({ where: { courseId: rCourse.id, studentId: ana.id } })
    const after = await db.user.findUnique({ where: { id: ana.id }, select: { creditCents: true } })
    check('pedido PAID → REFUNDED', rev.ok && orderAfter?.status === 'REFUNDED')
    check('matrícula revogada no estorno', enrAfter === null)
    check(
      'créditos usados voltaram ao saldo',
      (after?.creditCents ?? 0) === (before?.creditCents ?? 0) + 1000,
      `antes=${before?.creditCents}, depois=${after?.creditCents} (+R$10,00)`
    )
    const refundNotif = await db.notification.findFirst({ where: { userId: ana.id, kind: 'order_refunded', refId: order.id } })
    check('aluno notificado do estorno', refundNotif !== null)
    // limpa
    await db.notification.deleteMany({ where: { refId: order.id } })
    await db.order.delete({ where: { id: order.id } })
  }

  console.log(`\nResultado: ${pass} ok, ${fail} falha(s)`)
  if (fail > 0) process.exitCode = 1
}

main()
  .catch((e) => {
    console.error('Smoke test erro:', e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
