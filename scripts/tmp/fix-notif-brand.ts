/** Atualiza notificações com a marca antiga. */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const items = await prisma.notification.findMany({
  where: { title: { contains: 'MentorHub' } },
})

for (const n of items) {
  await prisma.notification.update({
    where: { id: n.id },
    data: { title: n.title.replace(/MentorHub/g, 'Órbita') },
  })
  console.log(`notif ${n.id}: ${n.title} -> ${n.title.replace(/MentorHub/g, 'Órbita')}`)
}

console.log('total:', items.length)
process.exit(0)
