// Seed de conteúdo: promove mentores novos, cria 19 cursos, 7 livros + 5 artigos,
// corrige capas faltantes e monta as páginas do leitor nativo (pdftoppm + manifest).
// Uso: bun scripts/tmp/seed-run.mts [--dry]
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { techCourses, courseTestesFix } from './seed-data-1'
import { careerCourses } from './seed-data-2'
import { newAreaCourses } from './seed-data-3'
import type { CourseDef } from './seed-types'
import { newBooks, newArticles, coverFixes } from './seed-lib-data'
import { writePdf } from './pdf-gen'

const db = new PrismaClient()
const DRY = process.argv.includes('--dry')
const SEED_DIR = path.join(process.cwd(), 'public', 'uploads', 'seed')
const PAGES_DIR = path.join(process.cwd(), 'public', 'library-pages')
const MANIFEST_PATH = path.join(process.cwd(), 'src', 'lib', 'library-pages-manifest.ts')

async function main() {
  // ==================== 1. NOVOS MENTORES ====================
  console.log('🧑‍🏫 Promovendo novos mentores...')
  const mentorSpecs = [
    {
      email: 'camila@demo.com',
      headline: 'Psicóloga organizacional · produtividade, hábitos e mindfulness',
      description:
        'Psicóloga organizacional com 8 anos ajudando profissionais a renderem mais sem esgotar. Minha abordagem junta ciência comportamental e prática diária: nada de hype, apenas sistemas que sobrevivem às semanas difíceis. Já atendi mais de 400 alunos em programas de hábitos, foco e bem-estar.',
      categories: ['Saúde & Bem-estar', 'Carreira'],
      hourlyRate: 110,
      experienceYears: 8,
      bio: 'Psicóloga organizacional. Ajudo pessoas a construir rotinas e hábitos que duram.',
    },
    {
      email: 'fernanda@demo.com',
      headline: 'Confeiteira profissional · doceria própria há 6 anos',
      description:
        'Confeiteira profissional, dona da Doceria Fernanda Dias há 6 anos, com mais de 12 mil encomendas entregues. Ensino a técnica que aprendi em cursos e anos de bancada — e o negócio por trás dos doces: precificação, embalagem e como conseguir os primeiros clientes sem queimar dinheiro.',
      categories: ['Culinária', 'Negócios'],
      hourlyRate: 90,
      experienceYears: 6,
      bio: 'Confeiteira profissional e dona de doceria. Ensino técnica e o negócio por trás dos doces.',
    },
    {
      email: 'lucas@demo.com',
      headline: 'Fotógrafo profissional · produto e retrato',
      description:
        'Fotógrafo profissional há 7 anos, especializado em fotografia de produto para e-commerce e retratos. Já realizei mais de 300 ensaios para pequenos negócios e marcas locais. Meu foco no ensino: método e luz — não equipamento caro. O melhor setup é o que você tem hoje.',
      categories: ['Fotografia'],
      hourlyRate: 100,
      experienceYears: 7,
      bio: 'Fotógrafo profissional de produto e retrato. Ensino a fazer mais com o equipamento que você já tem.',
    },
    {
      email: 'thiago@demo.com',
      headline: 'Músico e professor de violão · 10 anos de ensino',
      description:
        'Músico profissional e professor de violão há 10 anos, com método próprio que já levou mais de 500 alunos absolutos do zero ao primeiro show. Meu compromisso: você toca uma música completa nas primeiras semanas — sem teoria solta, com músicas brasileiras que você ama.',
      categories: ['Música'],
      hourlyRate: 80,
      experienceYears: 10,
      bio: 'Músico e professor de violão. Do zero à sua primeira música completa com método progressivo.',
    },
  ]

  const mentorIds = new Map<string, string>()
  for (const spec of mentorSpecs) {
    const user = await db.user.findUnique({ where: { email: spec.email } })
    if (!user) throw new Error(`Usuário não encontrado: ${spec.email}`)
    const existing = await db.mentorProfile.findUnique({ where: { userId: user.id } })
    const data = {
      headline: spec.headline,
      description: spec.description,
      categories: JSON.stringify(spec.categories),
      hourlyRate: spec.hourlyRate,
      experienceYears: spec.experienceYears,
      isPublished: true,
    }
    const profile = existing
      ? await db.mentorProfile.update({ where: { id: existing.id }, data })
      : await db.mentorProfile.create({ data: { userId: user.id, ...data } })
    mentorIds.set(spec.email, profile.id)
    console.log(`  ✓ mentor: ${user.name} (${spec.email})`)
  }
  // mentores já existentes
  for (const email of ['carlos@demo.com', 'marina@demo.com', 'rafael@demo.com', 'beatriz@demo.com', 'david@demo.com', 'sofia@demo.com', 'ana@demo.com', 'gustavonv@yandex.com']) {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) continue
    const p = await db.mentorProfile.findUnique({ where: { userId: user.id } })
    if (p) mentorIds.set(email, p.id)
  }

  // Disponibilidades dos novos mentores (noites + sábado)
  const availSpecs: Record<string, [number, number, number][]> = {
    'camila@demo.com': [
      [1, 18, 21],
      [3, 18, 21],
      [5, 18, 21],
      [6, 9, 12],
    ],
    'fernanda@demo.com': [
      [2, 14, 18],
      [4, 14, 18],
      [6, 9, 13],
    ],
    'lucas@demo.com': [
      [1, 9, 12],
      [3, 9, 12],
      [5, 14, 18],
      [6, 10, 14],
    ],
    'thiago@demo.com': [
      [2, 18, 21],
      [4, 18, 21],
      [6, 10, 13],
    ],
  }
  for (const [email, slots] of Object.entries(availSpecs)) {
    const mentorId = mentorIds.get(email)
    if (!mentorId) continue
    const count = await db.availability.count({ where: { mentorId } })
    if (count === 0) {
      for (const [weekday, startHour, endHour] of slots) {
        await db.availability.create({ data: { mentorId, weekday, startHour, endHour } })
      }
      console.log(`  ✓ disponibilidade: ${email}`)
    }
  }

  // ==================== 2. CURSOS ====================
  console.log('🎓 Criando cursos...')
  const allCourses: CourseDef[] = [...techCourses, ...careerCourses, ...newAreaCourses]
  let createdCourses = 0
  for (const def of allCourses) {
    const exists = await db.course.findFirst({ where: { title: def.title } })
    if (exists) {
      console.log(`  ↷ já existe: ${def.title}`)
      continue
    }
    const mentorId = mentorIds.get(def.mentorEmail)
    if (!mentorId) throw new Error(`Mentor sem perfil: ${def.mentorEmail}`)
    const c = await db.course.create({
      data: {
        mentorId,
        title: def.title,
        description: def.description,
        category: def.category,
        level: def.level,
        price: def.price,
        coverUrl: def.coverUrl,
        mentorshipCount: def.mentorshipCount ?? 0,
        isPublished: true,
      },
    })
    let lessonOrder = 0
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
        }
      }
    }
    createdCourses++
    console.log(`  ✓ ${def.title} (${lessonOrder} aulas)`)
  }

  // Recape: curso antigo sem capa/aulas
  console.log('♻️  Recapando "Testes e Qualidade de Código"...')
  const testes = await db.course.findFirst({ where: { title: 'Testes e Qualidade de Código' } })
  if (testes) {
    const lessonCount = await db.lesson.count({ where: { courseId: testes.id } })
    await db.course.update({
      where: { id: testes.id },
      data: { coverUrl: courseTestesFix.coverUrl, description: testes.description || 'Domine testes unitários, integração e a mentalidade de qualidade que separa código frágil de código confiável.' },
    })
    if (lessonCount === 0) {
      let order = 0
      for (const l of courseTestesFix.lessons) {
        order++
        const created = await db.lesson.create({
          data: {
            courseId: testes.id,
            title: l.title,
            description: l.description,
            kind: 'TEXT',
            content: l.content,
            durationMin: l.durationMin,
            order,
            attachments: '[]',
          },
        })
        for (const q of courseTestesFix.quizzes) {
          if (q.lessonIndex === order - 1) {
            for (const item of q.quiz) {
              await db.quiz.create({
                data: {
                  lessonId: created.id,
                  prompt: item.prompt,
                  options: JSON.stringify(item.options),
                  correctIndex: item.correctIndex,
                  explanation: item.explanation,
                  order: 1,
                },
              })
            }
          }
        }
      }
      console.log(`  ✓ capa + ${order} aulas adicionadas`)
    } else {
      console.log('  ↷ já tem aulas, só capa atualizada')
    }
  }

  // ==================== 3. LIVROS (com PDF + páginas) ====================
  console.log('📚 Criando livros...')
  const manifestEntries: { id: string; title: string; totalPages: number }[] = []
  for (const book of newBooks) {
    let item = await db.libraryItem.findFirst({ where: { title: book.title } })
    // gera o PDF
    const pdfPath = path.join(SEED_DIR, book.pdfSlug)
    if (!fs.existsSync(pdfPath)) {
      writePdf(pdfPath, book.title, book.subtitle, book.author, book.pages)
      console.log(`  ✓ PDF gerado: ${book.pdfSlug}`)
    }
    const pdfUrl = `/uploads/seed/${book.pdfSlug}`
    if (!item) {
      const mentorId = mentorIds.get(book.mentorEmail)
      if (!mentorId) throw new Error(`Mentor sem perfil: ${book.mentorEmail}`)
      item = await db.libraryItem.create({
        data: {
          mentorId,
          kind: 'BOOK',
          title: book.title,
          description: book.description,
          category: book.category,
          level: book.level,
          coverUrl: book.coverUrl,
          pdfUrl,
          readingMin: book.pages.length * 5,
          isPublished: true,
        },
      })
      console.log(`  ✓ livro criado: ${book.title} (${item.id})`)
    } else {
      await db.libraryItem.update({ where: { id: item.id }, data: { coverUrl: book.coverUrl, pdfUrl } })
      console.log(`  ↷ livro já existe: ${book.title}`)
    }
    // renderiza páginas do leitor nativo
    const itemPagesDir = path.join(PAGES_DIR, item.id)
    if (!fs.existsSync(itemPagesDir)) {
      fs.mkdirSync(itemPagesDir, { recursive: true })
      execSync(`pdftoppm -png -r 60 "${pdfPath}" "${path.join(itemPagesDir, 'p')}"`)
      const files = fs.readdirSync(itemPagesDir).sort()
      // renomeia p-1.png → p1.png (padrão do leitor)
      for (const f of files) {
        const m = f.match(/^p-(\d+)\.png$/)
        if (m) fs.renameSync(path.join(itemPagesDir, f), path.join(itemPagesDir, `p${m[1]}.png`))
      }
      console.log(`  ✓ ${files.length} páginas renderizadas`)
    }
    const totalPages = fs.readdirSync(itemPagesDir).filter((f) => f.endsWith('.png')).length
    manifestEntries.push({ id: item.id, title: book.title, totalPages })
  }

  // ==================== 4. ARTIGOS ====================
  console.log('📰 Criando artigos...')
  for (const art of newArticles) {
    const exists = await db.libraryItem.findFirst({ where: { title: art.title } })
    if (exists) {
      console.log(`  ↷ já existe: ${art.title}`)
      continue
    }
    const mentorId = mentorIds.get(art.mentorEmail)
    if (!mentorId) throw new Error(`Mentor sem perfil: ${art.mentorEmail}`)
    await db.libraryItem.create({
      data: {
        mentorId,
        kind: 'ARTICLE',
        title: art.title,
        description: art.description,
        category: art.category,
        level: art.level,
        coverUrl: art.coverUrl,
        content: art.content,
        readingMin: art.readingMin,
        isPublished: true,
      },
    })
    console.log(`  ✓ artigo: ${art.title}`)
  }

  // ==================== 5. CORREÇÃO DE CAPAS ====================
  console.log('🖼️  Corrigindo capas faltantes...')
  for (const fix of coverFixes) {
    const item = await db.libraryItem.findFirst({ where: { title: fix.titleEquals } })
    if (item && !item.coverUrl) {
      await db.libraryItem.update({ where: { id: item.id }, data: { coverUrl: fix.coverUrl } })
      console.log(`  ✓ capa: ${fix.titleEquals}`)
    } else if (item?.coverUrl) {
      await db.libraryItem.update({ where: { id: item.id }, data: { coverUrl: fix.coverUrl } })
      console.log(`  ↷ capa renovada: ${fix.titleEquals}`)
    }
  }

  // ==================== 6. MANIFESTO DE PÁGINAS ====================
  console.log('📄 Atualizando manifesto de páginas...')
  if (!DRY && manifestEntries.length > 0) {
    const current = fs.readFileSync(MANIFEST_PATH, 'utf8')
    let next = current
    for (const entry of manifestEntries) {
      if (next.includes(`'${entry.id}'`) || next.includes(`${entry.id}:`)) continue
      const lastBrace = next.lastIndexOf('}')
      next =
        next.slice(0, lastBrace) +
        `  '${entry.id}': { totalPages: ${entry.totalPages} }, // ${entry.title}\n` +
        next.slice(lastBrace)
    }
    if (next !== current) {
      fs.writeFileSync(MANIFEST_PATH, next)
      console.log('  ✓ manifesto atualizado')
    } else {
      console.log('  ↷ manifesto já contém as entradas')
    }
  }

  console.log('\n=== RESUMO ===')
  console.log(`Cursos criados: ${createdCourses}`)
  console.log(`Livros no lote: ${newBooks.length} · Artigos: ${newArticles.length} · Capas corrigidas: ${coverFixes.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
