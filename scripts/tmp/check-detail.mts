import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
// sample course with themes+lessons
const c = await db.course.findFirst({ where: { title: { contains: 'Cyber Segurança I' } }, include: { themes: { include: { lessons: true }, orderBy: { order: 'asc' } } } })
console.log('COVER:', c?.coverUrl)
const t = c?.themes[0]
console.log('THEME:', t?.title)
const l = t?.lessons[0]
console.log('LESSON sample:', JSON.stringify({ title: l?.title, kind: l?.kind, durationMin: l?.durationMin, hasContent: !!l?.content, contentStart: l?.content?.slice(0, 150), hasVideo: !!l?.videoUrl, quiz: l?.quizQuestions?.slice(0, 80) }))
// mentor categories
const mentors = await db.mentorProfile.findMany({ select: { user: { select: { name: true } }, categories: true, hourlyRate: true, userId: true } })
for (const m of mentors) console.log('MENTOR:', m.user.name, '→', m.categories, '| rate:', m.hourlyRate)
// existing library item coverUrl format
const items = await db.libraryItem.findMany({ select: { title: true, coverUrl: true, pdfUrl: true }, take: 4 })
for (const i of items) console.log('LIB:', i.title, '→', i.coverUrl, '|', i.pdfUrl)
process.exit(0)
