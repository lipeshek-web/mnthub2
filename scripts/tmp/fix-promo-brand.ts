/** Corrige mensagens promocionais que ainda citam a marca antiga. */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const coupons = await prisma.coupon.findMany({
  where: { promoMessage: { contains: 'MentorHub' } },
})

for (const c of coupons) {
  await prisma.coupon.update({
    where: { id: c.id },
    data: { promoMessage: c.promoMessage!.replace(/MentorHub/g, 'Órbita') },
  })
  console.log(`coupon ${c.code}: "${c.promoMessage}" -> atualizado`)
}

console.log(`total corrigido: ${coupons.length}`)
