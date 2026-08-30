import { execSync } from 'node:child_process'
const files = [
  'src/components/platform/marketplace.tsx',
  'src/components/platform/course-view.tsx',
  'src/components/platform/track-view.tsx',
  'src/components/platform/checkout.tsx',
]
const DARK_RE = /\s?dark:[^\s'"`]+/g
let bad = 0
for (const f of files) {
  const diff = execSync(`git diff -U0 -- ${f}`, { encoding: 'utf8' })
  let added = 0, removed = 0, lines = 0
  for (const l of diff.split('\n')) {
    if (l.startsWith('+') && !l.startsWith('+++')) {
      added++
      lines++
      const stripped = l.slice(1).replace(DARK_RE, '')
      // the stripped added line must appear as a removed/context line (i.e., original content preserved)
      if (!diff.includes('-' + stripped.trim()) && !diff.includes(' ' + stripped.trim())) {
        // fall back: search any removed line equal to stripped
        if (!diff.split('\n').some(x => (x.startsWith('-') && !x.startsWith('---')) && x.slice(1).trim() === stripped.trim())) {
          console.error(`NON-ADDITIVE in ${f}: ${stripped.trim().slice(0, 100)}`)
          bad++
        }
      }
    }
    if (l.startsWith('-') && !l.startsWith('---')) removed++
  }
  console.log(`${f}: ${lines} changed lines, -${removed}/+${added} (diff lines)`)
}
console.log(bad === 0 ? 'ADDITIVE CHECK: OK (all added lines reduce to original content)' : `ADDITIVE CHECK: ${bad} PROBLEMS`)
