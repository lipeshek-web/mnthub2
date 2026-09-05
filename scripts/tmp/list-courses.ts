import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const cs = await prisma.course.findMany({ where: { isPublished: true }, select: { title: true, category: true }, orderBy: { createdAt: 'desc' } })
console.log(cs.length, 'cursos')
console.log(cs.map(c => c.title).join(' | '))
process.exit(0)
