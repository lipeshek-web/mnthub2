import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
// Remove os artefatos E2E da sessão M (sala de reunião no app): bookings E2E + notificações
const topics = ['E2E ao vivo agora', 'E2E sala de reunião no app']
const bookings = await db.booking.findMany({
  where: { topic: { in: topics } },
  select: { id: true, topic: true, status: true },
})
console.log('bookings alvo:', bookings.length)
for (const b of bookings) {
  const orders = await db.order.findMany({ where: { bookingId: b.id }, select: { id: true } })
  for (const o of orders) {
    await db.payment.deleteMany({ where: { orderId: o.id } })
    await db.order.delete({ where: { id: o.id } }).catch(() => {})
  }
  const notif = await db.notification.deleteMany({ where: { refId: b.id } })
  await db.booking.delete({ where: { id: b.id } })
  console.log(`- removido booking ${b.id} (${b.topic} · ${b.status}) + ${orders.length} pedido(s) + ${notif.count} notificação(ões)`)
}
const left = await db.booking.count({ where: { topic: { in: topics } } })
console.log('restantes:', left)
await db.$disconnect()
