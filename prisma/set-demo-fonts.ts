// One-off: atribui fontes de demonstração aos mentores já existentes.
// Uso: bunx tsx prisma/set-demo-fonts.ts
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PAIRS: { match: RegExp; fontHeading: string; fontBody: string }[] = [
  // Carlos (arquitetura de software) → editorial clássico
  { match: /carlos/i, fontHeading: 'playfair', fontBody: 'lora' },
  // Marina (produto/carreira) → geométrica moderna
  { match: /marina/i, fontHeading: 'sora', fontBody: 'inter' },
]

async function main() {
  const mentors = await db.mentorProfile.findMany({ include: { user: true } })
  for (const m of mentors) {
    const pair = PAIRS.find((p) => p.match.test(m.user.name))
    if (!pair) continue
    await db.mentorProfile.update({
      where: { id: m.id },
      data: { fontHeading: pair.fontHeading, fontBody: pair.fontBody },
    })
    console.log(`${m.user.name}: heading=${pair.fontHeading} body=${pair.fontBody}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
