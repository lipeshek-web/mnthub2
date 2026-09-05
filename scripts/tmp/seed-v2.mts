// Seed v2 — reforço de conteúdo + EVENTOS (diferencial multi-participante).
// Uso: set -a; source .zscripts/cloud.env; set +a; bun scripts/tmp/seed-v2.mts [--dry]
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { academicCourses, topupLessons, tccBooks, tccArticles } from './seed-data-4'
import { writePdf } from './pdf-gen'

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
  return new PrismaClient()
}
const db = makeDb()
const DRY = process.argv.includes('--dry')
const SEED_DIR = path.join(process.cwd(), 'public', 'uploads', 'seed')
const PAGES_DIR = path.join(process.cwd(), 'public', 'library-pages')
const MANIFEST_PATH = path.join(process.cwd(), 'src', 'lib', 'library-pages-manifest.ts')

/** naive "YYYY-MM-DDTHH:mm" no fuso do servidor (mesma convenção de Booking) */
function naive(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
function daysFromNow(days: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return naive(d)
}

async function main() {
  // ==================== 1. MENTORES (emails → mentorProfile.id) ====================
  const mentors = await db.mentorProfile.findMany({
    include: { user: { select: { email: true } } },
  })
  const mentorIds = new Map(mentors.map((m) => [m.user.email, m.id]))
  const hostIds = new Map(mentors.map((m) => [m.user.email, m.userId]))
  console.log(`Mentores disponíveis: ${mentorIds.size}`)

  // ==================== 2. CURSOS NOVOS ====================
  console.log('🎓 Criando cursos acadêmicos/novos...')
  let createdCourses = 0
  for (const def of academicCourses) {
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

  // ==================== 3. REFORÇO DOS CURSOS RASOS ====================
  console.log('🧩 Reforçando cursos com poucas aulas...')
  let addedLessons = 0
  for (const topup of topupLessons) {
    const course = await db.course.findFirst({ where: { title: topup.courseTitle } })
    if (!course) {
      console.log(`  ✗ curso não encontrado: ${topup.courseTitle}`)
      continue
    }
    const existing = await db.lesson.count({ where: { courseId: course.id } })
    let order = existing
    for (const lessonDef of topup.lessons) {
      order++
      const l = await db.lesson.create({
        data: {
          courseId: course.id,
          title: lessonDef.title,
          description: lessonDef.description,
          kind: 'TEXT',
          content: lessonDef.content,
          durationMin: lessonDef.durationMin,
          order,
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
      addedLessons++
    }
    console.log(`  ✓ ${topup.courseTitle}: +${topup.lessons.length} aulas (agora ${order})`)
  }

  // ==================== 4. LIVRO TCC (PDF + páginas) ====================
  console.log('📚 Criando livro Guia do TCC...')
  const manifestEntries: { id: string; title: string; totalPages: number }[] = []
  for (const book of tccBooks) {
    let item = await db.libraryItem.findFirst({ where: { title: book.title } })
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
      console.log(`  ↷ livro já existe: ${book.title}`)
    }
    const itemPagesDir = path.join(PAGES_DIR, item.id)
    if (!fs.existsSync(itemPagesDir)) {
      fs.mkdirSync(itemPagesDir, { recursive: true })
      execSync(`pdftoppm -png -r 60 "${pdfPath}" "${path.join(itemPagesDir, 'p')}"`)
      for (const f of fs.readdirSync(itemPagesDir).sort()) {
        const m = f.match(/^p-(\d+)\.png$/)
        if (m) fs.renameSync(path.join(itemPagesDir, f), path.join(itemPagesDir, `p${m[1]}.png`))
      }
      console.log(`  ✓ páginas renderizadas em ${item.id}`)
    }
    const totalPages = fs.readdirSync(itemPagesDir).filter((f) => f.endsWith('.png')).length
    manifestEntries.push({ id: item.id, title: book.title, totalPages })
  }

  // ==================== 5. ARTIGOS TCC ====================
  console.log('📰 Criando artigos...')
  for (const art of tccArticles) {
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

  // ==================== 6. EVENTOS DEMO (diferencial multi-participante) ====================
  console.log('📅 Criando eventos demo...')
  const guestEmails = ['ana@demo.com', 'david@demo.com', 'beatriz@demo.com', 'rafael@demo.com', 'sofia@demo.com']
  const eventSpecs = [
    {
      hostEmail: 'carlos@demo.com',
      title: 'Mentoria coletiva: revisão de código aberta',
      description:
        'Traga seu código (de projeto, TCC ou trabalho) e vamos revisar juntos ao vivo: arquitetura, nomes, testes e próximos passos. Reunião com vários participantes — todos podem ligar câmera e microfone, perguntar e comentar. Aqui dentro da plataforma, sem YouTube e sem links externos.',
      category: 'Tecnologia',
      startsAt: naive(new Date(Date.now() - 15 * 60_000)), // AO VIVO agora
      durationMin: 150,
      capacity: 10,
      guests: 4,
    },
    {
      hostEmail: 'camila@demo.com',
      title: 'Como começar o seu TCC — sessão de dúvidas ao vivo',
      description:
        'Reunião aberta para quem está travado no TCC: escolha do tema, delimitação, projeto de pesquisa e rotina de escrita. Traga suas perguntas — vou responder ao vivo e montar um plano com vocês. Complementa o curso "Manual do TCC" e o "Guia Prático do TCC" da biblioteca.',
      category: 'Acadêmico',
      startsAt: daysFromNow(1, 19, 0),
      durationMin: 90,
      capacity: 12,
      guests: 3,
    },
    {
      hostEmail: 'sofia@demo.com',
      title: 'Círculo de estudos: inglês para entrevistas',
      description:
        'Roda de conversa em inglês focada em entrevistas: respostas STAR, pronúncia de termos técnicos e feedback instantâneo entre os participantes. Sala com câmera ligada — todos praticam, todos corrigem.',
      category: 'Carreira',
      startsAt: daysFromNow(3, 20, 0),
      durationMin: 60,
      capacity: 8,
      guests: 2,
    },
    {
      hostEmail: 'marina@demo.com',
      title: 'Defesa simulada: apresente seu projeto de TCC',
      description:
        'Simulação de banca: cada participante apresenta 5 minutos do seu projeto/trabalho e recebe perguntas do grupo, como numa defesa real. Ideal para treinar antes da apresentação de verdade — com feedback de metodologia e forma.',
      category: 'Acadêmico',
      startsAt: daysFromNow(5, 19, 30),
      durationMin: 90,
      capacity: 6,
      guests: 2,
    },
    {
      hostEmail: 'david@demo.com',
      title: 'Plantão de dúvidas: Excel e finanças pessoais',
      description:
        'Traga sua planilha (ouçamos casos reais): fórmulas que não batem, tabela dinâmica travada, controle de gastos que não fecha. Reunião ao vivo com compartilhamento de tela — resolvemos juntos.',
      category: 'Negócios',
      startsAt: daysFromNow(2, 20, 30),
      durationMin: 60,
      capacity: 10,
      guests: 2,
    },
  ]
  let createdEvents = 0
  for (const spec of eventSpecs) {
    const exists = await db.event.findFirst({ where: { title: spec.title } })
    if (exists) {
      console.log(`  ↷ já existe: ${spec.title}`)
      continue
    }
    const hostId = hostIds.get(spec.hostEmail)
    if (!hostId) throw new Error(`Usuário host não encontrado: ${spec.hostEmail}`)
    const ev = await db.event.create({
      data: {
        title: spec.title,
        description: spec.description,
        category: spec.category,
        hostId,
        startsAt: spec.startsAt,
        durationMin: spec.durationMin,
        capacity: spec.capacity,
        status: 'SCHEDULED',
        participants: { create: { userId: hostId, role: 'HOST' } },
      },
    })
    // participantes demo (assentos reservados)
    for (const email of guestEmails.slice(0, spec.guests)) {
      const u = await db.user.findUnique({ where: { email }, select: { id: true } })
      if (!u || u.id === hostId) continue
      try {
        await db.eventParticipant.create({ data: { eventId: ev.id, userId: u.id, role: 'GUEST' } })
      } catch {
        /* já participa */
      }
    }
    createdEvents++
    console.log(`  ✓ evento: ${spec.title} · ${spec.startsAt} · cap ${spec.capacity}`)
  }

  // ==================== 7. MANIFESTO ====================
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
      console.log('✓ manifesto de páginas atualizado')
    }
  }

  console.log('\n=== RESUMO ===')
  console.log(`Cursos criados: ${createdCourses} · Aulas de reforço: ${addedLessons}`)
  console.log(`Livros: ${tccBooks.length} · Artigos: ${tccArticles.length} · Eventos: ${createdEvents}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
