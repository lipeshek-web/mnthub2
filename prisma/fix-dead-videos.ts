/* One-off: substitui vídeos mortos (YouTube 404) por vídeos estáveis
   nas aulas já existentes no banco — sem precisar de re-seed. */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const REPLACEMENTS: Record<string, string> = {
  'https://www.youtube.com/watch?v=dSX0pLQXI6E': 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  'https://www.youtube.com/watch?v=8nMKRTaD4-E': 'https://www.youtube.com/watch?v=R6MlUcmOul8',
  'https://www.youtube.com/watch?v=bEKmDQAIvfM': 'https://www.youtube.com/watch?v=WhWc3b3KhnY',
  'https://www.youtube.com/watch?v=FBnJklzWqtU': 'https://www.youtube.com/watch?v=pKmSdY56VtY',
}

async function main() {
  let updated = 0
  for (const [dead, live] of Object.entries(REPLACEMENTS)) {
    const res = await db.lesson.updateMany({ where: { videoUrl: dead }, data: { videoUrl: live } })
    updated += res.count
    console.log(`${dead} -> ${live}: ${res.count} aula(s)`)
  }
  console.log(`Total: ${updated} aulas atualizadas`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
