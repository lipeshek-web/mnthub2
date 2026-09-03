// E2E S-48: fluxo completo de pagamento de sessão 1:1 pela API v1 (como o app faz)
const BASE = 'http://localhost:3000/api/v1'

// 1) login ana
const loginRes = await fetch(`${BASE}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ana@demo.com', password: 'demo123' }),
})
const login = await loginRes.json()
if (!login.token) throw new Error('login falhou: ' + JSON.stringify(login))
const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` }
console.log('1) login OK, user:', login.user?.name)

// 2) mentores → pega Marina (R$150/h)
const mentors = (await (await fetch(`${BASE}/mentors`, { headers: auth })).json()).items ?? []
const marina = mentors.find((m: any) => m.name?.startsWith('Marina')) ?? mentors[0]
console.log('2) mentor escolhido:', marina.id, marina.name, 'rate:', marina.hourlyRate)

// 3) slots nos próximos 14 dias — primeira data com horário livre
function upcomingDays(n: number) {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const pad = (x: number) => String(x).padStart(2, '0')
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
  }
  return out
}
let slotDate = '', slotTimes: string[] = []
for (const date of upcomingDays(14)) {
  const res = await fetch(`${BASE}/mentors/${marina.id}/slots?date=${date}`, { headers: auth })
  const { slots } = await res.json()
  if (slots?.length >= 3) { slotDate = date; slotTimes = [slots[0], slots[2]]; break }
}
if (!slotDate) throw new Error('nenhum par de slots livre em 14 dias')
console.log('3) slots livres:', slotDate, slotTimes.join(' / '))

// 4) cria o agendamento 1
const bookingRes = await fetch(`${BASE}/bookings`, {
  method: 'POST', headers: auth,
  body: JSON.stringify({ mentorId: marina.id, startsAt: `${slotDate}T${slotTimes[0]}`, durationMin: 60, topic: 'E2E S-48 — revisão de portfólio' }),
})
const booking = await bookingRes.json()
console.log('4) booking criado:', booking.id, booking.status, 'price:', booking.price)
if (!booking.id) throw new Error('booking falhou: ' + JSON.stringify(booking))

// 5) checkout da sessão (PIX) — modo demo deve pagar na hora
const checkoutRes = await fetch(`${BASE}/checkout`, {
  method: 'POST', headers: auth,
  body: JSON.stringify({ bookingId: booking.id, paymentMethod: 'PIX' }),
})
const checkout = await checkoutRes.json()
console.log('5) checkout:', checkoutRes.status, 'order:', checkout.order?.status, 'kind:', checkout.order?.itemKind)
if (checkoutRes.status !== 200 || checkout.order?.status !== 'PAID') throw new Error('checkout booking falhou: ' + JSON.stringify(checkout))

// 6) lista de sessões — a sessão deve aparecer paga
const sessions = (await (await fetch(`${BASE}/bookings`, { headers: auth })).json()).items ?? []
const mine = sessions.find((b: any) => b.id === booking.id)
console.log('6) sessão na lista:', JSON.stringify({ status: mine?.status, paid: mine?.paid, price: mine?.price }))
if (mine?.paid !== true) throw new Error('sessão não marcada como paga')

// 7) RETOMADA: cria 2º agendamento + planta pedido PENDING com cobrança morta →
//    novo checkout deve cancelar o pedido preso e criar um novo (PAID no demo)
const booking2 = await (await fetch(`${BASE}/bookings`, {
  method: 'POST', headers: auth,
  body: JSON.stringify({ mentorId: marina.id, startsAt: `${slotDate}T${slotTimes[1]}`, durationMin: 60, topic: 'E2E S-48 — retry' }),
})).json()
if (!booking2.id) throw new Error('booking2 falhou: ' + JSON.stringify(booking2))
const { PrismaClient } = await import('@prisma/client')
const db = new PrismaClient()
const order2 = await db.order.create({ data: { bookingId: booking2.id, studentId: login.user.id, mentorId: marina.id, amount: marina.hourlyRate, paymentMethod: 'PIX', status: 'PENDING', creditsUsed: 0, discount: 0, channel: 'direct', landingPage: 'platform' } })
await db.payment.create({ data: { orderId: order2.id, userId: login.user.id, gateway: 'SIMULATED', billingType: 'PIX', status: 'CANCELED', value: marina.hourlyRate, externalReference: order2.id, lastEvent: 'teste', lastEventAt: new Date() } })
const retryRes = await fetch(`${BASE}/checkout`, { method: 'POST', headers: auth, body: JSON.stringify({ bookingId: booking2.id, paymentMethod: 'PIX' }) })
const retry = await retryRes.json()
console.log('7) retry de cobrança presa:', retryRes.status, 'order:', retry.order?.status)
if (retryRes.status !== 200 || retry.order?.status !== 'PAID') throw new Error('retry falhou: ' + JSON.stringify(retry))
await db.$disconnect()

console.log('\nE2E S-48 BOOKING: TUDO VERDE ✅')
console.log('CLEANUP_IDS', JSON.stringify({ bookings: [booking.id, booking2.id] }))
