import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
// Remove TODOS os artefatos E2E S-48 criados hoje (sessões de teste + pedidos + notificações)
const bookings = await db.booking.findMany({
  where: { topic: { startsWith: 'E2E S-48' }, createdAt: { gte: new Date(Date.now() - 6 * 3600_000) } },
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
// conferência final
const left = await db.booking.count({ where: { topic: { startsWith: 'E2E S-48' } } })
console.log('restantes com tópico E2E S-48:', left)
await db.$disconnect()
