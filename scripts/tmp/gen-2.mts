import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
const STYLE = 'flat isometric illustration, emerald green and teal color palette with white accents, clean modern tech-education cover art, soft shadows, subtle grid background, no text, no letters, no words, high quality, detailed'
const items = [
  { slug: 'artigo-30-expressoes', prompt: `open dictionary with speech bubbles floating, ear with sound waves, pronunciation icons, interview handshake small icon, ${STYLE}` },
  { slug: 'artigo-playbook-funil', prompt: `isometric sales funnel with seven numbered diagnostic cards floating around, magnifying glass over conversion chart, coins falling through funnel, ${STYLE}` },
]
const zai = await ZAI.create()
for (const it of items) {
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await zai.images.generations.create({ prompt: it.prompt, size: '1344x768' })
      fs.writeFileSync(`public/uploads/seed/${it.slug}.png`, Buffer.from(res.data[0].base64, 'base64'))
      console.log('✓', it.slug)
      break
    } catch (e) {
      console.warn(`tentativa ${a} falhou:`, (e as Error).message.slice(0, 60))
      await new Promise(r => setTimeout(r, 8000))
    }
  }
}
