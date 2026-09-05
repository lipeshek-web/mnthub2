import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true, name: true, role: true } })
console.log(JSON.stringify(admins, null, 2))
process.exit(0)
