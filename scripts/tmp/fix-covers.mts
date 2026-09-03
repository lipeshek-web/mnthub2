import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const fixes = [
  { contains: '30 expressões', url: '/uploads/seed/artigo-30-expressoes.png' },
  { contains: 'Playbook', url: '/uploads/seed/artigo-playbook-funil.png' },
]
for (const f of fixes) {
  const item = await db.libraryItem.findFirst({ where: { title: { contains: f.contains } } })
  if (item) { await db.libraryItem.update({ where: { id: item.id }, data: { coverUrl: f.url } }); console.log('✓', item.title) }
}
const remaining = await db.libraryItem.count({ where: { coverUrl: null } })
console.log('Itens sem capa restantes:', remaining)
process.exit(0)
