import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const profiles = await db.mentorProfile.findMany({ include: { user: { select: { name: true } } } })
for (const p of profiles) console.log(`${p.user.name} → slug: ${p.slug ?? 'NULL'}`)
process.exit(0)
