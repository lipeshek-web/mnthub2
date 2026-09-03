import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const users = await db.user.findMany({ select: { name: true, email: true, avatarUrl: true, role: true, blocked: true } })
for (const u of users) console.log(`${u.name} | ${u.email} | ${u.avatarUrl} | ${u.role}`)
process.exit(0)
