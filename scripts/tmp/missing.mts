import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const items = await db.libraryItem.findMany({ where: { coverUrl: null, isPublished: true }, select: { title: true, kind: true } })
for (const i of items) console.log('SEM CAPA:', i.kind, '-', i.title)
process.exit(0)
