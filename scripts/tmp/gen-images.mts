// Gera todas as capas novas (cursos, livros e artigos) em public/uploads/seed/
// Uso: bun scripts/tmp/gen-images.mts [--only=slug1,slug2]
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public', 'uploads', 'seed')
fs.mkdirSync(OUT, { recursive: true })

const STYLE =
  'flat isometric illustration, emerald green and teal color palette with white accents, clean modern tech-education cover art, soft shadows, subtle grid background, no text, no letters, no words, high quality, detailed'

const LANDSCAPE = '1344x768'
const PORTRAIT = '768x1344'

type Def = { slug: string; size: string; prompt: string }

const IMAGES: Def[] = [
  // ============ CURSOS (1344x768) ============
  {
    slug: 'course-python',
    size: LANDSCAPE,
    prompt: `friendly python snake mascot coiled around a laptop showing terminal windows with code blocks, gears and automation robots, ${STYLE}`,
  },
  {
    slug: 'course-react',
    size: LANDSCAPE,
    prompt: `isometric atom symbol orbiting UI components, floating browser windows with interface blocks and component library, ${STYLE}`,
  },
  {
    slug: 'course-sql',
    size: LANDSCAPE,
    prompt: `isometric cylindrical database stack with connected tables, rows of data cards and query funnels, magnifying glass, ${STYLE}`,
  },
  {
    slug: 'course-devops',
    size: LANDSCAPE,
    prompt: `isometric shipping containers and conveyor pipeline with gears, cloud icons and continuous delivery arrows between server racks, ${STYLE}`,
  },
  {
    slug: 'course-ia',
    size: LANDSCAPE,
    prompt: `glowing neural network brain with sparkles, chat bubbles and lightbulb, robotic assistant arm holding a magic wand, ${STYLE}`,
  },
  {
    slug: 'course-testes',
    size: LANDSCAPE,
    prompt: `isometric checklist with magnifying glass over code blocks, shield with checkmark, bug icon being caught by a net, quality gears, ${STYLE}`,
  },
  {
    slug: 'course-uiux',
    size: LANDSCAPE,
    prompt: `isometric designer workspace with wireframe screens, color palette, pen tool, prototype flow arrows connecting mobile app screens, ${STYLE}`,
  },
  {
    slug: 'course-canva',
    size: LANDSCAPE,
    prompt: `isometric creative studio with poster templates, photo frames, typography blocks, color swatches and magic resize wand, ${STYLE}`,
  },
  {
    slug: 'course-socialmedia',
    size: LANDSCAPE,
    prompt: `isometric smartphone with engagement hearts and comments floating around, content calendar grid, megaphone, camera and like icons, ${STYLE}`,
  },
  {
    slug: 'course-seo',
    size: LANDSCAPE,
    prompt: `isometric search bar with rocket launching to top position podium, ranking chart bars, keyword tags and magnifying glass, ${STYLE}`,
  },
  {
    slug: 'course-financas',
    size: LANDSCAPE,
    prompt: `isometric piggy bank with coins, budget planner notebook, calculator, savings jar and rising coins stack, house and car mini icons, ${STYLE}`,
  },
  {
    slug: 'course-investimentos',
    size: LANDSCAPE,
    prompt: `isometric rising stock chart with candlestick bars, growing plant made of coins, bull silhouette, portfolio folders and pie chart, ${STYLE}`,
  },
  {
    slug: 'course-espanhol',
    size: LANDSCAPE,
    prompt: `isometric language learning desk with speech bubbles, ¡hola! greeting gesture icons, spanish flag colors bunting, headphones and open book, ${STYLE}`,
  },
  {
    slug: 'course-linkedin',
    size: LANDSCAPE,
    prompt: `isometric professional profile card with briefcase, handshake icon, resume document with checkmarks and rising career stairs, ${STYLE}`,
  },
  {
    slug: 'course-habitos',
    size: LANDSCAPE,
    prompt: `isometric habit tracker calendar with checkmarks, alarm clock, sunrise over mountains, dumbbell and stacked progress rings, ${STYLE}`,
  },
  {
    slug: 'course-meditacao',
    size: LANDSCAPE,
    prompt: `serene flat illustration of person meditating in lotus position on a floating island, calm waves, leaves and breathing circles, zen stones, ${STYLE}`,
  },
  {
    slug: 'course-confeitaria',
    size: LANDSCAPE,
    prompt: `isometric bakery kitchen with layered cake, whisk, piping bag, cupcakes, rolling pin and oven mitts, flour dust sparkles, cozy warm lighting, ${STYLE}`,
  },
  {
    slug: 'course-fotografia',
    size: LANDSCAPE,
    prompt: `isometric giant smartphone with camera lens taking photo of floating framed pictures, tripod, softbox light and color grading sliders, ${STYLE}`,
  },
  {
    slug: 'course-violao',
    size: LANDSCAPE,
    prompt: `isometric acoustic guitar leaning on amplifier with musical notes floating, chord chart grid, pick and metronome, warm stage lighting, ${STYLE}`,
  },
  // ============ LIVROS (768x1344) ============
  {
    slug: 'livro-cleancode',
    size: PORTRAIT,
    prompt: `stack of clean code books with broom sweeping code bugs away, tidy blocks organizing themselves, minimalist book cover art, ${STYLE}`,
  },
  {
    slug: 'livro-marketing-digital',
    size: PORTRAIT,
    prompt: `megaphone broadcasting to small shops and devices, growth funnel with coins, engagement hearts, minimalist book cover art, ${STYLE}`,
  },
  {
    slug: 'livro-bolsa',
    size: PORTRAIT,
    prompt: `rising stock candlestick chart growing from a seedling, safe with coins, bull and bear minimalist icons, book cover art, ${STYLE}`,
  },
  {
    slug: 'livro-receitas',
    size: PORTRAIT,
    prompt: `layered cake with whisk and rolling pin, chef hat, recipe cards and measuring cups, cozy bakery mood, warm accents, book cover art, ${STYLE}`,
  },
  {
    slug: 'livro-foto-produto',
    size: PORTRAIT,
    prompt: `product photography mini studio with smartphone on tripod, softbox lighting a perfume bottle on pedestal, backdrop, book cover art, ${STYLE}`,
  },
  {
    slug: 'livro-rotina',
    size: PORTRAIT,
    prompt: `sunrise alarm clock with habit checklist, journal with pen, energy battery charging, morning window with plants, book cover art, ${STYLE}`,
  },
  {
    slug: 'livro-metodos-estudo',
    size: PORTRAIT,
    prompt: `open book with lightbulb, brain with gears, flashcards and pomodoro timer, memory palace staircase, book cover art, ${STYLE}`,
  },
  // ============ ARTIGOS (1344x768) ============
  {
    slug: 'artigo-entrevistas-tecnicas',
    size: LANDSCAPE,
    prompt: `two people shaking hands across an interview desk with code whiteboard, checklist and briefcase, friendly office scene, ${STYLE}`,
  },
  {
    slug: 'artigo-dados',
    size: LANDSCAPE,
    prompt: `magnifying glass over colorful dashboard charts, bar graphs and pie charts sorting themselves, data funnel, ${STYLE}`,
  },
  {
    slug: 'artigo-ielts',
    size: LANDSCAPE,
    prompt: `passport with airplane, speech bubbles, headphones, english exam answer sheet with pencil, study flashcards, ${STYLE}`,
  },
  {
    slug: 'artigo-seo-local',
    size: LANDSCAPE,
    prompt: `map with location pins, storefront with megaphone, search bar with 5 stars, footprints leading to a shop, ${STYLE}`,
  },
  {
    slug: 'artigo-habitos-matinais',
    size: LANDSCAPE,
    prompt: `morning scene with sunrise, glass of water, journal and pen, yoga mat, checklist with checkmarks, plant on desk, ${STYLE}`,
  },
  // ============ CAPAS FALTANTES (fix) ============
  {
    slug: 'artigo-discovery',
    size: LANDSCAPE,
    prompt: `five big question marks over an isometric whiteboard with user personas, sticky notes and interview funnel, ${STYLE}`,
  },
  {
    slug: 'livro-fundamentos-dados',
    size: PORTRAIT,
    prompt: `foundations of data: stacked database cylinders with flow arrows into charts, tidy grid of rows and columns, book cover art, ${STYLE}`,
  },
]

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
const targets = only ? IMAGES.filter((i) => only.split(',').includes(i.slug)) : IMAGES

async function genOne(zai: Awaited<ReturnType<typeof ZAI.create>>, def: Def): Promise<boolean> {
  const out = path.join(OUT, `${def.slug}.png`)
  if (fs.existsSync(out) && fs.statSync(out).size > 50000) {
    console.log(`↷ já existe: ${def.slug}`)
    return true
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await zai.images.generations.create({ prompt: def.prompt, size: def.size })
      const b64 = res.data?.[0]?.base64
      if (!b64) throw new Error('resposta sem base64')
      const buf = Buffer.from(b64, 'base64')
      if (buf.length < 20000) throw new Error(`imagem pequena demais (${buf.length}b)`)
      fs.writeFileSync(out, buf)
      console.log(`✓ ${def.slug} (${Math.round(buf.length / 1024)}KB)`)
      return true
    } catch (err) {
      console.warn(`✗ ${def.slug} tentativa ${attempt}: ${(err as Error).message}`)
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt))
    }
  }
  return false
}

async function main() {
  const zai = await ZAI.create()
  let ok = 0
  const failed: string[] = []
  const CONC = 1
  for (let i = 0; i < targets.length; i += CONC) {
    const batch = targets.slice(i, i + CONC)
    const results = await Promise.all(batch.map((d) => genOne(zai, d)))
    results.forEach((r, j) => (r ? ok++ : failed.push(batch[j].slug)))
  }
  console.log(`\n=== ${ok}/${targets.length} imagens geradas ===`)
  if (failed.length) {
    console.log('FALHARAM:', failed.join(', '))
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
