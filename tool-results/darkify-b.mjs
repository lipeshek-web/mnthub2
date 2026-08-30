// Task 14-c-b — additive dark: classes for marketplace/course-view/track-view/checkout
// ADDITIVE ONLY: inserts `dark:*` right after the matching light token. Never removes/edits light classes.
import { readFileSync, writeFileSync } from 'node:fs'

const ROOT = '/home/z/my-project/'

// ---- shared color mapping (Task 14 table) ----
const TABLE = {
  // stone text
  'text-stone-900': 'dark:text-stone-50',
  'text-stone-800': 'dark:text-stone-200',
  'text-stone-700': 'dark:text-stone-200',
  'text-stone-600': 'dark:text-stone-300',
  'text-stone-500': 'dark:text-stone-400',
  'text-stone-400': 'dark:text-stone-500',
  'text-stone-300': 'dark:text-stone-600',
  'placeholder:text-stone-400': 'dark:placeholder:text-stone-500',
  // stone surfaces / borders
  'bg-white': 'dark:bg-stone-900',
  'bg-stone-100': 'dark:bg-stone-800',
  'bg-stone-50/80': 'dark:bg-stone-950/50',
  'bg-stone-50/60': 'dark:bg-stone-950/50',
  'border-stone-100': 'dark:border-stone-800',
  'border-stone-200': 'dark:border-stone-800',
  'border-stone-200/70': 'dark:border-stone-800',
  'border-stone-300': 'dark:border-stone-700',
  'divide-stone-100': 'dark:divide-stone-800',
  // stone variants
  'hover:text-stone-700': 'dark:hover:text-stone-200',
  'hover:text-stone-900': 'dark:hover:text-stone-50',
  'hover:bg-stone-100': 'dark:hover:bg-stone-800',
  'hover:border-stone-300': 'dark:hover:border-stone-700',
  // emerald soft
  'bg-emerald-50': 'dark:bg-emerald-950/50',
  'bg-emerald-50/40': 'dark:bg-emerald-950/50',
  'bg-emerald-50/60': 'dark:bg-emerald-950/50',
  'bg-emerald-50/70': 'dark:bg-emerald-950/50',
  'bg-emerald-100': 'dark:bg-emerald-950/50',
  'text-emerald-600': 'dark:text-emerald-400',
  'text-emerald-700': 'dark:text-emerald-300',
  'text-emerald-800': 'dark:text-emerald-300',
  'text-emerald-800/80': 'dark:text-emerald-300/80',
  'text-emerald-900': 'dark:text-emerald-200',
  'border-emerald-100': 'dark:border-emerald-900',
  'border-emerald-200': 'dark:border-emerald-900',
  'border-emerald-300': 'dark:border-emerald-700',
  'hover:border-emerald-300': 'dark:hover:border-emerald-700',
  'hover:bg-emerald-50': 'dark:hover:bg-emerald-950/50',
  'hover:bg-emerald-50/40': 'dark:hover:bg-emerald-900/30',
  'hover:text-emerald-700': 'dark:hover:text-emerald-300',
  'hover:text-emerald-800': 'dark:hover:text-emerald-200',
  'group-hover:text-emerald-900': 'dark:group-hover:text-emerald-300',
  'focus-visible:border-emerald-400': 'dark:focus-visible:border-emerald-700',
  'focus-visible:ring-emerald-200': 'dark:focus-visible:ring-emerald-900/40',
  // amber soft
  'bg-amber-50': 'dark:bg-amber-950/50',
  'bg-amber-100': 'dark:bg-amber-950/50',
  'hover:bg-amber-100': 'dark:hover:bg-amber-950/50',
  'text-amber-600': 'dark:text-amber-400',
  'text-amber-700': 'dark:text-amber-400',
  'text-amber-800': 'dark:text-amber-300',
  'border-amber-200': 'dark:border-amber-900',
  // rose soft
  'bg-rose-50': 'dark:bg-rose-950/50',
  'text-rose-600': 'dark:text-rose-400',
  // teal soft
  'bg-teal-50': 'dark:bg-teal-950/50',
  'hover:bg-teal-50': 'dark:hover:bg-teal-950/50',
  'text-teal-700': 'dark:text-teal-300',
  'border-teal-200': 'dark:border-teal-900',
}

// tokens that stay as-is even though they match the table prefix patterns (kept via explicit skips)
const SKIP_TOKENS = new Set([
  'bg-white/90', 'bg-white/95', 'bg-white/15', 'bg-white/30',
  'hover:bg-white/15', 'hover:bg-white/95', 'hover:bg-white/50',
])

// per-file, per-line (1-based) overrides: token -> replacement dark token, or null = keep untouched
const FILES = {
  'src/components/platform/marketplace.tsx': {
    463: { 'bg-white': 'dark:bg-stone-950' },      // faixa superior da página
    1449: { 'bg-white': null },                    // dots do spotlight sobre emerald-950
    1513: { 'bg-white': null },                    // botão branco sobre emerald-950
    1747: { 'bg-white': null },
    1946: { 'bg-white': null },
    2160: { 'bg-white': null },
    1783: { 'text-stone-700': null },              // chip de nível sobre capa
    1985: { 'text-stone-700': null },
    2203: { 'text-stone-700': null },
    1791: { 'bg-white': null, 'text-stone-900': null }, // chip de preço sobre capa
    1993: { 'bg-white': null, 'text-stone-900': null },
  },
  'src/components/platform/course-view.tsx': {
    298: { 'bg-white': null },                     // botão branco no hero emerald-950
    799: { 'hover:bg-emerald-100': 'dark:hover:bg-emerald-900/40' },
  },
  'src/components/platform/track-view.tsx': {
    240: { 'text-emerald-900': null },             // badge branco sobre gradiente do hero
    609: { 'bg-white': 'dark:bg-stone-950/50' },   // chip inset dentro de painel emerald
  },
  'src/components/platform/checkout.tsx': {
    365: { 'bg-stone-50/60': 'dark:bg-stone-950/50' }, // dl dentro do Card de sucesso
    756: { 'bg-stone-50/60': 'dark:bg-stone-900/60' }, // caixa PIX na página
    611: { 'bg-white': 'dark:bg-stone-950/50' },   // chip do código do cupom (inset)
    622: { 'hover:bg-white': 'dark:hover:bg-stone-950/50' },
  },
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const DARK_RE = /\s?dark:[^\s'"`]+/g

let totalAdded = 0
const perFile = {}

for (const [rel, overrides] of Object.entries(FILES)) {
  const path = ROOT + rel
  const original = readFileSync(path, 'utf8')
  const lines = original.split('\n')
  let added = 0
  const tokens = Object.keys(TABLE).concat([...SKIP_TOKENS]).sort((a, b) => b.length - a.length)

  for (let i = 0; i < lines.length; i++) {
    const n = i + 1
    const lineOverrides = overrides?.[n] ?? {}
    let line = lines[i]
    for (const token of tokens) {
      if (!line.includes(token)) continue
      const re = new RegExp('(?<![\\w:/.-])' + esc(token) + '(?![\\w/-])', 'g')
      if (SKIP_TOKENS.has(token)) {
        line = line.replace(re, token) // no-op; guards only
        continue
      }
      if (lineOverrides.hasOwnProperty(token)) {
        const dark = lineOverrides[token]
        if (dark === null) continue
        if (line.includes(dark)) continue
        line = line.replace(re, `${token} ${dark}`)
        added++
        continue
      }
      const dark = TABLE[token]
      if (line.includes(dark)) continue
      line = line.replace(re, `${token} ${dark}`)
      added++
    }
    lines[i] = line
  }

  const result = lines.join('\n')
  // ---- ADDITIVE-ONLY proof: removing every dark: token must reproduce the original line ----
  const before = original.split('\n')
  const after = result.split('\n')
  if (before.length !== after.length) throw new Error(`${rel}: line count changed!`)
  let broken = 0
  for (let i = 0; i < before.length; i++) {
    const stripped = after[i].replace(DARK_RE, '')
    const origStripped = before[i].replace(DARK_RE, '')
    if (stripped !== origStripped) { broken++; console.error(`  NON-ADDITIVE @${rel}:${i + 1}`) }
  }
  if (broken > 0) throw new Error(`${rel}: ${broken} non-additive lines`)
  writeFileSync(path, result)
  perFile[rel] = added
  totalAdded += added
  console.log(`${rel}: +${added} dark: classes (additive check OK)`)
}
console.log(`TOTAL: +${totalAdded} dark: classes`)
