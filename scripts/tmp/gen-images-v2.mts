// Gera as capas do seed v2 (TCC/acadêmico + excel + oratória) em public/uploads/seed/
// Uso: bun scripts/tmp/gen-images-v2.mts [--only=slug1,slug2]
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
  {
    slug: 'course-tcc-manual',
    size: LANDSCAPE,
    prompt: `graduation cap on a stack of thick academic books beside an open notebook with flowchart steps, checklist clipboard and compass, journey path with milestones, ${STYLE}`,
  },
  {
    slug: 'course-metodologia',
    size: LANDSCAPE,
    prompt: `isometric laboratory flask combined with magnifying glass over survey charts, balance scale, sample population dots, scientific method flow, ${STYLE}`,
  },
  {
    slug: 'course-redacao-cientifica',
    size: LANDSCAPE,
    prompt: `isometric floating document pages with structured paragraphs and citation brackets, fountain pen, proofreading marks, organized manuscript stack, ${STYLE}`,
  },
  {
    slug: 'course-oratoria',
    size: LANDSCAPE,
    prompt: `isometric podium with microphone and confident speaker silhouette, audience seats, sound waves and speech bubbles, presentation screen with charts, ${STYLE}`,
  },
  {
    slug: 'course-excel',
    size: LANDSCAPE,
    prompt: `isometric giant spreadsheet grid with formula fx symbols, colorful bar and pie charts popping out, calculator and rising graph, data cells, ${STYLE}`,
  },
  {
    slug: 'course-gestao-tempo',
    size: LANDSCAPE,
    prompt: `isometric clock with calendar blocks and hourglass, todo checklist with checkboxes, balanced study schedule planner, alarm clock and focused task cards, ${STYLE}`,
  },
  {
    slug: 'livro-guia-tcc',
    size: PORTRAIT,
    prompt: `portrait book cover: graduation cap with roadmap path winding through milestone flags toward a trophy, open book and checklists, ${STYLE}`,
  },
  {
    slug: 'artigo-tcc-sem-panico',
    size: LANDSCAPE,
    prompt: `calm student desk with organized notes, step-by-step map with numbered waypoints, coffee cup and relaxed posture symbol, mountain being climbed stepwise, ${STYLE}`,
  },
  {
    slug: 'artigo-abnt',
    size: LANDSCAPE,
    prompt: `isometric formatted document page with precise margins and rulers, quotation marks blocks and bibliography cards, ruler and alignment guides, ${STYLE}`,
  },
  {
    slug: 'artigo-citacoes',
    size: LANDSCAPE,
    prompt: `isometric giant quotation marks linked to source book cards with connection lines, fingerprint symbol for originality, reference list page, ${STYLE}`,
  },
  {
    slug: 'artigo-tema-tcc',
    size: LANDSCAPE,
    prompt: `isometric seven glowing question marks in a path toward a bright idea lightbulb on a target, decision crossroads signs, topic selection funnel, ${STYLE}`,
  },
]

async function main() {
  const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7)
  const skip = only ? only.split(',').map((s) => s.trim()) : null
  const zai = await (ZAI as unknown as { create: () => Promise<any> }).create()
  for (const def of IMAGES) {
    if (skip && !skip.includes(def.slug)) continue
    const ext = def.size === PORTRAIT ? '.png' : '.png'
    const out = path.join(OUT, def.slug + ext)
    if (fs.existsSync(out) && fs.statSync(out).size > 10_000) {
      console.log(`↷ já existe: ${def.slug}${ext}`)
      continue
    }
    let ok = false
    for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: def.prompt,
          size: def.size,
        })
        const b64 = res?.data?.[0]?.base64
        if (!b64) throw new Error('resposta sem imagem')
        fs.writeFileSync(out, Buffer.from(b64, 'base64'))
        console.log(`✓ ${def.slug}${ext} (${Math.round(fs.statSync(out).size / 1024)} KB)`)
        ok = true
      } catch (e: any) {
        const msg = String(e?.message ?? e)
        console.log(`  tentativa ${attempt} falhou (${msg.slice(0, 80)})`)
        if (msg.includes('429') || msg.toLowerCase().includes('rate')) {
          await new Promise((r) => setTimeout(r, 20_000 * attempt))
        } else {
          await new Promise((r) => setTimeout(r, 4_000))
        }
      }
    }
    if (!ok) console.log(`✗ FALHOU: ${def.slug}`)
  }
  console.log('concluído')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
