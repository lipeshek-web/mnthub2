/** Varredura de resquícios da marca antiga no banco (campos corretos). */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function count(model: string, where: Record<string, unknown>) {
  try {
    // @ts-expect-error acesso dinâmico
    const n = await prisma[model].count({ where })
    console.log(`${model}: ${n}`)
  } catch {
    console.log(`${model}: n/a`)
  }
}

await count('notification', { title: { contains: 'MentorHub' } })
await count('contentPost', { body: { contains: 'MentorHub' } })
await count('course', { description: { contains: 'MentorHub' } })
await count('coupon', { promoMessage: { contains: 'MentorHub' } })
