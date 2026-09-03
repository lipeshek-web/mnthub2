import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const map: Record<string, string> = {
  'Camila Rocha': 'camila-rocha',
  'Fernanda Dias': 'fernanda-dias',
  'Lucas Prado': 'lucas-prado',
  'Thiago Nunes': 'thiago-nunes',
}
for (const [name, slug] of Object.entries(map)) {
  const p = await db.mentorProfile.findFirst({ where: { user: { name } } })
  if (p) { await db.mentorProfile.update({ where: { id: p.id }, data: { slug } }); console.log('✓', name, '→', slug) }
}
process.exit(0)
