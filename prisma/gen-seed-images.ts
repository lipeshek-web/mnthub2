// Gera as imagens de seed (avatares e capas) em public/uploads/seed/
// Uso: bun prisma/gen-seed-images.ts
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public', 'uploads', 'seed')

type Job = { file: string; prompt: string; size: '1024x1024' | '1344x768' }

const HEADSHOT = 'photorealistic professional headshot portrait, chest-up, soft studio lighting, neutral softly blurred background with subtle green tones, friendly confident smile, high quality, detailed, shallow depth of field, no text'

const jobs: Job[] = [
  // ---------- Mentores (avatares) ----------
  {
    file: 'avatar-carlos.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a Brazilian man in his late 30s, senior software engineer, short dark hair, light stubble, wearing a dark casual shirt, ${HEADSHOT}`,
  },
  {
    file: 'avatar-marina.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a Brazilian woman in her mid 30s, product manager, shoulder-length brown hair, wearing a smart blazer over a t-shirt, ${HEADSHOT}`,
  },
  {
    file: 'avatar-rafael.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a Brazilian man in his early 30s, growth marketer, curly dark hair, wearing a smart casual hoodie, energetic look, ${HEADSHOT}`,
  },
  {
    file: 'avatar-beatriz.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a Brazilian woman in her late 20s, UI/UX designer, long dark wavy hair, creative style with subtle earrings, wearing a mustard yellow top, ${HEADSHOT}`,
  },
  {
    file: 'avatar-david.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a Black Brazilian man in his early 40s, certified financial advisor, short hair, neat beard, wearing an elegant navy suit jacket with open collar shirt, ${HEADSHOT}`,
  },
  {
    file: 'avatar-sofia.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a Brazilian woman in her mid 40s, English teacher, blonde hair tied back, warm approachable smile, wearing a light blue blouse, ${HEADSHOT}`,
  },
  {
    file: 'avatar-ana.png',
    size: '1024x1024',
    prompt: `Professional headshot portrait of a young Brazilian woman in her mid 20s, product designer, straight dark bob haircut, round glasses, wearing a sage green sweater, ${HEADSHOT}`,
  },
  // ---------- Alunos (avatares) ----------
  {
    file: 'avatar-lucas.png',
    size: '1024x1024',
    prompt: `Casual headshot portrait of a young Brazilian man in his mid 20s, backend developer, glasses, dark hair, wearing a grey t-shirt, neutral background, ${HEADSHOT}`,
  },
  {
    file: 'avatar-julia.png',
    size: '1024x1024',
    prompt: `Casual headshot portrait of a Brazilian woman in her early 30s, entrepreneur, long black hair, wearing a white shirt, neutral background, ${HEADSHOT}`,
  },
  {
    file: 'avatar-pedro.png',
    size: '1024x1024',
    prompt: `Casual headshot portrait of a young Brazilian man in his early 20s, junior designer, afro hair, wearing a denim jacket, neutral background, ${HEADSHOT}`,
  },
  {
    file: 'avatar-camila.png',
    size: '1024x1024',
    prompt: `Casual headshot portrait of a Brazilian woman in her late 20s, full-stack developer, brown wavy hair, wearing a black t-shirt, neutral background, ${HEADSHOT}`,
  },
  {
    file: 'avatar-fernanda.png',
    size: '1024x1024',
    prompt: `Casual headshot portrait of a young Brazilian woman in her early 20s, marketing student, long light brown hair, wearing a coral blouse, neutral background, ${HEADSHOT}`,
  },
  {
    file: 'avatar-thiago.png',
    size: '1024x1024',
    prompt: `Casual headshot portrait of a Brazilian man in his late 20s, product manager student, short hair and trimmed beard, wearing a polo shirt, neutral background, ${HEADSHOT}`,
  },
  // ---------- Capas de perfil (mentores) ----------
  {
    file: 'cover-carlos.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: modern developer desk setup at night with code editors glowing on two monitors, deep emerald green and dark stone tones, minimalist, moody cinematic lighting, no text, no people',
  },
  {
    file: 'cover-marina.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: clean product management workspace from above with kanban board, sticky notes, laptop and coffee, soft warm light, teal and amber accents, minimalist flat-lay photography, no text, no people',
  },
  {
    file: 'cover-rafael.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: abstract growth marketing concept with rising arrow charts and conversion funnel shapes, vibrant green gradient background, modern flat illustration, minimalist, no text, no people',
  },
  {
    file: 'cover-beatriz.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: designer workspace with color swatches, typography specimens, graphic tablet and sketchbook, soft daylight, beige and terracotta palette, elegant flat-lay photography, no text, no people',
  },
  {
    file: 'cover-david.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: elegant personal finance concept, minimalist desk with notebook, pen, chess piece and subtle golden bokeh, deep navy and gold tones, premium feel, no text, no people',
  },
  {
    file: 'cover-sofia.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: cozy language learning scene with open notebooks, flashcards and a stack of classic books, soft morning light, fresh blue and cream palette, minimalist flat-lay photography, no text, no people',
  },
  {
    file: 'cover-ana.png',
    size: '1344x768',
    prompt: 'Wide profile banner background: UX designer workspace with wireframe sketches, lo-fi paper prototypes and a laptop showing design software, soft sage green and cream tones, minimalist flat-lay, no text, no people',
  },
  // ---------- Capas de cursos ----------
  {
    file: 'course-arquitetura.png',
    size: '1344x768',
    prompt: 'Online course cover banner about software architecture: clean isometric illustration of layered application blocks connected by lines, deep emerald green background, modern flat design, subtle grid, generous empty space, no text',
  },
  {
    file: 'course-product-manager.png',
    size: '1344x768',
    prompt: 'Online course cover banner about product management: flat illustration of roadmap timeline, target with arrow, and user interview icons, warm amber and cream palette, modern minimal composition, no text',
  },
  {
    file: 'course-design-systems.png',
    size: '1344x768',
    prompt: 'Online course cover banner about design systems: geometric UI components (buttons, cards, toggles) floating in an organized grid, terracotta and blush palette on light background, modern flat illustration, no text',
  },
  {
    file: 'course-growth.png',
    size: '1344x768',
    prompt: 'Online course cover banner about growth marketing: funnel converting into coins and a rising rocket, dynamic diagonal composition, vivid green gradient, modern flat illustration, no text',
  },
  {
    file: 'course-english.png',
    size: '1344x768',
    prompt: 'Online course cover banner about job interviews in English: speech bubbles, briefcase and checklist icons over a calm blue background, subtle paper texture, modern flat illustration, no text',
  },
]

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const zai = await ZAI.create()
  let ok = 0
  let failed = 0

  for (const job of jobs) {
    const outPath = path.join(OUT, job.file)
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000) {
      console.log(`↷ já existe: ${job.file}`)
      ok += 1
      continue
    }
    let done = false
    for (let attempt = 1; attempt <= 2 && !done; attempt++) {
      try {
        const res = await zai.images.generations.create({ prompt: job.prompt, size: job.size })
        const b64 = res.data?.[0]?.base64
        if (!b64) throw new Error('resposta sem base64')
        fs.writeFileSync(outPath, Buffer.from(b64, 'base64'))
        console.log(`✓ ${job.file} (${job.size})`)
        ok += 1
        done = true
      } catch (err) {
        console.error(`✗ ${job.file} (tentativa ${attempt}):`, err instanceof Error ? err.message : err)
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1500))
        else failed += 1
      }
    }
  }

  console.log(`\nConcluído: ${ok} ok, ${failed} falhas`)
  if (failed > 0) process.exitCode = 1
}

main()
