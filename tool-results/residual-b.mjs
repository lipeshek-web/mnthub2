import { readFileSync } from 'node:fs'
const files = [
  'src/components/platform/marketplace.tsx',
  'src/components/platform/course-view.tsx',
  'src/components/platform/track-view.tsx',
  'src/components/platform/checkout.tsx',
]
const RE = /(?:[a-zA-Z-]+:)*[a-zA-Z]+-(?:white|stone|emerald|amber|rose|teal)(?:-[0-9]+)?(?:\/[0-9]+)?/g
const counts = new Map()
const samples = new Map()
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(RE)) {
      const tok = m[0]
      if (tok.startsWith('dark:')) continue
      counts.set(tok, (counts.get(tok) ?? 0) + 1)
      if (!samples.has(tok)) samples.set(tok, `${f}:${i + 1}`)
    }
  })
}
for (const [tok, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(String(n).padStart(3), tok.padEnd(38), samples.get(tok))
}
