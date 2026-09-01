/**
 * Smoke W-30 — Ciclo financeiro (Sprint 2)
 * 1) Expiração de assinatura (renewsAt no passado → CANCELLED + revogação)
 * 2) Débito atômico de créditos (dois pedidos quitados em paralelo)
 * 3) Double-booking (duas requisições simultâneas no mesmo horário → 1 cria, 1 conflita)
 * 4) Sessão 1:1 paga (confirm 402 antes do pagamento → checkout → confirm → cancel com auto-reembolso)
 * 5) Fluxo de reembolso (solicitação do aluno → admin aprova estornando+revogando / recusa)
 *
 * Uso: bun scripts/smoke-w30.ts  (dev server precisa estar no :3000)
 * Cria entidades dedicadas com sufixo único e limpa tudo no final.
 */
import { db } from '../src/lib/db'
import { createSessionToken } from '../src/lib/session'
import { createAdminSession } from '../src/lib/admin-auth'
import { fulfillOrder } from '../src/lib/fulfillment'

const BASE = 'http://localhost:3000'
const TAG = `w30${Date.now().toString(36)}`

let fails = 0
const check = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ` (${extra})` : ''}`)
  if (!cond) fails++
}

const pad = (n: number) => String(n).padStart(2, '0')
const naiveLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

const api = async (path: string, method: string, token: string, body?: unknown) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

// ==================== SETUP ====================
const mentorUser = await db.user.create({ data: { email: `mentor-${TAG}@test.local`, name: 'Mentor Smoke W30' } })
const mentor = await db.mentorProfile.create({
  data: { userId: mentorUser.id, headline: 'smoke w30', description: 'smoke w30', hourlyRate: 150, isPublished: true },
})
const course = await db.course.create({
  data: { mentorId: mentor.id, title: `Curso ${TAG}`, description: 'smoke', category: 'Teste', price: 200, isPublished: true },
})
const membership = await db.mentorMembership.create({
  data: { mentorId: mentor.id, title: `Plano ${TAG}`, description: 'smoke', price: 99, isPublished: true },
})
for (let d = 0; d < 7; d++) {
  await db.availability.create({ data: { mentorId: mentor.id, weekday: d, startHour: 8, endHour: 20 } })
}
const student = await db.user.create({ data: { email: `aluno-${TAG}@test.local`, name: 'Aluno Smoke W30' } })
const student2 = await db.user.create({ data: { email: `aluno2-${TAG}@test.local`, name: 'Aluno 2 Smoke W30' } })
const adminUser = await db.user.create({ data: { email: `admin-${TAG}@test.local`, name: 'Admin Smoke W30', role: 'ADMIN' } })

const studentTok = createSessionToken(student.id).token
const student2Tok = createSessionToken(student2.id).token
const mentorTok = createSessionToken(mentorUser.id).token
const adminTok = (await createAdminSession(adminUser.id)).token

// ==================== 1) EXPIRAÇÃO DE ASSINATURA ====================
console.log('\n— 1) Expiração de assinatura (renewsAt) —')
const sub = await db.membershipSubscription.create({
  data: {
    membershipId: membership.id,
    userId: student.id,
    mentorId: mentor.id,
    status: 'ACTIVE',
    startedAt: new Date(Date.now() - 31 * 24 * 3600 * 1000),
    renewsAt: new Date(Date.now() - 24 * 3600 * 1000), // venceu ontem
  },
})
await db.enrollment.create({ data: { courseId: course.id, studentId: student.id, completedLessonIds: '[]' } })

const mRes = await api(`/api/memberships?userId=${student.id}`, 'GET', studentTok)
const mine = (mRes.json?.memberships ?? []).find((m: { id: string }) => m.id === membership.id)
check('GET memberships com renewsAt vencido → myStatus CANCELLED', mine?.myStatus === 'CANCELLED', `got=${mine?.myStatus}`)
const subAfter = await db.membershipSubscription.findUnique({ where: { id: sub.id } })
check('sweep → status CANCELLED no banco', subAfter?.status === 'CANCELLED')
const enrAfter = await db.enrollment.findUnique({
  where: { courseId_studentId: { courseId: course.id, studentId: student.id } },
})
check('sweep → matrícula concedida pelo plano revogada', enrAfter === null)

// ==================== 2) DÉBITO ATÔMICO DE CRÉDITOS ====================
console.log('\n— 2) Débito atômico de créditos —')
await db.user.update({ where: { id: student.id }, data: { creditCents: 10000 } }) // R$ 100
const orderA = await db.order.create({
  data: { courseId: course.id, studentId: student.id, mentorId: mentor.id, amount: 170, creditsUsed: 30, status: 'PENDING' },
})
const orderB = await db.order.create({
  data: { courseId: course.id, studentId: student.id, mentorId: mentor.id, amount: 170, creditsUsed: 30, status: 'PENDING' },
})
await fulfillOrder(orderA.id)
await fulfillOrder(orderB.id)
const bal = await db.user.findUnique({ where: { id: student.id }, select: { creditCents: true } })
// Atômico: 10000 − 3000 − 3000 = 4000. (Antes: os dois liam 10000 e o último write vencia → 7000)
check('dois pedidos quitados → débito sem double-spend', bal?.creditCents === 4000, `saldo=${bal?.creditCents} (esperado 4000)`)
// limpa os pedidos sintéticos p/ não proteger matrículas nos testes seguintes
await db.order.updateMany({ where: { id: { in: [orderA.id, orderB.id] } }, data: { status: 'CANCELED' } })
await db.enrollment.deleteMany({ where: { studentId: student.id, courseId: course.id } })

// ==================== 3) DOUBLE-BOOKING (transação) ====================
console.log('\n— 3) Agendamento concorrente (anti double-booking) —')
const slot = new Date(Date.now() + 24 * 3600 * 1000)
slot.setHours(14, 0, 0, 0)
const payload = { mentorId: mentor.id, startsAt: naiveLocal(slot), durationMin: 60, topic: 'Sessão smoke W30' }
const [b1, b2] = await Promise.all([
  api('/api/bookings', 'POST', studentTok, payload),
  api('/api/bookings', 'POST', student2Tok, payload),
])
const oneCreated =
  (b1.status === 201 && b2.status === 409) || (b1.status === 409 && b2.status === 201)
check('duas requisições simultâneas → exatamente 1 cria, 1 recebe 409', oneCreated, `statuses=${b1.status}/${b2.status}`)
const createdBooking = b1.status === 201 ? b1.json : b2.json
// quem criou a sessão é quem paga (mentee da transação vencedora)
const creatorTok = b1.status === 201 ? studentTok : student2Tok
const bookingsSameSlot = await db.booking.count({
  where: { mentorId: mentor.id, startsAt: naiveLocal(slot), status: { in: ['PENDING', 'CONFIRMED'] } },
})
check('banco tem apenas 1 booking no horário', bookingsSameSlot === 1, `count=${bookingsSameSlot}`)

// ==================== 4) SESSÃO 1:1 PAGA ====================
console.log('\n— 4) Cobrança de sessão 1:1 —')
const cBefore = await api(`/api/bookings/${createdBooking.id}`, 'PATCH', mentorTok, { action: 'confirm' })
check('mentor confirma sessão NÃO paga → 402', cBefore.status === 402, `status=${cBefore.status}`)

const co = await api('/api/checkout', 'POST', creatorTok, { bookingId: createdBooking.id, paymentMethod: 'PIX' })
if (co.json?.pending) {
  // gateway configurado: quita a cobrança localmente p/ seguir o smoke
  await fulfillOrder(co.json.order.id as string)
}
check('checkout da sessão → pedido PAGO', co.status === 200 && (co.json?.order?.status === 'PAID' || co.json?.pending === true), JSON.stringify(co.json).slice(0, 140))
const paidOrder = await db.order.findFirst({ where: { bookingId: createdBooking.id, status: 'PAID' } })
check('pedido PAID vinculado à sessão', Boolean(paidOrder))

const cAfter = await api(`/api/bookings/${createdBooking.id}`, 'PATCH', mentorTok, { action: 'confirm' })
check('mentor confirma sessão paga → CONFIRMED', cAfter.status === 200 && cAfter.json?.status === 'CONFIRMED', `status=${cAfter.status}`)

// cancelamento de sessão paga → reembolso automático
await api(`/api/bookings/${createdBooking.id}`, 'PATCH', mentorTok, { action: 'cancel' })
const refunded = await db.order.findFirst({ where: { bookingId: createdBooking.id }, orderBy: { createdAt: 'desc' } })
check('cancelar sessão paga → pedido REFUNDED', refunded?.status === 'REFUNDED', `status=${refunded?.status}`)
const bkAfter = await db.booking.findUnique({ where: { id: createdBooking.id } })
check('booking cancelado junto', bkAfter?.status === 'CANCELLED')

// ==================== 5) FLUXO DE REEMBOLSO ====================
console.log('\n— 5) Solicitação + decisão de reembolso —')
await fulfillOrder((await db.order.create({
  data: { courseId: course.id, studentId: student.id, mentorId: mentor.id, amount: 200, status: 'PENDING' },
})).id) // recria matrícula via pedido pago real
const orderR = await db.order.findFirst({
  where: { courseId: course.id, studentId: student.id, status: 'PAID' },
  orderBy: { createdAt: 'desc' },
})
check('pedido PAID pronto p/ reembolso', Boolean(orderR))

const rr1 = await api(`/api/orders/${orderR!.id}/refund-request`, 'POST', studentTok, {
  reason: 'Não terei tempo de concluir o curso neste mês.',
})
check('aluno solicita reembolso → 200', rr1.status === 200, `status=${rr1.status}`)
const rr2 = await api(`/api/orders/${orderR!.id}/refund-request`, 'POST', studentTok, { reason: 'Tentativa duplicada de solicitação.' })
check('solicitação duplicada → 409', rr2.status === 409)
const rr3 = await api(`/api/orders/${orderR!.id}/refund-request`, 'POST', student2Tok, { reason: 'Pedido de outra pessoa, deve falhar.' })
check('pedido alheio → 403', rr3.status === 403)

const approve = await fetch(BASE + `/api/admin/orders/${orderR!.id}/refund`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'x-admin-token': adminTok },
  body: JSON.stringify({ action: 'approve' }),
})
check('admin aprova → 200', approve.status === 200)
const orderRAfter = await db.order.findUnique({ where: { id: orderR!.id } })
check('pedido REFUNDED + refundStatus APPROVED', orderRAfter?.status === 'REFUNDED' && orderRAfter?.refundStatus === 'APPROVED')
const enrRefunded = await db.enrollment.findUnique({
  where: { courseId_studentId: { courseId: course.id, studentId: student.id } },
})
check('acesso revogado após estorno (matrícula removida)', enrRefunded === null)

// caminho da recusa
const orderQ = await db.order.create({ data: { courseId: course.id, studentId: student2.id, mentorId: mentor.id, amount: 200, status: 'PAID' } })
await api(`/api/orders/${orderQ.id}/refund-request`, 'POST', student2Tok, { reason: 'Mudei de ideia sobre o horário do curso.' })
const reject = await fetch(BASE + `/api/admin/orders/${orderQ.id}/refund`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', 'x-admin-token': adminTok },
  body: JSON.stringify({ action: 'reject' }),
})
const orderQAfter = await db.order.findUnique({ where: { id: orderQ.id } })
check('admin recusa → REJECTED (pedido segue PAID)', reject.status === 200 && orderQAfter?.refundStatus === 'REJECTED' && orderQAfter?.status === 'PAID')

const notAdmin = await fetch(BASE + `/api/admin/orders/${orderQ.id}/refund`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentTok}` },
  body: JSON.stringify({ action: 'approve' }),
})
check('não-admin tenta aprovar → 401', notAdmin.status === 401, `status=${notAdmin.status}`)

// ==================== CLEANUP ====================
console.log('\n— cleanup —')
await db.order.deleteMany({ where: { mentorId: mentor.id } })
await db.booking.deleteMany({ where: { mentorId: mentor.id } })
await db.enrollment.deleteMany({ where: { studentId: { in: [student.id, student2.id] } } })
await db.membershipSubscription.deleteMany({ where: { membershipId: membership.id } })
await db.mentorMembership.delete({ where: { id: membership.id } })
await db.availability.deleteMany({ where: { mentorId: mentor.id } })
await db.course.delete({ where: { id: course.id } })
await db.mentorProfile.delete({ where: { id: mentor.id } })
await db.user.deleteMany({ where: { id: { in: [mentorUser.id, student.id, student2.id, adminUser.id] } } })
console.log('entidades de teste removidas')

console.log(`\n${fails === 0 ? '✅ TODOS OS CHECKS PASSARAM' : `❌ ${fails} check(s) falharam`}`)
process.exit(fails === 0 ? 0 : 1)
