// Seed da Trilha IA para Estudantes (4 cursos):
// 1. Fundamentos de IA (carlos) · 2. Engenharia de Prompts (gustavo)
// 3. Pesquisa Estruturada com IA (marina) · 4. Sites com IA (beatriz)
// Uso (modo nuvem):  set -a; source .zscripts/cloud.env; set +a; bun scripts/tmp/seed-ai-track.mts
// Idempotente: se o curso já existe, apenas garante capa/descrição e pula.
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { fundamentosCourse } from './seed-data-ai-fundamentos'
import { promptsCourse } from './seed-data-ai-prompts'
import { pesquisaCourse } from './seed-data-ai-pesquisa'
import { sitesCourse } from './seed-data-ai-sites'
import type { CourseDef } from './seed-types'

function makeDb() {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL
  if (url) {
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined
    type ClientOptions = ConstructorParameters<typeof PrismaClient>[0]
    const adapter = new PrismaLibSQL({ url, authToken })
    console.log('🌐 MODO NUVEM — gravando no Turso/libSQL remoto')
    return new PrismaClient({ adapter, log: ['error'] } as unknown as ClientOptions)
  }
  console.log('💾 MODO LOCAL — gravando no SQLite (DATABASE_URL)')
  return new PrismaClient({ log: ['error'] })
}

const db = makeDb()

async function upsertCourse(def: CourseDef): Promise<void> {
  const mentor = await db.mentorProfile.findFirst({
    where: { user: { email: def.mentorEmail } },
  })
  if (!mentor) throw new Error(`Mentor sem perfil: ${def.mentorEmail}`)

  const existing = await db.course.findFirst({ where: { title: def.title } })
  if (existing) {
    await db.course.update({
      where: { id: existing.id },
      data: { coverUrl: def.coverUrl, description: def.description, price: def.price },
    })
    console.log(`  ↷ já existe (capa/descrição garantidas): ${def.title}`)
    return
  }

  const c = await db.course.create({
    data: {
      mentorId: mentor.id,
      title: def.title,
      description: def.description,
      category: def.category,
      level: def.level,
      price: def.price,
      coverUrl: def.coverUrl,
      isPublished: true,
    },
  })

  let lessonOrder = 0
  let quizCount = 0
  for (let t = 0; t < def.themes.length; t++) {
    const themeDef = def.themes[t]
    const theme = await db.courseTheme.create({
      data: { courseId: c.id, title: themeDef.title, description: themeDef.description, order: t + 1 },
    })
    for (const lessonDef of themeDef.lessons) {
      lessonOrder++
      const l = await db.lesson.create({
        data: {
          courseId: c.id,
          themeId: theme.id,
          title: lessonDef.title,
          description: lessonDef.description,
          kind: 'TEXT',
          content: lessonDef.content,
          durationMin: lessonDef.durationMin,
          order: lessonOrder,
          attachments: '[]',
        },
      })
      for (let q = 0; q < (lessonDef.quiz ?? []).length; q++) {
        const item = lessonDef.quiz![q]
        await db.quiz.create({
          data: {
            lessonId: l.id,
            prompt: item.prompt,
            options: JSON.stringify(item.options),
            correctIndex: item.correctIndex,
            explanation: item.explanation,
            order: q + 1,
          },
        })
        quizCount++
      }
    }
  }
  console.log(`  ✓ ${def.title} — ${def.themes.length} módulos, ${lessonOrder} aulas, ${quizCount} quizzes`)
}

async function main() {
  console.log('🎓 Seed Trilha IA para Estudantes (4 cursos)')
  await upsertCourse(fundamentosCourse)
  await upsertCourse(promptsCourse)
  await upsertCourse(pesquisaCourse)
  await upsertCourse(sitesCourse)
  console.log('✅ Concluído')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
