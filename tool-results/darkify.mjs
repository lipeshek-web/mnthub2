// Additive dark-mode class injector for MentorHub area C (Task 14-c-c)
// ONLY appends `dark:` classes next to existing light classes. Never removes/edits light classes.
import { readFileSync, writeFileSync } from 'node:fs'

// token (as it appears in class strings) -> dark base class (without `dark:`)
const RULES = {
  'bg-white': 'bg-stone-900',
  'bg-stone-50': 'bg-stone-950/50',
  'bg-stone-50/60': 'bg-stone-950/50',
  'bg-stone-100': 'bg-stone-800',
  'bg-stone-200': 'bg-stone-800',
  'bg-emerald-50': 'bg-emerald-950/50',
  'bg-emerald-50/40': 'bg-emerald-950/50',
  'bg-emerald-50/60': 'bg-emerald-950/50',
  'bg-emerald-100': 'bg-emerald-950/50',
  'bg-emerald-200': 'bg-emerald-800',
  'bg-amber-50': 'bg-amber-950/50',
  'bg-amber-50/60': 'bg-amber-950/50',
  'bg-amber-100': 'bg-amber-950/50',
  'bg-teal-50': 'bg-teal-950/50',
  'bg-orange-100': 'bg-orange-950/50',
  'bg-rose-50': 'bg-rose-950/50',
  'border-stone-100': 'border-stone-800',
  'border-stone-200': 'border-stone-800',
  'border-stone-300': 'border-stone-700',
  'border-emerald-200': 'border-emerald-900',
  'border-emerald-300': 'border-emerald-700',
  'border-amber-200': 'border-amber-900',
  'border-amber-300': 'border-amber-800',
  'border-teal-200': 'border-teal-900',
  'divide-stone-100': 'divide-stone-800',
  'divide-stone-200': 'divide-stone-800',
  'ring-stone-200': 'ring-stone-800',
  'ring-emerald-100': 'ring-emerald-900/40',
  'ring-emerald-200': 'ring-emerald-900',
  'ring-amber-100': 'ring-amber-900/40',
  'ring-amber-200': 'ring-amber-900',
  'ring-rose-100': 'ring-rose-900',
  'ring-teal-100': 'ring-teal-900/40',
  'text-stone-900': 'text-stone-50',
  'text-stone-800': 'text-stone-200',
  'text-stone-700': 'text-stone-200',
  'text-stone-600': 'text-stone-300',
  'text-stone-500': 'text-stone-400',
  'text-stone-400': 'text-stone-500',
  'text-stone-300': 'text-stone-600',
  'text-emerald-900': 'text-emerald-300',
  'text-emerald-800': 'text-emerald-300',
  'text-emerald-700': 'text-emerald-300',
  'text-emerald-600': 'text-emerald-400',
  'text-amber-900': 'text-amber-300',
  'text-amber-800': 'text-amber-300',
  'text-amber-800/90': 'text-amber-300/90',
  'text-amber-700': 'text-amber-400',
  'text-amber-600': 'text-amber-400',
  'text-teal-700': 'text-teal-300',
  'text-teal-600': 'text-teal-400',
  'text-rose-600': 'text-rose-400',
  'text-rose-700': 'text-rose-400',
  'text-rose-500': 'text-rose-400',
  'text-orange-600': 'text-orange-400',
  'fill-stone-200': 'fill-stone-800',
  'hover:bg-emerald-50': 'hover:bg-emerald-900/30',
  'hover:bg-emerald-200/70': 'hover:bg-emerald-900/40',
  'hover:bg-stone-100': 'hover:bg-stone-800',
  'hover:bg-rose-50': 'hover:bg-rose-950/50',
  'hover:bg-teal-50': 'hover:bg-teal-950/50',
  'hover:border-emerald-200': 'hover:border-emerald-900',
  'hover:border-emerald-300': 'hover:border-emerald-700',
  'hover:border-emerald-400': 'hover:border-emerald-500',
  'hover:border-stone-300': 'hover:border-stone-700',
  'hover:text-emerald-700': 'hover:text-emerald-300',
  'hover:text-stone-700': 'hover:text-stone-200',
  'hover:text-stone-900': 'hover:text-stone-50',
  'hover:text-rose-600': 'hover:text-rose-400',
  'hover:text-rose-700': 'hover:text-rose-400',
  'group-hover:text-emerald-600': 'group-hover:text-emerald-400',
  '[&::-webkit-scrollbar-thumb]:bg-stone-300': '[&::-webkit-scrollbar-thumb]:bg-stone-700',
  '[&::-webkit-scrollbar-thumb]:bg-stone-200': '[&::-webkit-scrollbar-thumb]:bg-stone-700',
  '[&::-webkit-scrollbar-track]:bg-stone-100': '[&::-webkit-scrollbar-track]:bg-stone-800',
}

// longest tokens first so `bg-stone-50/60` is handled before `bg-stone-50` etc.
const ordered = Object.keys(RULES).sort((a, b) => b.length - a.length)

function buildRegex(token) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // boundary: line start, whitespace or quote (NOT `:` — avoids matching inside hover:/dark: prefixed tokens)
  return new RegExp(`(^|[\\s\\x22\\x27\\x60])(${esc})(?![A-Za-z0-9-])`, 'g')
}

const files = [
  'src/components/platform/onboarding.tsx',
  'src/components/platform/library-manager.tsx',
  'src/components/platform/tracks-manager.tsx',
  'src/components/platform/dashboard.tsx',
]

const base = '/home/z/my-project/'
const report = {}

for (const rel of files) {
  const path = base + rel
  const src = readFileSync(path, 'utf8')
  const lines = src.split('\n')
  let added = 0
  const perRule = {}
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    for (const token of ordered) {
      const darkClass = `dark:${RULES[token]}`
      if (line.includes(darkClass)) continue // already present (idempotent / collision guard)
      const re = buildRegex(token)
      if (!re.test(line)) continue
      re.lastIndex = 0
      let n = 0
      line = line.replace(re, (_m, p1, p2) => {
        n++
        return `${p1}${p2} ${darkClass}`
      })
      if (n > 0) {
        added += n
        perRule[token] = (perRule[token] || 0) + n
      }
    }
    lines[i] = line
  }
  writeFileSync(path, lines.join('\n'))
  report[rel] = { added, perRule }
}

for (const [rel, { added, perRule }] of Object.entries(report)) {
  console.log(`\n=== ${rel}: ${added} dark: classes added ===`)
  for (const [k, v] of Object.entries(perRule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v}x  ${k} -> dark:${RULES[k]}`)
  }
}
